import 'package:dio/dio.dart';

import '../models/auth_user.dart';
import 'api_client.dart';
import 'auth_storage.dart';

class AuthService {
  AuthService({
    required ApiClient api,
    required AuthStorage storage,
  })  : _api = api,
        _storage = storage;

  final ApiClient _api;
  final AuthStorage _storage;

  Future<AuthUser> login(String email, String password) async {
    final res = await _api.dio.post(
      '/login',
      data: {'email': email.trim(), 'password': password},
    );
    final data = Map<String, dynamic>.from(res.data['data'] as Map);
    final token = data['token']?.toString();
    if (token == null || token.isEmpty) {
      throw StateError('Token manquant dans la réponse serveur');
    }
    final user = AuthUser.fromDynamic(data['user']);
    await _storage.saveAuth(token, user);
    return user;
  }

  Future<AuthUser> me() async {
    final res = await _api.dio.get('/me');
    final user = AuthUser.fromDynamic(res.data['data']);
    final token = await _storage.getToken();
    if (token != null) {
      await _storage.saveAuth(token, user);
    }
    return user;
  }

  Future<void> logout() async {
    try {
      await _api.dio.post('/logout');
    } on DioException {
      // ignore network errors on logout
    } finally {
      await _storage.clear();
    }
  }
}
