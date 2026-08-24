class AuthUser {
  AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.avatar,
    this.sexe,
    this.loginIdentifiant,
    this.needsOnboarding = false,
    this.patient,
  });

  final int id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? avatar;
  final String? sexe;
  final String? loginIdentifiant;
  final bool needsOnboarding;
  final Map<String, dynamic>? patient;

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? nested;
    final rawPatient = json['patient'];
    if (rawPatient is Map) {
      nested = Map<String, dynamic>.from(rawPatient);
    }
    return AuthUser(
      id: (json['id'] as num?)?.toInt() ?? 0,
      name: (json['name'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      role: (json['role'] ?? '').toString(),
      phone: json['phone']?.toString(),
      avatar: json['avatar']?.toString(),
      sexe: (json['sexe'] ?? nested?['sexe'])?.toString(),
      loginIdentifiant: json['login_identifiant']?.toString(),
      needsOnboarding: json['needs_onboarding'] == true,
      patient: nested,
    );
  }

  static AuthUser fromDynamic(dynamic raw) {
    final map = Map<String, dynamic>.from(raw as Map);
    return AuthUser.fromJson(map);
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'role': role,
        'phone': phone,
        'avatar': avatar,
        'sexe': sexe,
        'login_identifiant': loginIdentifiant,
        'needs_onboarding': needsOnboarding,
        if (patient != null) 'patient': patient,
      };

  bool get isPatient => role == 'patient';

  bool get isReceptionniste => role == 'receptionniste';

  bool get isMedecin => const {
        'medecin_generaliste',
        'medecin_interne',
        'pediatre',
        'gynecologue',
        'ophtalmologue',
        'urgentiste',
        'chirurgien',
        'anesthesiste',
      }.contains(role);

  /// Route d’accueil après login / splash.
  String get homePath {
    if (isPatient) return '/patient';
    if (isMedecin) return '/medecin/accueil';
    if (isReceptionniste) return '/accueil';
    return '/staff';
  }

  String get initial {
    final n = name.trim();
    if (n.isEmpty) return '?';
    return n.substring(0, 1).toUpperCase();
  }

  String get numeroPatient {
    final n = patient?['numero_patient']?.toString().trim();
    if (n != null && n.isNotEmpty) return n;
    return '';
  }
}

const roleLabels = <String, String>{
  'patient': 'Patient',
  'medecin_generaliste': 'Médecin généraliste',
  'medecin_interne': 'Médecin interne',
  'pediatre': 'Pédiatre',
  'gynecologue': 'Gynécologue',
  'ophtalmologue': 'Ophtalmologue',
  'urgentiste': 'Urgentiste',
  'admin': 'Administrateur',
  'laborantin': 'Laborantin',
  'pharmacien': 'Pharmacien',
  'caissier': 'Caissier',
  'infirmier': 'Infirmier(e)',
  'receptionniste': 'Réceptionniste',
  'sage_femme': 'Sage-femme',
  'chirurgien': 'Chirurgien',
  'anesthesiste': 'Anesthésiste',
  'echographiste': 'Échographiste',
  'kinesitherapeute': 'Kinésithérapeute',
  'dentiste': 'Dentiste',
};

String roleLabel(String? role) => roleLabels[role] ?? role ?? 'Utilisateur';
