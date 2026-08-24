import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../utils/json_safe.dart';
import '../../widgets/amen_ui.dart';
import '../../widgets/sync_banner.dart';

class PatientHomeScreen extends StatefulWidget {
  const PatientHomeScreen({super.key});

  @override
  State<PatientHomeScreen> createState() => _PatientHomeScreenState();
}

class _PatientHomeScreenState extends State<PatientHomeScreen> {
  Map<String, dynamic>? _data;
  Map<String, dynamic>? _dossier;
  List<dynamic> _prescriptions = [];
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      final results = await Future.wait([
        auth.patientRepo.dashboard(),
        auth.patientRepo.dossier(),
        auth.patientRepo.prescriptions(),
      ]);
      if (!mounted) return;
      setState(() {
        _data = asDynMap(results[0]);
        _dossier = asDynMap(results[1]);
        _prescriptions = asDynList(results[2]);
      });
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openDossier([String tab = 'consultations']) {
    context.go('/patient/dossier?tab=$tab');
  }

  String _nextRdvLabel() {
    final data = _data;
    if (data == null) return '—';
    final next = data['prochain_rdv'] ?? data['next_rdv'] ?? data['upcoming_rdv'];
    if (next is Map) {
      return asStr(next['date_heure'] ?? next['date'] ?? next['heure_rdv'], '—');
    }
    if (next is List && next.isNotEmpty) {
      final m = asDynMap(next.first);
      return asStr(m['date_heure'] ?? m['date'], '—');
    }
    if (next is num) return next == 0 ? 'Aucun' : '$next à venir';
    return asStr(next, '—');
  }

  String _aPayerLabel() {
    final data = _data;
    if (data == null) return '0';
    final v = data['factures_impayees'] ?? data['impayees'] ?? asDynMap(data['stats'])['factures_impayees'];
    return '${asInt(v)}';
  }

  int get _consultationsCount {
    final list = asDynList(_dossier?['consultations'] ?? _dossier?['dossiers'] ?? _dossier?['visites']);
    return list.length;
  }

  int get _resultatsCount {
    final list = asDynList(
      _dossier?['derniers_resultats'] ?? _dossier?['examens'] ?? _dossier?['resultats'] ?? _dossier?['analyses'],
    );
    return list.length;
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final first = user?.name.split(' ').first ?? '';
    final admission = asDynMap(_data?['admission_en_cours']);

    return Material(
      color: AmenColors.wash,
      child: Column(
        children: [
          const SyncBanner(),
          Expanded(
            child: RefreshIndicator(
              color: AmenColors.primary,
              onRefresh: _load,
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: EdgeInsets.zero,
                children: [
                  Container(
                    width: double.infinity,
                    color: AmenColors.primary,
                    padding: EdgeInsets.fromLTRB(
                      20,
                      MediaQuery.paddingOf(context).top + 14,
                      12,
                      22,
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'AMEN · PATIENT',
                                style: TextStyle(
                                  fontFamily: 'Outfit',
                                  color: Colors.white70,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.1,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                first.isEmpty ? 'Bonjour' : 'Bonjour, $first',
                                style: const TextStyle(
                                  fontFamily: 'Fraunces',
                                  color: Colors.white,
                                  fontSize: 30,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                asStr(_data?['numero_patient'], 'Votre espace de soins'),
                                style: const TextStyle(fontFamily: 'Outfit', color: Colors.white70, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => context.push('/patient/notifications'),
                          icon: const Icon(Icons.notifications_none_outlined, color: Colors.white),
                        ),
                      ],
                    ),
                  ),
                  if (_loading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 48),
                      child: Center(child: CircularProgressIndicator(color: AmenColors.primary)),
                    )
                  else if (_error != null)
                    AmenErrorBox(message: _error!, onRetry: _load)
                  else ...[
                    if (admission.isNotEmpty)
                      Material(
                        color: Colors.transparent,
                        child: InkWell(
                          onTap: () => _openDossier('consultations'),
                          child: Container(
                            width: double.infinity,
                            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: const Color(0xFFE8F5F3),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AmenColors.line),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    'Visite en cours · ${asStr(admission['statut_label'] ?? admission['statut'])}'
                                    '${admission['service'] != null ? ' · ${admission['service']}' : ''}',
                                    style: const TextStyle(
                                      fontFamily: 'Outfit',
                                      fontWeight: FontWeight.w600,
                                      color: AmenColors.ink,
                                    ),
                                  ),
                                ),
                                const Icon(Icons.chevron_right, color: AmenColors.primary),
                              ],
                            ),
                          ),
                        ),
                      ),
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: AmenMetric(
                              label: 'Prochains RDV',
                              value: _nextRdvLabel(),
                              onTap: () => context.go('/patient/rdv'),
                            ),
                          ),
                          Expanded(
                            child: AmenMetric(
                              label: 'Consultations',
                              value: '$_consultationsCount',
                              onTap: () => _openDossier('consultations'),
                            ),
                          ),
                          Expanded(
                            child: AmenMetric(
                              label: 'À payer',
                              value: _aPayerLabel(),
                              onTap: () => context.go('/patient/factures'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(),
                    AmenRow(
                      title: 'Mes rendez-vous',
                      subtitle: 'Prendre, reporter ou annuler',
                      leading: const Icon(Icons.event_available_outlined, color: AmenColors.primary),
                      onTap: () => context.go('/patient/rdv'),
                    ),
                    AmenRow(
                      title: 'Consultations',
                      subtitle: _consultationsCount == 0
                          ? 'Aucune pour le moment — ouvrir le dossier'
                          : '$_consultationsCount consultation(s) — voir le détail',
                      leading: const Icon(Icons.medical_services_outlined, color: AmenColors.primary),
                      onTap: () => _openDossier('consultations'),
                    ),
                    AmenRow(
                      title: 'Résultats',
                      subtitle: _resultatsCount == 0
                          ? 'Examens et analyses de laboratoire'
                          : '$_resultatsCount résultat(s) disponible(s)',
                      leading: const Icon(Icons.biotech_outlined, color: AmenColors.primary),
                      onTap: () => _openDossier('resultats'),
                    ),
                    AmenRow(
                      title: 'Ordonnances',
                      subtitle: _prescriptions.isEmpty
                          ? 'Prescriptions et médicaments'
                          : '${_prescriptions.length} ordonnance(s)',
                      leading: const Icon(Icons.medication_outlined, color: AmenColors.primary),
                      onTap: () => _openDossier('ordonnances'),
                    ),
                    AmenRow(
                      title: 'Mon dossier médical',
                      subtitle: 'Vue complète : consultations, résultats, ordonnances',
                      leading: const Icon(Icons.folder_open_outlined, color: AmenColors.primary),
                      onTap: () => _openDossier('complet'),
                    ),
                    AmenRow(
                      title: 'Mes factures',
                      subtitle: 'Consulter et payer',
                      leading: const Icon(Icons.payments_outlined, color: AmenColors.primary),
                      onTap: () => context.go('/patient/factures'),
                    ),
                    AmenRow(
                      title: 'Téléconsultation',
                      subtitle: 'Rejoindre une salle vidéo',
                      leading: const Icon(Icons.videocam_outlined, color: AmenColors.primary),
                      onTap: () => context.push('/patient/teleconsultation'),
                    ),
                    AmenRow(
                      title: 'Synchronisation',
                      subtitle: 'Actions hors ligne en attente',
                      leading: const Icon(Icons.sync_outlined, color: AmenColors.muted),
                      onTap: () => context.push('/sync/pending'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
