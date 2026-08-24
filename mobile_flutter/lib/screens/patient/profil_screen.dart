import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/api_config.dart';
import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../utils/json_safe.dart';
import '../../widgets/sync_banner.dart';

class PatientProfilScreen extends StatefulWidget {
  const PatientProfilScreen({super.key});

  @override
  State<PatientProfilScreen> createState() => _PatientProfilScreenState();
}

class _PatientProfilScreenState extends State<PatientProfilScreen> {
  late final TextEditingController _phone;
  bool _busy = false;
  bool _editing = false;
  Map<String, dynamic> _dossierPatient = {};
  Map<String, dynamic> _dashboard = {};

  @override
  void initState() {
    super.initState();
    final u = context.read<AuthProvider>().user;
    _phone = TextEditingController(text: u?.phone ?? '');
    WidgetsBinding.instance.addPostFrameCallback((_) => _hydrate());
  }

  @override
  void dispose() {
    _phone.dispose();
    super.dispose();
  }

  Future<void> _hydrate() async {
    final auth = context.read<AuthProvider>();
    try {
      await auth.refreshUser();
      final results = await Future.wait([
        auth.patientRepo.dossier(),
        auth.patientRepo.dashboard(),
      ]);
      if (!mounted) return;
      final dossier = asDynMap(results[0]);
      setState(() {
        _dossierPatient = asDynMap(dossier['patient']);
        _dashboard = asDynMap(results[1]);
        final u = auth.user;
        if (u != null) {
          _phone.text = u.phone ?? _phone.text;
        }
      });
    } catch (_) {
      // Hors ligne : on affiche le cache /me.
    }
  }

  Map<String, dynamic> get _p {
    if (_dossierPatient.isNotEmpty) return _dossierPatient;
    return context.read<AuthProvider>().user?.patient ?? {};
  }

  String _str(dynamic v, [String fallback = '—']) {
    final s = asStr(v);
    return s.isEmpty ? fallback : s;
  }

  String _sexeLabel(String? code) {
    if (code == 'F') return 'Féminin';
    if (code == 'M') return 'Masculin';
    return '—';
  }

  String get _adresse {
    final p = _p;
    final parts = [
      asStr(p['adresse']),
      asStr(p['quartier']),
      asStr(p['commune']),
      asStr(p['ville']),
    ].where((s) => s.isNotEmpty).toList();
    return parts.isEmpty ? '—' : parts.join(', ');
  }

