import 'api_client.dart';

class AccueilApi {
  AccueilApi(this._api);

  final ApiClient _api;

  Future<Map<String, dynamic>> dashboard() async {
    final res = await _api.dio.get('/accueil/dashboard');
    return Map<String, dynamic>.from(res.data['data'] as Map? ?? {});
  }

  Future<List<dynamic>> demandes({String? statut}) async {
    final res = await _api.dio.get(
      '/accueil/demandes',
      queryParameters: {
        if (statut != null) 'statut': statut,
      },
    );
    return List<dynamic>.from(res.data['data'] as List? ?? []);
  }

  Future<List<dynamic>> rendezVous({String? date}) async {
    final res = await _api.dio.get(
      '/accueil/rendez-vous',
      queryParameters: {
        if (date != null) 'date': date,
      },
    );
    return List<dynamic>.from(res.data['data'] as List? ?? []);
  }

  Future<void> convertirRdv(int id) async {
    await _api.dio.post('/accueil/rendez-vous/$id/convertir');
  }

  Future<void> marquerAbsent(int id) async {
    await _api.dio.post('/accueil/rendez-vous/$id/absent');
  }

  Future<List<dynamic>> patients({String? q}) async {
    final res = await _api.dio.get(
      '/accueil/patients',
      queryParameters: {
        if (q != null && q.trim().isNotEmpty) 'q': q.trim(),
      },
    );
    return List<dynamic>.from(res.data['data'] as List? ?? []);
  }

  Future<Map<String, dynamic>> resetPatientPassword(int id) async {
    final res = await _api.dio.put('/accueil/patients/$id/reset-password');
    return Map<String, dynamic>.from(res.data['data'] as Map? ?? {});
  }
}
