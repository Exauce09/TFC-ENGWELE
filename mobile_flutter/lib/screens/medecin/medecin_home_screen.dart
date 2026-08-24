import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../models/auth_user.dart';
import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../utils/json_safe.dart';
import '../../widgets/amen_ui.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class MedecinHomeScreen extends StatefulWidget {
  const MedecinHomeScreen({super.key});

  @override
  State<MedecinHomeScreen> createState() => _MedecinHomeScreenState();
}

class _MedecinHomeScreenState extends State<MedecinHomeScreen> {
  Map<String, dynamic>? _data;
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
      final data = await auth.medecinRepo.dashboard();
      if (mounted) setState(() => _data = data);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatut(int id, String statut) async {
    final auth = context.read<AuthProvider>();
    try {
      await auth.medecinRepo.updateRdvStatut(id, statut);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.sync.isOnline ? 'Statut mis à jour' : 'Action en file de sync')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    }
  }

  List<dynamic> get _rdvList {
    final d = _data;
    if (d == null) return const [];
    return asDynList(
      d['planning_du_jour'] ?? d['rdv_aujourdhui'] ?? d['prochains_rdv'] ?? d['rdvs'],
    );
  }

  List<dynamic> get _fileList {
    final d = _data;
    if (d == null) return const [];
    return asDynList(d['file_consultation'] ?? d['file_attente']);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final first = user?.name.split(' ').first ?? '';
    final rdvList = _rdvList;
    final rdvJour = asInt(_data?['rdv_du_jour'], rdvList.length);
    final fileCount = asInt(_data?['file_count'], _fileList.length);
    final dossiersMois = _data?['dossiers_mois'];

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
                              Text(
                                'AMEN · ${roleLabel(user?.role).toUpperCase()}',
                                style: const TextStyle(
                                  fontFamily: 'Outfit',
                                  color: Colors.white70,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 1.1,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                first.isEmpty ? 'Médecin' : 'Dr $first',
                                style: const TextStyle(
                                  fontFamily: 'Fraunces',
                                  color: Colors.white,
                                  fontSize: 30,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Journée clinique',
                                style: TextStyle(fontFamily: 'Outfit', color: Colors.white70, fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () => context.push('/medecin/teleconsultation'),
                          icon: const Icon(Icons.videocam_outlined, color: Colors.white),
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
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                      child: Row(
                        children: [
                          Expanded(
                            child: AmenMetric(
                              label: 'RDV du jour',
                              value: '$rdvJour',
                              onTap: () => context.go('/medecin/planning'),
                            ),
                          ),
                          Expanded(
                            child: AmenMetric(
                              label: 'File',
                              value: '$fileCount',
                              onTap: () => context.go('/medecin/file'),
                            ),
                          ),
                          Expanded(
                            child: AmenMetric(
                              label: 'Dossiers / mois',
                              value: dossiersMois == null ? '—' : '$dossiersMois',
                              onTap: () => context.go('/medecin/dossiers'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Divider(),
                    AmenRow(
                      title: 'File de consultation',
                      subtitle: 'Patients en attente',
                      leading: const Icon(Icons.queue_outlined, color: AmenColors.primary),
                      onTap: () => context.go('/medecin/file'),
                    ),
                    AmenRow(
                      title: 'Nouvelle consultation',
                      subtitle: 'Ouvrir un dossier',
                      leading: const Icon(Icons.note_add_outlined, color: AmenColors.primary),
                      onTap: () => context.push('/medecin/dossiers/new'),
                    ),
                    const Padding(
                      padding: EdgeInsets.fromLTRB(20, 18, 20, 8),
                      child: Text(
                        'Rendez-vous du jour',
                        style: TextStyle(
                          fontFamily: 'Fraunces',
                          fontSize: 22,
                          fontWeight: FontWeight.w600,
                          color: AmenColors.ink,
                        ),
                      ),
                    ),
                    if (rdvList.isEmpty)
                      const Padding(
                        padding: EdgeInsets.all(32),
                        child: Text(
                          'Aucun rendez-vous aujourd’hui',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontFamily: 'Outfit', color: AmenColors.muted),
                        ),
                      )
                    else
                      ...rdvList.map((raw) {
                        final rdv = asDynMap(raw);
                        final patient = rdv['patient'];
                        String name = 'Patient';
                        if (patient is Map) {
                          final u = patient['user'];
                          if (u is Map && u['name'] != null) name = u['name'].toString();
                          else if (patient['nom'] != null) name = patient['nom'].toString();
                        }
                        final heure = asStr(rdv['heure_rdv']);
                        final statut = asStr(rdv['statut']);
                        final id = asInt(rdv['id'], -1);
                        return Container(
                          decoration: const BoxDecoration(
                            color: AmenColors.paper,
                            border: Border(bottom: BorderSide(color: AmenColors.line)),
                          ),
                          padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 4),
                              Text(
                                '${heure.length >= 5 ? heure.substring(0, 5) : heure} · ${asStr(rdv['motif'], 'Consultation')}',
                                style: const TextStyle(color: AmenColors.muted),
                              ),
                              StatusChip(statut: statut),
                              if (id > 0) ...[
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    if (statut != 'en_cours' && statut != 'termine')
                                      FilledButton(
                                        onPressed: () => _updateStatut(id, 'en_cours'),
                                        child: const Text('Démarrer'),
                                      ),
                                    if (statut != 'termine' && statut != 'absent')
                                      OutlinedButton(
                                        onPressed: () => _updateStatut(id, 'termine'),
                                        child: const Text('Terminer'),
                                      ),
                                    if (statut == 'confirme' || statut == 'en_attente')
                                      TextButton(
                                        onPressed: () => _updateStatut(id, 'absent'),
                                        child: const Text('Absent'),
                                      ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        );
                      }),
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
