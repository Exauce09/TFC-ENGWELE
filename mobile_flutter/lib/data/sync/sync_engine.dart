import 'dart:async';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';

import '../../services/api_client.dart';
import '../local/app_database.dart';
import '../local/cache_keys.dart';
import 'sync_status.dart';

typedef RoleSyncPull = Future<void> Function();

/// Moteur push (outbox) + pull (GET → Drift) + état réseau.
class SyncEngine extends ChangeNotifier {
  SyncEngine({
    required AppDatabase db,
    required ApiClient api,
  })  : _db = db,
        _api = api;

  final AppDatabase _db;
  final ApiClient _api;
  final _uuid = const Uuid();

  StreamSubscription<List<ConnectivityResult>>? _sub;
  Timer? _periodic;
  bool _online = true;
  bool _syncing = false;
  String? _lastError;
  int _pendingCount = 0;
  RoleSyncPull? _rolePull;

  bool get isOnline => _online;
  bool get isSyncing => _syncing;
  String? get lastError => _lastError;
  int get pendingCount => _pendingCount;

  SyncUiStatus get uiStatus {
    if (!_online) return SyncUiStatus.offline;
    if (_syncing) return SyncUiStatus.syncing;
    if (_lastError != null) return SyncUiStatus.error;
    if (_pendingCount > 0) return SyncUiStatus.pending;
    return SyncUiStatus.synced;
  }

  void setRolePull(RoleSyncPull? pull) => _rolePull = pull;

