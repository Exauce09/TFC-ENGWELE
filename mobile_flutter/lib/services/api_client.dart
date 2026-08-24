import 'package:dio/dio.dart';

import '../config/api_config.dart';

typedef UnauthorizedCallback = void Function();

class ApiClient {
  ApiClient({
    required Future<String?> Function() tokenProvider,
    UnauthorizedCallback? onUnauthorized,
  }) : _tokenProvider = tokenProvider,
       _onUnauthorized = onUnauthorized {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConfig.baseUrl,
        connectTimeout: ApiConfig.connectTimeout,
        receiveTimeout: ApiConfig.receiveTimeout,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _tokenProvider();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) {
          if (error.response?.statusCode == 401) {
            _onUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  late final Dio _dio;
  final Future<String?> Function() _tokenProvider;
  final UnauthorizedCallback? _onUnauthorized;

  Dio get dio => _dio;

  String friendlyError(Object error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
        case DioExceptionType.sendTimeout:
        case DioExceptionType.receiveTimeout:
          return 'Délai dépassé. Vérifiez votre connexion et l’URL de l’API.';
        case DioExceptionType.connectionError:
          return 'Serveur inaccessible (${ApiConfig.baseUrl}). '
              'Vérifiez le réseau ou l’IP / domaine de l’API.';
        case DioExceptionType.badResponse:
          final data = error.response?.data;
          if (data is Map) {
            final errors = data['errors'];
            if (errors is Map && errors.isNotEmpty) {
              final first = errors.values.first;
              if (first is List && first.isNotEmpty) return first.first.toString();
              return first.toString();
            }
            if (data['message'] != null) return data['message'].toString();
          }
          return 'Erreur serveur (${error.response?.statusCode}).';
        default:
          return error.message ?? 'Erreur réseau.';
      }
    }
    return error.toString();
  }
}
