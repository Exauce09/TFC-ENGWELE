import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../data/local/app_database.dart';
import '../data/repositories/medecin_repository.dart';
import '../data/repositories/patient_repository.dart';
import '../data/sync/sync_engine.dart';
import '../models/auth_user.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/auth_storage.dart';
import '../services/accueil_api.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider() {
    _storage = AuthStorage();
    _db = AppDatabase();
    _api = ApiClient(
      tokenProvider: () => _storage.getToken(),
      onUnauthorized: () {
        _user = null;
        notifyListeners();
      },
    );
    _auth = AuthService(api: _api, storage: _storage);
    _sync = SyncEngine(db: _db, api: _api);
    _patientRepo = PatientRepository(sync: _sync, api: _api);
    _medecinRepo = MedecinRepository(sync: _sync, api: _api);
    _accueilApi = AccueilApi(_api);
    bootstrap();
  }

  late final AuthStorage _storage;
  late final AppDatabase _db;
  late final ApiClient _api;
  late final AuthService _auth;
  late final SyncEngine _sync;
  late final PatientRepository _patientRepo;
  late final MedecinRepository _medecinRepo;
  late final AccueilApi _accueilApi;

  AuthUser? _user;
  bool _loading = true;
  String? _error;

  AuthUser? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;
  String? get error => _error;
  ApiClient get api => _api;
  SyncEngine get sync => _sync;
  PatientRepository get patientRepo => _patientRepo;
  MedecinRepository get medecinRepo => _medecinRepo;
  AccueilApi get accueilApi => _accueilApi;
  AppDatabase get db => _db;

  /// Compat écrans legacy.
  PatientRepository get patientApi => _patientRepo;
  MedecinRepository get medecinApi => _medecinRepo;

  Future<void> bootstrap() async {
    _loading = true;
    notifyListeners();
    try {
      await _sync.start();
      final token = await _storage.getToken();
      final cached = await _storage.getUser();
      if (token != null && cached != null) {
        _user = cached;
        _bindRolePull();
        notifyListeners();
        try {
          _user = await _auth.me();
          await _sync.cacheUserProfile(_user!.toJson());
        } on DioException catch (e) {
          // Hors ligne : garder le profil cache
          if (e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.unknown) {
            // keep cached
          } else if (e.response?.statusCode == 401) {
            await _storage.clear();
            _user = null;
          }
        }
      }
    } catch (_) {
      // Si me échoue hors ligne avec cache, on garde ; sinon clear seulement sans cache
      final cached = await _storage.getUser();
      final token = await _storage.getToken();
      if (token == null || cached == null) {
        await _storage.clear();
        _user = null;
      } else {
        _user = cached;
      }
    } finally {
      _bindRolePull();
      _loading = false;
      notifyListeners();
      if (_user != null && _sync.isOnline) {
        _sync.syncNow();
      }
    }
  }

  void _bindRolePull() {
    final u = _user;
    if (u == null) {
      _sync.setRolePull(null);
      return;
    }
    if (u.isPatient) {
      _sync.setRolePull(() => _patientRepo.pullAll());
    } else if (u.isMedecin) {
      _sync.setRolePull(() => _medecinRepo.pullAll());
    } else {
      _sync.setRolePull(null);
    }
  }

  Future<void> login(String email, String password) async {
    _error = null;
    notifyListeners();
    try {
      _user = await _auth.login(email, password);
      await _sync.cacheUserProfile(_user!.toJson());
      _bindRolePull();
      notifyListeners();
      if (_sync.isOnline) {
        await _sync.syncNow();
      }
    } catch (e) {
      _error = _api.friendlyError(e);
      notifyListeners();
      rethrow;
    }
  }

  Future<void> logout() async {
    await _auth.logout();
    _sync.setRolePull(null);
    _user = null;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      _user = await _auth.me();
      await _sync.cacheUserProfile(_user!.toJson());
      _bindRolePull();
      notifyListeners();
    } catch (_) {
      // keep cached
    }
  }

  Future<void> completePatientOnboarding(Map<String, dynamic> body) async {
    await _patientRepo.completeOnboarding(body);
    await refreshUser();
  }

  @override
  void dispose() {
    _sync.dispose();
    _db.close();
    super.dispose();
  }
}