  Future<void> start() async {
    final results = await Connectivity().checkConnectivity();
    _online = results.any((r) => r != ConnectivityResult.none);
    await _refreshPending();
    _sub = Connectivity().onConnectivityChanged.listen((results) async {
      final next = results.any((r) => r != ConnectivityResult.none);
      final wasOffline = !_online;
      _online = next;
      notifyListeners();
      if (wasOffline && _online) {
        await syncNow();
      }
    });
    _periodic = Timer.periodic(const Duration(minutes: 2), (_) {
      if (_online) syncNow();
    });
    notifyListeners();
    if (_online) {
      unawaited(syncNow());
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    _periodic?.cancel();
    super.dispose();
  }

  Future<void> _refreshPending() async {
    final items = await _db.pendingOutbox();
    _pendingCount = items.where((e) => e.status == 'pending').length;
  }

  Future<String> enqueueMutation({
    required String method,
    required String path,
    Map<String, dynamic>? body,
  }) async {
    final clientId = _uuid.v4();
    await _db.enqueueOutbox(
      clientId: clientId,
      method: method.toUpperCase(),
      path: path,
      bodyJson: body == null ? null : jsonEncode(body),
    );
    await _refreshPending();
    notifyListeners();
    if (_online) {
      unawaited(syncNow());
    }
    return clientId;
  }

  /// Tente l'API ; si réseau KO, met en outbox. Retourne la réponse ou null si offline queue.
  Future<Response<dynamic>?> mutateOrQueue({
    required String method,
    required String path,
    Map<String, dynamic>? body,
    bool queueIfOffline = true,
  }) async {
    if (!_online) {
      if (queueIfOffline) {
        await enqueueMutation(method: method, path: path, body: body);
      }
      return null;
    }
    try {
      return await _request(method, path, body);
    } on DioException catch (e) {
      if (_isNetworkError(e) && queueIfOffline) {
        await enqueueMutation(method: method, path: path, body: body);
        return null;
      }
      rethrow;
    }
  }

  Future<Response<dynamic>> _request(
    String method,
    String path,
    Map<String, dynamic>? body,
  ) {
    final m = method.toUpperCase();
    switch (m) {
      case 'POST':
        return _api.dio.post(path, data: body);
      case 'PUT':
        return _api.dio.put(path, data: body);
      case 'PATCH':
        return _api.dio.patch(path, data: body);
      case 'DELETE':
        return _api.dio.delete(path, data: body);
      default:
        return _api.dio.request(path, data: body, options: Options(method: m));
    }
  }

  bool _isNetworkError(DioException e) {
    return e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout ||
        e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.unknown;
  }

  Future<void> syncNow() async {
    if (_syncing || !_online) return;
    _syncing = true;
    _lastError = null;
    notifyListeners();
    try {
      await _pushOutbox();
      if (_rolePull != null) {
        await _rolePull!();
      }
      await _db.setMeta('last_sync_at', DateTime.now().toIso8601String());
    } catch (e) {
      _lastError = _api.friendlyError(e);
    } finally {
      await _refreshPending();
      _syncing = false;
      notifyListeners();
    }
  }

  Future<void> _pushOutbox() async {
    final items = await _db.pendingOutbox();
    for (final item in items) {
      if (item.status == 'failed' && item.attempts >= 5) continue;
      try {
        Map<String, dynamic>? body;
        if (item.bodyJson != null && item.bodyJson!.isNotEmpty) {
          body = Map<String, dynamic>.from(jsonDecode(item.bodyJson!) as Map);
        }
        await _request(item.method, item.path, body);
        await _db.setOutboxStatus(item.id, 'done', attempts: item.attempts + 1);
      } on DioException catch (e) {
        final code = e.response?.statusCode ?? 0;
        if (code == 422 || code == 409 || code == 400 || code == 403 || code == 404) {
          await _db.setOutboxStatus(
            item.id,
            'failed',
            error: _api.friendlyError(e),
            attempts: item.attempts + 1,
          );
        } else if (_isNetworkError(e)) {
          await _db.setOutboxStatus(
            item.id,
            'pending',
            error: _api.friendlyError(e),
            attempts: item.attempts + 1,
          );
          rethrow;
        } else {
          await _db.setOutboxStatus(
            item.id,
            'failed',
            error: _api.friendlyError(e),
            attempts: item.attempts + 1,
          );
        }
      }
    }
  }

  Future<void> cacheJson(String type, Object data, {String id = ''}) {
    return _db.upsertCache(type: type, id: id, json: jsonEncode(data));
  }

  Future<dynamic> readCache(String type, {String id = ''}) async {
    final raw = await _db.getCacheJson(type, id);
    if (raw == null) return null;
    return jsonDecode(raw);
  }

  Future<List<Map<String, dynamic>>> readCacheList(String type) async {
    final data = await readCache(type);
    if (data is List) {
      return data.map((e) => Map<String, dynamic>.from(e as Map)).toList();
    }
    return [];
  }

  Future<Map<String, dynamic>?> readCacheMap(String type, {String id = ''}) async {
    final data = await readCache(type, id: id);
    if (data is Map) return Map<String, dynamic>.from(data);
    return null;
  }

  /// GET + upsert cache. Si offline, retourne le cache.
  Future<dynamic> pullAndCache(
    String path,
    String cacheType, {
    String cacheId = '',
    Map<String, dynamic>? query,
    dynamic Function(dynamic raw)? extract,
  }) async {
    if (!_online) {
      return readCache(cacheType, id: cacheId);
    }
    try {
      final res = await _api.dio.get(path, queryParameters: query);
      var data = res.data['data'];
      if (extract != null) data = extract(data);
      if (data != null) {
        await cacheJson(cacheType, data, id: cacheId);
      }
      return data ?? await readCache(cacheType, id: cacheId);
    } on DioException catch (e) {
      if (_isNetworkError(e)) {
        return readCache(cacheType, id: cacheId);
      }
      rethrow;
    }
  }

  Future<List<SyncOutboxItem>> listPendingActions() => _db.pendingOutbox();

  /// Helpers typés utilisés au bootstrap.
  Future<void> cacheUserProfile(Map<String, dynamic> user) {
    return cacheJson(CacheKeys.user, user);
  }
}
