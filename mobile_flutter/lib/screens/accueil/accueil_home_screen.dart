import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/auth_user.dart';
import '../../providers/auth_provider.dart';
import '../widgets/staff_widgets.dart';

class AccueilHomeScreen extends StatefulWidget {
  const AccueilHomeScreen({super.key});

  @override
  State<AccueilHomeScreen> createState() => _AccueilHomeScreenState();
}

class _AccueilHomeScreenState extends State<AccueilHomeScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _demandes = [];
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      final stats = await auth.accueilApi.dashboard();
      final demandes = await auth.accueilApi.demandes(statut: 'nouvelle');
      if (mounted) {
        setState(() {
          _stats = stats;
          _demandes = demandes;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final s = _stats ?? {};

    return Scaffold(
      appBar: AppBar(title: const Text('Réception')),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(
              'Bonjour ${user?.name.split(' ').first ?? 'Accueil'}',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            Text(roleLabel(user?.role), style: TextStyle(color: Colors.grey.shade600)),
            const SizedBox(height: 16),
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_error != null)
              StaffErrorBox(message: _error!, onRetry: _load)
            else ...[
              StaffStatGrid(
                items: [
                  StaffStat(
                    'Demandes',
                    '${s['demandes_en_attente'] ?? _demandes.length}',
                  ),
                  StaffStat(
                    'RDV du jour',
                    '${s['rdv_du_jour'] ?? s['rdv_aujourdhui'] ?? 0}',
                  ),
                  StaffStat(
                    'Patients',
                    '${s['patients'] ?? s['patients_jour'] ?? 0}',
                  ),
                  StaffStat(
                    'Arrivées',
                    '${s['arrivees'] ?? s['en_attente'] ?? 0}',
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text(
                'Demandes à confirmer',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              if (_demandes.isEmpty)
                const StaffEmpty(message: 'Aucune demande')
              else
                ..._demandes.take(8).map((raw) {
                  final d = Map<String, dynamic>.from(raw as Map);
                  final name = (d['nom'] ??
                          (d['patient'] is Map
                              ? ((d['patient'] as Map)['user'] is Map
                                  ? ((d['patient'] as Map)['user'] as Map)['name']
                                  : null)
                              : null) ??
                          'Demande')
                      .toString();
                  return Card(
                    child: ListTile(
                      title: Text(name, style: const TextStyle(fontWeight: FontWeight.w700)),
                      subtitle: Text(
                        '${d['date_souhaitee'] ?? '—'} · ${d['service_libelle'] ?? d['message'] ?? 'RDV'}',
                      ),
                    ),
                  );
                }),
            ],
          ],
        ),
      ),
    );
  }
}
