/// Casts JSON sûrs — évite les crashs `as List` / `as Map` quand l’API renvoie un int/null.
List<dynamic> asDynList(dynamic value) {
  if (value is List) return List<dynamic>.from(value);
  return const [];
}

Map<String, dynamic> asDynMap(dynamic value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return <String, dynamic>{};
}

int asInt(dynamic value, [int fallback = 0]) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? fallback;
}

String asStr(dynamic value, [String fallback = '']) {
  if (value == null) return fallback;
  final s = value.toString().trim();
  return s.isEmpty ? fallback : s;
}
