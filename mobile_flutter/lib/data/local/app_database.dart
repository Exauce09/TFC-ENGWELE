import 'dart:io';

import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

/// Cache générique (payload JSON par ressource).
class CachedResources extends Table {
  TextColumn get resourceType => text()();
  TextColumn get resourceId => text().withDefault(const Constant(''))();
  TextColumn get payloadJson => text()();
  TextColumn get syncStatus => text().withDefault(const Constant('synced'))();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {resourceType, resourceId};
}

/// File d'attente des mutations à pousser vers Laravel.
class SyncOutboxItems extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get clientId => text()();
  TextColumn get method => text()();
  TextColumn get path => text()();
  TextColumn get bodyJson => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('pending'))();
  TextColumn get lastError => text().nullable()();
  IntColumn get attempts => integer().withDefault(const Constant(0))();
  DateTimeColumn get createdAt => dateTime()();
}

class SyncMetaItems extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();

  @override
  Set<Column> get primaryKey => {key};
}

@DriftDatabase(tables: [CachedResources, SyncOutboxItems, SyncMetaItems])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  AppDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 1;

  Future<void> upsertCache({
    required String type,
    required String id,
    required String json,
    String status = 'synced',
  }) {
    return into(cachedResources).insertOnConflictUpdate(
      CachedResourcesCompanion.insert(
        resourceType: type,
        resourceId: Value(id),
        payloadJson: json,
        syncStatus: Value(status),
        updatedAt: DateTime.now(),
      ),
    );
  }

  Future<String?> getCacheJson(String type, [String id = '']) async {
    final row = await (select(cachedResources)
          ..where((t) => t.resourceType.equals(type) & t.resourceId.equals(id)))
        .getSingleOrNull();
    return row?.payloadJson;
  }

  Future<List<CachedResource>> listCache(String type) {
    return (select(cachedResources)..where((t) => t.resourceType.equals(type)))
        .get();
  }

  Future<void> clearCacheType(String type) {
    return (delete(cachedResources)..where((t) => t.resourceType.equals(type)))
        .go();
  }

  Future<int> enqueueOutbox({
    required String clientId,
    required String method,
    required String path,
    String? bodyJson,
  }) {
    return into(syncOutboxItems).insert(
      SyncOutboxItemsCompanion.insert(
        clientId: clientId,
        method: method,
        path: path,
        bodyJson: Value(bodyJson),
        createdAt: DateTime.now(),
      ),
    );
  }

  Future<List<SyncOutboxItem>> pendingOutbox() {
    return (select(syncOutboxItems)
          ..where((t) => t.status.equals('pending') | t.status.equals('failed'))
          ..orderBy([(t) => OrderingTerm.asc(t.createdAt)]))
        .get();
  }

  Future<void> setOutboxStatus(int id, String status, {String? error, int? attempts}) {
    return (update(syncOutboxItems)..where((t) => t.id.equals(id))).write(
      SyncOutboxItemsCompanion(
        status: Value(status),
        lastError: Value(error),
        attempts: attempts == null ? const Value.absent() : Value(attempts),
      ),
    );
  }

  Future<void> setMeta(String key, String value) {
    return into(syncMetaItems).insertOnConflictUpdate(
      SyncMetaItemsCompanion.insert(key: key, value: value),
    );
  }

  Future<String?> getMeta(String key) async {
    final row = await (select(syncMetaItems)..where((t) => t.key.equals(key)))
        .getSingleOrNull();
    return row?.value;
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File(p.join(dir.path, 'amen_offline.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
