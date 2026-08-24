/// URL de l'API Laravel Sanctum (`/api/v1`).
///
/// Production : build avec
/// `--dart-define=API_BASE_URL=https://VOTRE-API.onrender.com/api/v1`
///
/// Local / tunnel : `build-apk.ps1` lit `.api-public-url` ou cette valeur.
class ApiConfig {
  ApiConfig._();

  static const String _fallback = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://amen-api.onrender.com/api/v1',
  );

  static String get baseUrl => _fallback;

  static const Duration connectTimeout = Duration(seconds: 20);
  static const Duration receiveTimeout = Duration(seconds: 30);
}
