import '../../services/api_client.dart';
import '../../utils/json_safe.dart';
import '../local/cache_keys.dart';
import '../sync/sync_engine.dart';

class MedecinRepository {
  MedecinRepository({
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
      planning(),
      fileConsultation(),
      patients(),
      dossiers(),
      teleconsultations(),
    ]);
  }

  Future<Map<String, dynamic>> dashboard() async {
    final data = await _sync.pullAndCache('/medecin/dashboard', CacheKeys.medecinDashboard);
    return asDynMap(data);
  }

  Future<List<dynamic>> planning({String? date}) async {
    final data = await _sync.pullAndCache(
      '/medecin/planning',
      CacheKeys.medecinPlanning,
      query: {if (date != null) 'date': date},
    );
    if (data is List) return List<dynamic>.from(data);
    if (data is Map) {
      return asDynList(
        data['rdvs'] ?? data['items'] ?? data['planning'] ?? data['planning_du_jour'],
      );
    }
    return [];
  }

  Future<List<dynamic>> fileConsultation() async {
    final data = await _sync.pullAndCache('/medecin/file-consultation', CacheKeys.medecinFile);
    if (data is List) return List<dynamic>.from(data);
    if (data is Map) {
      return asDynList(data['items'] ?? data['file'] ?? data['admissions'] ?? data['file_consultation']);
    }
    return [];
  }

  Future<List<dynamic>> patients({String? q}) async {
    final data = await _sync.pullAndCache(
      '/medecin/patients',
      CacheKeys.medecinPatients,
      query: {if (q != null && q.trim().isNotEmpty) 'q': q.trim()},
    );
    return asDynList(data);
  }

  Future<Map<String, dynamic>> patientDetail(int id) async {
    final data = await _sync.pullAndCache(
      '/medecin/patients/$id',
      CacheKeys.patientDetail(id),
      cacheId: '$id',
    );
    return asDynMap(data);
  }

  Future<List<dynamic>> dossiers() async {
    final data = await _sync.pullAndCache('/medecin/dossiers', CacheKeys.medecinDossiers);
    return asDynList(data);
  }

  Future<Map<String, dynamic>> dossierDetail(int id) async {
    final data = await _sync.pullAndCache(
      '/medecin/dossiers/$id',
      CacheKeys.dossier(id),
      cacheId: '$id',
    );
    return asDynMap(data);
  }

  Future<void> createDossier(Map<String, dynamic> body) async {
    final res = await _sync.mutateOrQueue(method: 'POST', path: '/medecin/dossiers', body: body);
    if (res != null) await dossiers();
  }

  Future<void> updateDossier(int id, Map<String, dynamic> body) async {
    final res =
        await _sync.mutateOrQueue(method: 'PUT', path: '/medecin/dossiers/$id', body: body);
    if (res != null) {
      await dossiers();
      await dossierDetail(id);
    }
  }

  Future<void> createPrescription(Map<String, dynamic> body) async {
    await _sync.mutateOrQueue(method: 'POST', path: '/medecin/prescriptions', body: body);
  }

  Future<void> updatePrescription(int id, Map<String, dynamic> body) async {
    await _sync.mutateOrQueue(method: 'PUT', path: '/medecin/prescriptions/$id', body: body);
  }

  Future<void> annulerPrescription(int id) async {
    await _sync.mutateOrQueue(method: 'PUT', path: '/medecin/prescriptions/$id/annuler');
  }

  Future<void> updateRdvStatut(int id, String statut) async {
    final res = await _sync.mutateOrQueue(
      method: 'PUT',
      path: '/medecin/rendez-vous/$id/statut',
      body: {'statut': statut},
    );
    if (res != null) {
      await dashboard();
      await planning();
    } else {
      final dash = await _sync.readCacheMap(CacheKeys.medecinDashboard) ?? {};
      final list = asDynList(
        dash['planning_du_jour'] ?? dash['rdv_aujourdhui'] ?? dash['prochains_rdv'],
      );
      final next = list.map((raw) {
        final m = asDynMap(raw);
        if (asInt(m['id']) == id) m['statut'] = statut;
        return m;
      }).toList();
      dash['planning_du_jour'] = next;
      await _sync.cacheJson(CacheKeys.medecinDashboard, dash);
    }
  }

  Future<void> creerRendezVous(Map<String, dynamic> body) async {
    final res =
        await _sync.mutateOrQueue(method: 'POST', path: '/medecin/rendez-vous', body: body);
    if (res != null) await planning();
  }

  Future<void> episodeDecision(int id, Map<String, dynamic> body) async {
    await _sync.mutateOrQueue(
      method: 'POST',
      path: '/medecin/episodes/$id/decision',
      body: body,
    );
    await fileConsultation();
  }

  Future<void> episodeAvancer(int id, Map<String, dynamic> body) async {
    await _sync.mutateOrQueue(
      method: 'PUT',
      path: '/medecin/episodes/$id/avancer',
      body: body,
    );
    await fileConsultation();
  }

  Future<List<dynamic>> teleconsultations() async {
    final data =
        await _sync.pullAndCache('/teleconsultation', CacheKeys.medecinTeleconsult);
    return asDynList(data);
  }

  Future<Map<String, dynamic>> rejoindreTeleconsult(int id) async {
    if (!_sync.isOnline) {
      throw StateError('La téléconsultation nécessite une connexion Internet.');
    }
    final res = await _api.dio.post('/teleconsultation/$id/rejoindre');
    return asDynMap(res.data['data']);
  }

  Future<void> fermerTeleconsult(int id) async {
    if (!_sync.isOnline) {
      throw StateError('Action disponible uniquement en ligne.');
    }
    await _api.dio.post('/teleconsultation/$id/fermer');
    await teleconsultations();
  }

  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> body) async {
    final res = await _sync.mutateOrQueue(method: 'PUT', path: '/profile', body: body);
    if (res != null) {
      final user = Map<String, dynamic>.from(res.data['data'] as Map? ?? body);
      await _sync.cacheUserProfile(user);
      return user;
    }
    return body;
  }
}
