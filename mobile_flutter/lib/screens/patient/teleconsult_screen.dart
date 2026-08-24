import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class PatientTeleconsultScreen extends StatefulWidget {
  const PatientTeleconsultScreen({super.key});

  @override
  State<PatientTeleconsultScreen> createState() => _PatientTeleconsultScreenState();
}

class _PatientTeleconsultScreenState extends State<PatientTeleconsultScreen> {
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
      final data = await auth.patientRepo.teleconsultations();
      if (mounted) setState(() => _items = data);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _join(int id) async {
    final auth = context.read<AuthProvider>();
    try {
      final data = await auth.patientRepo.rejoindreTeleconsult(id);
      final url = (data['url'] ?? data['join_url'] ?? data['lien'] ?? '').toString();
      if (url.isEmpty) {
        throw StateError('Lien de salle introuvable');
      }
      final uri = Uri.parse(url);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw StateError('Impossible d’ouvrir le lien');
      }
    } catch (e) {
      if (!mounted) return;
      final msg = e is StateError ? e.message : auth.api.friendlyError(e);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final online = context.watch<AuthProvider>().sync.isOnline;
    return Scaffold(
      appBar: AppBar(title: const Text('Téléconsultation')),
      body: SyncScaffoldBody(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (!online)
                const Padding(
                  padding: EdgeInsets.only(bottom: 12),
                  child: Text('Rejoindre une salle nécessite Internet.'),
                ),
              if (_loading)
                const Center(child: CircularProgressIndicator())
              else if (_error != null)
                StaffErrorBox(message: _error!, onRetry: _load)
              else if (_items.isEmpty)
                const StaffEmpty(message: 'Aucune téléconsultation')
              else
                ..._items.map((raw) {
                  final m = Map<String, dynamic>.from(raw as Map);
                  final id = (m['id'] as num?)?.toInt();
                  return Card(
                    child: ListTile(
                      title: Text(m['titre']?.toString() ?? m['motif']?.toString() ?? 'Salle'),
                      subtitle: Text(m['statut']?.toString() ?? ''),
                      trailing: id == null
                          ? null
                          : FilledButton(
                              onPressed: online ? () => _join(id) : null,
                              child: const Text('Rejoindre'),
                            ),
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
