import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class MedecinPlanningScreen extends StatefulWidget {
  const MedecinPlanningScreen({super.key});

  @override
  State<MedecinPlanningScreen> createState() => _MedecinPlanningScreenState();
}

class _MedecinPlanningScreenState extends State<MedecinPlanningScreen> {
  late String _date;
  List<dynamic> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    final now = DateTime.now();
    _date =
        '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      final items = await auth.medecinRepo.planning(date: _date);
      if (mounted) setState(() => _items = items);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _createRdv() async {
    final auth = context.read<AuthProvider>();
    final motif = TextEditingController();
    final patientId = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Créer un RDV'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: patientId,
              decoration: const InputDecoration(labelText: 'ID patient'),
              keyboardType: TextInputType.number,
            ),
            TextField(controller: motif, decoration: const InputDecoration(labelText: 'Motif')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Créer')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await auth.medecinRepo.creerRendezVous({
        'patient_id': int.tryParse(patientId.text.trim()),
        'motif': motif.text.trim(),
        'date': _date,
        'heure_rdv': '09:00',
        'type': 'presentiel',
      });
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    } finally {
      motif.dispose();
      patientId.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Planning'),
        actions: [
          TextButton(
            onPressed: () async {
              final initial = DateTime.tryParse(_date) ?? DateTime.now();
              final picked = await showDatePicker(
                context: context,
                initialDate: initial,
                firstDate: DateTime(2020),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (picked == null) return;
              setState(() {
                _date =
                    '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
              });
              await _load();
            },
            child: Text(_date, style: const TextStyle(color: AmenColors.primary, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _createRdv,
        child: const Icon(Icons.add),
      ),
      body: SyncScaffoldBody(
        child: RefreshIndicator(
          color: AmenColors.primary,
          onRefresh: _load,
          child: _loading
              ? ListView(children: const [SizedBox(height: 80), Center(child: CircularProgressIndicator())])
              : _error != null
                  ? ListView(padding: const EdgeInsets.all(16), children: [StaffErrorBox(message: _error!, onRetry: _load)])
                  : _items.isEmpty
                      ? ListView(children: const [StaffEmpty(message: 'Aucun RDV planifié')])
                      : ListView.builder(
                          itemCount: _items.length,
                          itemBuilder: (_, i) {
                            final r = Map<String, dynamic>.from(_items[i] as Map);
                            final patient = r['patient'];
                            String name = 'Patient';
                            if (patient is Map) {
                              final u = patient['user'];
                              if (u is Map) name = u['name']?.toString() ?? name;
                            }
                            final heure = (r['heure_rdv'] ?? '').toString();
                            return Container(
                              width: double.infinity,
                              padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
                              decoration: const BoxDecoration(
                                color: AmenColors.paper,
                                border: Border(bottom: BorderSide(color: AmenColors.line)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${heure.length >= 5 ? heure.substring(0, 5) : heure} · $name',
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    (r['motif'] ?? 'Consultation').toString(),
                                    style: const TextStyle(color: AmenColors.muted),
                                  ),
                                  StatusChip(statut: (r['statut'] ?? '').toString()),
                                ],
                              ),
                            );
                          },
                        ),
        ),
      ),
    );
  }
}
