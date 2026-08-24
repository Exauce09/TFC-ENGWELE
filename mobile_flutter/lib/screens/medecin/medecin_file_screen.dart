import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class MedecinFileScreen extends StatefulWidget {
  const MedecinFileScreen({super.key});

  @override
  State<MedecinFileScreen> createState() => _MedecinFileScreenState();
}

class _MedecinFileScreenState extends State<MedecinFileScreen> {
  List<dynamic> _items = [];
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
      final items = await auth.medecinRepo.fileConsultation();
      if (mounted) setState(() => _items = items);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _episodeAction(Map item, String type) async {
    final auth = context.read<AuthProvider>();
    final id = (item['episode_id'] as num?)?.toInt() ?? (item['id'] as num?)?.toInt();
    if (id == null) return;
    final note = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(type == 'decision' ? 'Décision' : 'Avancer'),
        content: TextField(controller: note, decoration: const InputDecoration(labelText: 'Note / décision')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('OK')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      if (type == 'decision') {
        await auth.medecinRepo.episodeDecision(id, {
          'decision': note.text.trim(),
          'note': note.text.trim(),
        });
      } else {
        await auth.medecinRepo.episodeAvancer(id, {'note': note.text.trim()});
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    } finally {
      note.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('File de consultation')),
      body: SyncScaffoldBody(
        child: RefreshIndicator(
          color: AmenColors.primary,
          onRefresh: _load,
          child: ListView(
            children: [
              if (_loading)
                const Padding(
                  padding: EdgeInsets.all(48),
                  child: Center(child: CircularProgressIndicator()),
                )
              else if (_error != null)
                StaffErrorBox(message: _error!, onRetry: _load)
              else if (_items.isEmpty)
                const StaffEmpty(message: 'File vide')
              else
                ..._items.map((raw) {
                  final item = Map<String, dynamic>.from(raw as Map);
                  final patient = item['patient'];
                  String name = 'Patient';
                  if (patient is Map) {
                    final u = patient['user'];
                    if (u is Map && u['name'] != null) {
                      name = u['name'].toString();
                    } else if (patient['nom'] != null) {
                      name = patient['nom'].toString();
                    }
                  } else if (item['patient_nom'] != null) {
                    name = item['patient_nom'].toString();
                  }
                  final patientId = (item['patient_id'] as num?)?.toInt() ??
                      (patient is Map ? (patient['id'] as num?)?.toInt() : null);
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
                        InkWell(
                          onTap: patientId == null ? null : () => context.push('/medecin/patients/$patientId'),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name, style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 4),
                              Text(
                                (item['motif'] ?? item['motif_consultation'] ?? 'Consultation').toString(),
                                style: const TextStyle(color: AmenColors.muted),
                              ),
                              StatusChip(statut: (item['statut'] ?? '').toString()),
                            ],
                          ),
                        ),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            OutlinedButton(
                              onPressed: () => _episodeAction(item, 'decision'),
                              child: const Text('Décision'),
                            ),
                            OutlinedButton(
                              onPressed: () => _episodeAction(item, 'avancer'),
                              child: const Text('Avancer'),
                            ),
                            if (patientId != null)
                              TextButton(
                                onPressed: () => context.push('/medecin/dossiers/new?patient_id=$patientId'),
                                child: const Text('Consultation'),
                              ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}
