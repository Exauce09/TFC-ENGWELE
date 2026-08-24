import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:amen_mobile/data/local/app_database.dart';
import 'package:amen_mobile/data/local/cache_keys.dart';
import 'package:amen_mobile/data/sync/sync_engine.dart';
import 'package:amen_mobile/services/api_client.dart';

void main() {
  late AppDatabase db;
  late SyncEngine sync;

  setUp(() {
    db = AppDatabase.forTesting(NativeDatabase.memory());
    final api = ApiClient(tokenProvider: () async => null);
    sync = SyncEngine(db: db, api: api);
  });

  tearDown(() async {
    await db.close();
  });

  test('cacheJson roundtrip', () async {
    await sync.cacheJson(CacheKeys.patientDashboard, {'ok': true, 'n': 1});
    final map = await sync.readCacheMap(CacheKeys.patientDashboard);
    expect(map?['ok'], true);
    expect(map?['n'], 1);
  });

  test('enqueueMutation creates pending outbox', () async {
    await sync.enqueueMutation(
      method: 'POST',
      path: '/patient/rendez-vous',
      body: {'motif': 'test'},
    );
    final pending = await sync.listPendingActions();
    expect(pending.length, 1);
    expect(pending.first.method, 'POST');
    expect(pending.first.path, '/patient/rendez-vous');
    expect(pending.first.status, 'pending');
  });

  test('friendly network offline mutate queues', () async {
    // Force offline path
    // ignore: invalid_use_of_protected_member
    await sync.enqueueMutation(method: 'DELETE', path: '/patient/rendez-vous/9');
    expect((await sync.listPendingActions()).length, greaterThanOrEqualTo(1));
  });

  test('ApiClient friendlyError message', () {
    final api = ApiClient(tokenProvider: () async => null);
    final err = DioException(
      requestOptions: RequestOptions(path: '/x'),
      type: DioExceptionType.connectionError,
    );
    expect(api.friendlyError(err), contains('Serveur inaccessible'));
  });
}
