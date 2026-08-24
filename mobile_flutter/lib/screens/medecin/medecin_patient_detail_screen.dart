import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class MedecinPatientDetailScreen extends StatefulWidget {
  const MedecinPatientDetailScreen({super.key, required this.patientId});

  final int patientId;

  @override
  State<MedecinPatientDetailScreen> createState() => _MedecinPatientDetailScreenState();
}

class _MedecinPatientDetailScreenState extends State<MedecinPatientDetailScreen> {
  Map<String, dynamic>? _data;
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
      final data = await auth.medecinRepo.patientDetail(widget.patientId);
      if (mounted) setState(() => _data = data);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = _data?['user'] is Map ? Map<String, dynamic>.from(_data!['user'] as Map) : null;
    final name = user?['name']?.toString() ?? _data?['nom']?.toString() ?? 'Patient';
    return Scaffold(
      appBar: AppBar(title: Text(name)),
      body: SyncScaffoldBody(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (_loading)
                const Center(child: CircularProgressIndicator())
              else if (_error != null)
                StaffErrorBox(message: _error!, onRetry: _load)
              else ...[
                ListTile(title: const Text('N° patient'), subtitle: Text('${_data?['numero_patient'] ?? '—'}')),
                ListTile(title: const Text('Téléphone'), subtitle: Text('${user?['phone'] ?? '—'}')),
                ListTile(title: const Text('Sexe'), subtitle: Text('${_data?['sexe'] ?? '—'}')),
                ListTile(title: const Text('Commune'), subtitle: Text('${_data?['commune'] ?? '—'}')),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => context.push('/medecin/dossiers/new?patient_id=${widget.patientId}'),
                  icon: const Icon(Icons.note_add),
                  label: const Text('Nouvelle consultation'),
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () => context.push('/medecin/prescriptions/new?patient_id=${widget.patientId}'),
                  icon: const Icon(Icons.medication_outlined),
                  label: const Text('Nouvelle prescription'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
