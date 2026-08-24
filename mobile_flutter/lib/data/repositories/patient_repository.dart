import '../../services/api_client.dart';
import '../../utils/json_safe.dart';
import '../local/cache_keys.dart';
import '../sync/sync_engine.dart';

class PatientRepository {
  PatientRepository({
    required SyncEngine sync,
    required ApiClient api,
  })  : _sync = sync,
        _api = api;

  final SyncEngine _sync;
  final ApiClient _api;

  SyncEngine get sync => _sync;
  ApiClient get api => _api;

  Future<void> pullAll() async {
    await Future.wait([
      dashboard(),
      rendezVous(),
      factures(),
      dossier(),
      prescriptions(),
      notifications(),
      teleconsultations(),
      departements(),
      medecins(),
    ]);
  }

  Future<Map<String, dynamic>> dashboard() async {
    final data = await _sync.pullAndCache('/patient/dashboard', CacheKeys.patientDashboard);
    return asDynMap(data);
  }

  Future<List<dynamic>> rendezVous() async {
    final data = await _sync.pullAndCache('/patient/rendez-vous', CacheKeys.patientRdvs);
    return asDynList(data);
  }

  Future<List<dynamic>> creneaux({
    required int medecinId,
    required String date,
  }) async {
    if (!_sync.isOnline) return [];
    final res = await _api.dio.get(
      '/patient/creneaux',
      queryParameters: {'medecin_id': medecinId, 'date': date},
    );
    return List<dynamic>.from(res.data['data'] as List? ?? []);
  }

  Future<void> prendreRendezVous(Map<String, dynamic> body) async {
    final res = await _sync.mutateOrQueue(
      method: 'POST',
      path: '/patient/rendez-vous',
      body: body,
    );
    if (res != null) {
      await rendezVous();
      await dashboard();
    } else {
      // Optimistic local append
      final list = await _sync.readCacheList(CacheKeys.patientRdvs);
      list.insert(0, {
        ...body,
        'id': DateTime.now().millisecondsSinceEpoch,
        'statut': 'en_attente',
        'sync_status': 'pending',
      });
      await _sync.cacheJson(CacheKeys.patientRdvs, list);
    }
  }

  Future<void> reporterRendezVous(int id, Map<String, dynamic> body) async {
    final res = await _sync.mutateOrQueue(
      method: 'PUT',
      path: '/patient/rendez-vous/$id/reporter',
      body: body,
    );
    if (res != null) await rendezVous();
  }

  Future<void> annulerRendezVous(int id) async {
    final res = await _sync.mutateOrQueue(
      method: 'DELETE',
      path: '/patient/rendez-vous/$id',
    );
    if (res != null) {
      await rendezVous();
    } else {
      final list = await _sync.readCacheList(CacheKeys.patientRdvs);
      final next = list.map((e) {
        if ((e['id'] as num?)?.toInt() == id) {
          return {...e, 'statut': 'annule', 'sync_status': 'pending'};
        }
        return e;
      }).toList();
      await _sync.cacheJson(CacheKeys.patientRdvs, next);
    }
  }

  Future<void> payerRendezVous(int id, Map<String, dynamic> body) async {
    await _sync.mutateOrQueue(
      method: 'POST',
      path: '/patient/rendez-vous/$id/paiement',
      body: body,
    );
    await rendezVous();
  }

  Future<List<dynamic>> factures() async {
    final data = await _sync.pullAndCache('/patient/factures', CacheKeys.patientFactures);
    return asDynList(data);
  }

  Future<Map<String, dynamic>> factureDetail(int id) async {
    final data = await _sync.pullAndCache(
      '/patient/factures/$id',
      CacheKeys.facture(id),
      cacheId: '$id',
    );
    return asDynMap(data);
  }

  Future<void> payerFacture(int id, {required String mode, required String telephone}) async {
    final body = {'mode': mode, 'telephone': telephone};
    final res = await _sync.mutateOrQueue(
      method: 'POST',
      path: '/patient/factures/$id/paiement',
      body: body,
    );
    if (res != null) {
      await factures();
      await factureDetail(id);
    }
  }

  Future<Map<String, dynamic>> dossier() async {
    final data = await _sync.pullAndCache('/patient/dossier', CacheKeys.patientDossier);
    return asDynMap(data);
  }

  Future<List<dynamic>> prescriptions() async {
    final data =
        await _sync.pullAndCache('/patient/prescriptions', CacheKeys.patientPrescriptions);
    return asDynList(data);
  }

  Future<List<dynamic>> notifications() async {
    final data =
        await _sync.pullAndCache('/notifications', CacheKeys.patientNotifications);
    return asDynList(data);
  }

  Future<void> marquerNotificationLu(int id) async {
    await _sync.mutateOrQueue(method: 'PUT', path: '/notifications/$id/lu');
    await notifications();
  }

  Future<void> toutLireNotifications() async {
    await _sync.mutateOrQueue(method: 'PUT', path: '/notifications/tout-lire');
    await notifications();
  }

  Future<List<dynamic>> teleconsultations() async {
    final data =
        await _sync.pullAndCache('/teleconsultation', CacheKeys.patientTeleconsult);
    return asDynList(data);
  }

  Future<Map<String, dynamic>> rejoindreTeleconsult(int id) async {
    if (!_sync.isOnline) {
      throw StateError('La téléconsultation nécessite une connexion Internet.');
    }
    final res = await _api.dio.post('/teleconsultation/$id/rejoindre');
    return asDynMap(res.data['data']);
  }

  Future<List<dynamic>> departements() async {
    final data = await _sync.pullAndCache('/departements', CacheKeys.departements);
    return asDynList(data);
  }

  Future<List<dynamic>> medecins({int? departementId}) async {
    final filtered = asDynList(await _sync.pullAndCache(
      '/medecins',
      CacheKeys.medecins,
      cacheId: departementId != null ? 'dept_$departementId' : 'all',
      query: {
        if (departementId != null) 'departement_id': departementId,
      },
    ));
    if (departementId == null || filtered.isNotEmpty) return filtered;

    final all = asDynList(await _sync.pullAndCache(
      '/medecins',
      CacheKeys.medecins,
      cacheId: 'all',
    ));
    return all.where((raw) {
      final m = asDynMap(raw);
      final user = asDynMap(m['user']);
      return asInt(m['departement_id'] ?? user['departement_id']) == departementId;
    }).toList();
  }

  Future<void> completeOnboarding(Map<String, dynamic> body) async {
    if (!_sync.isOnline) {
      throw StateError('La première connexion nécessite Internet.');
    }
    await _api.dio.post('/patient/premiere-connexion', data: body);
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> body) async {
    final res = await _sync.mutateOrQueue(method: 'PUT', path: '/profile', body: body);
    if (res != null) {
      final user = asDynMap(res.data['data']).isEmpty ? body : asDynMap(res.data['data']);
      await _sync.cacheUserProfile(user);
      return user;
    }
    return body;
  }
}