  Future<void> _save() async {
    FocusScope.of(context).unfocus();
    final auth = context.read<AuthProvider>();
    setState(() => _busy = true);
    try {
      await auth.patientRepo.updateProfile({
        'phone': _phone.text.trim(),
      });
      await auth.refreshUser();
      if (!mounted) return;
      setState(() => _editing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.sync.isOnline ? 'Profil enregistré' : 'Modifications en file de sync')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final p = _p;
    final numero = asStr(
      p['numero_patient'] ?? _dashboard['numero_patient'] ?? user?.numeroPatient,
      '—',
    );
    final allergies = asStr(p['allergies']);
    final contactNom = asStr(p['contact_urgence_nom']);
    final contactTel = asStr(p['contact_urgence_tel']);
    final groupe = asStr(p['groupe_sanguin']);
    final sexe = _sexeLabel(asStr(p['sexe'] ?? user?.sexe, ''));
    final admission = asDynMap(_dashboard['admission_en_cours']);

    return Scaffold(
      backgroundColor: AmenColors.wash,
      body: SyncScaffoldBody(
        child: ListView(
          padding: const EdgeInsets.only(bottom: 32),
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [AmenColors.primaryDeep, AmenColors.primary],
                ),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 42,
                    backgroundColor: Colors.white.withValues(alpha: 0.18),
                    child: Text(
                      user?.initial ?? 'P',
                      style: const TextStyle(
                        fontFamily: 'Fraunces',
                        fontSize: 34,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    user?.name ?? 'Patient',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontFamily: 'Fraunces',
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.14),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      numero,
                      style: const TextStyle(
                        fontFamily: 'Outfit',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.6,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Centre Médical AMEN · Matete',
                    style: TextStyle(
                      fontFamily: 'Outfit',
                      fontSize: 12,
                      color: Colors.white.withValues(alpha: 0.75),
                    ),
                  ),
                ],
              ),
            ),
            if (admission.isNotEmpty)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F5F3),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AmenColors.line),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.local_hospital_outlined, color: AmenColors.primary),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Visite en cours · ${_str(admission['statut_label'] ?? admission['statut'])}'
                        '${admission['service'] != null ? ' · ${admission['service']}' : ''}',
                        style: const TextStyle(
                          fontFamily: 'Outfit',
                          fontWeight: FontWeight.w600,
                          color: AmenColors.ink,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            if (allergies.isNotEmpty)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF1F1),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.warning_amber_rounded, color: AmenColors.danger, size: 22),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'ALLERGIES',
                            style: TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                              color: AmenColors.danger,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            allergies,
                            style: const TextStyle(
                              fontFamily: 'Outfit',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AmenColors.danger,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: _SectionCard(
                title: 'Identité',
                children: [
                  _InfoRow(icon: Icons.wc_outlined, label: 'Sexe', value: sexe),
                  _InfoRow(icon: Icons.bloodtype_outlined, label: 'Groupe sanguin', value: _str(groupe)),
                  _InfoRow(
                    icon: Icons.cake_outlined,
                    label: 'Naissance',
                    value: _str(p['date_naissance']).split('T').first,
                  ),
                  _InfoRow(icon: Icons.place_outlined, label: 'Adresse', value: _adresse),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: _SectionCard(
                title: 'Coordonnées',
                trailing: TextButton(
                  onPressed: _busy
                      ? null
                      : () {
                          setState(() => _editing = !_editing);
                          if (_editing) {
                            _phone.text = user?.phone ?? '';
                          }
                        },
                  child: Text(_editing ? 'Annuler' : 'Modifier le téléphone'),
                ),
                children: [
                  _InfoRow(
                    icon: Icons.badge_outlined,
                    label: 'Identifiant',
                    value: _str(user?.loginIdentifiant, (user?.email ?? '').split('@').first),
                  ),
                  _InfoRow(icon: Icons.email_outlined, label: 'Email', value: _str(user?.email)),
                  if (_editing) ...[
                    const SizedBox(height: 8),
                    TextField(
                      controller: _phone,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Téléphone'),
                    ),
                    const SizedBox(height: 14),
                    FilledButton(
                      onPressed: _busy ? null : _save,
                      child: Text(_busy ? 'Enregistrement…' : 'Enregistrer'),
                    ),
                  ] else
                    _InfoRow(icon: Icons.phone_outlined, label: 'Téléphone', value: _str(user?.phone)),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: _SectionCard(
                title: 'Contact d’urgence',
                children: [
                  _InfoRow(
                    icon: Icons.person_outline,
                    label: 'Nom',
                    value: contactNom.isEmpty ? '—' : contactNom,
                  ),
                  _InfoRow(
                    icon: Icons.phone_in_talk_outlined,
                    label: 'Téléphone',
                    value: contactTel.isEmpty ? '—' : contactTel,
                  ),
                  _InfoRow(
                    icon: Icons.family_restroom_outlined,
                    label: 'Lien',
                    value: _str(p['contact_urgence_lien']),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: OutlinedButton.icon(
                onPressed: () async {
                  await auth.sync.syncNow();
                  await _hydrate();
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Synchronisation lancée')),
                  );
                },
                icon: const Icon(Icons.sync),
                label: const Text('Synchroniser'),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: AmenColors.danger,
                  minimumSize: const Size.fromHeight(48),
                ),
                onPressed: () async => auth.logout(),
                icon: const Icon(Icons.logout),
                label: const Text('Se déconnecter'),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'AMEN Flutter  v1.2.10',
              textAlign: TextAlign.center,
              style: TextStyle(fontFamily: 'Outfit', fontSize: 11, color: AmenColors.muted),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 4, 24, 0),
              child: Text(
                ApiConfig.baseUrl,
                textAlign: TextAlign.center,
                style: const TextStyle(fontFamily: 'Outfit', fontSize: 9, color: AmenColors.muted),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children, this.trailing});

  final String title;
  final List<Widget> children;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      decoration: BoxDecoration(
        color: AmenColors.paper,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AmenColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title.toUpperCase(),
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1,
                    color: AmenColors.primary,
                  ),
                ),
              ),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 4),
          ...children,
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label, required this.value});

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AmenColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AmenColors.muted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 14.5,
                    height: 1.35,
                    color: AmenColors.ink,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
