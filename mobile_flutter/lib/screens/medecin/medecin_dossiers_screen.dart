import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class MedecinDossiersScreen extends StatefulWidget {
  const MedecinDossiersScreen({super.key});

  @override
  State<MedecinDossiersScreen> createState() => _MedecinDossiersScreenState();
}

class _MedecinDossiersScreenState extends State<MedecinDossiersScreen> {
  List<dynamic> _items = [];
  bool _loading = true;
  String? _error;

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
      final items = await auth.medecinRepo.dossiers();
      if (mounted) setState(() => _items = items);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Dossiers')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/medecin/dossiers/new'),
        child: const Icon(Icons.add),
      ),
      body: SyncScaffoldBody(
        child: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? ListView(children: const [SizedBox(height: 80), Center(child: CircularProgressIndicator())])
              : _error != null
                  ? ListView(padding: const EdgeInsets.all(16), children: [StaffErrorBox(message: _error!, onRetry: _load)])
                  : _items.isEmpty
                      ? ListView(children: const [StaffEmpty(message: 'Aucun dossier')])
                      : ListView.builder(
                          itemCount: _items.length,
                          itemBuilder: (_, i) {
                            final d = Map<String, dynamic>.from(_items[i] as Map);
                            final id = (d['id'] as num).toInt();
                            return Material(
                              color: AmenColors.paper,
                              child: InkWell(
                                onTap: () => context.push('/medecin/dossiers/$id'),
                                child: Container(
                                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
                                  decoration: const BoxDecoration(
                                    border: Border(bottom: BorderSide(color: AmenColors.line)),
                                  ),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              d['motif']?.toString() ??
                                                  d['diagnostic']?.toString() ??
                                                  'Consultation',
                                              style: Theme.of(context).textTheme.titleMedium,
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              '${d['created_at'] ?? ''} · ${d['statut'] ?? ''}',
                                              style: const TextStyle(color: AmenColors.muted),
                                            ),
                                          ],
                                        ),
                                      ),
                                      const Icon(Icons.arrow_forward_ios, size: 14, color: AmenColors.muted),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
        ),
      ),
    );
  }
}

class MedecinDossierFormScreen extends StatefulWidget {
  const MedecinDossierFormScreen({super.key, this.dossierId, this.patientId});

  final int? dossierId;
  final int? patientId;

  @override
  State<MedecinDossierFormScreen> createState() => _MedecinDossierFormScreenState();
}

class _MedecinDossierFormScreenState extends State<MedecinDossierFormScreen> {
  final _motif = TextEditingController();
  final _examen = TextEditingController();
  final _diagnostic = TextEditingController();
  final _conduite = TextEditingController();
  final _patientId = TextEditingController();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    if (widget.patientId != null) _patientId.text = '${widget.patientId}';
    if (widget.dossierId != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final auth = context.read<AuthProvider>();
    try {
      final d = await auth.medecinRepo.dossierDetail(widget.dossierId!);
      _motif.text = d['motif']?.toString() ?? '';
      _examen.text = d['examen_clinique']?.toString() ?? d['examen']?.toString() ?? '';
      _diagnostic.text = d['diagnostic']?.toString() ?? '';
      _conduite.text = d['conduite']?.toString() ?? d['conduite_a_tenir']?.toString() ?? '';
      if (d['patient_id'] != null) _patientId.text = d['patient_id'].toString();
      setState(() {});
    } catch (_) {}
  }

  @override
  void dispose() {
    _motif.dispose();
    _examen.dispose();
    _diagnostic.dispose();
    _conduite.dispose();
    _patientId.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final auth = context.read<AuthProvider>();
    setState(() => _busy = true);
    final body = {
      'patient_id': int.tryParse(_patientId.text.trim()),
      'motif': _motif.text.trim(),
      'examen_clinique': _examen.text.trim(),
      'diagnostic': _diagnostic.text.trim(),
      'conduite_a_tenir': _conduite.text.trim(),
    };
    try {
      if (widget.dossierId == null) {
        await auth.medecinRepo.createDossier(body);
      } else {
        await auth.medecinRepo.updateDossier(widget.dossierId!, body);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.sync.isOnline ? 'Enregistré' : 'En file de synchronisation')),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.dossierId == null ? 'Nouvelle consultation' : 'Éditer consultation')),
      body: SyncScaffoldBody(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextField(
              controller: _patientId,
              decoration: const InputDecoration(labelText: 'ID patient', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _motif,
              decoration: const InputDecoration(labelText: 'Motif', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _examen,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Examen clinique', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _diagnostic,
              maxLines: 2,
              decoration: const InputDecoration(labelText: 'Diagnostic', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _conduite,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Conduite à tenir', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: _busy ? null : _save, child: const Text('Enregistrer')),
          ],
        ),
      ),
    );
  }
}
