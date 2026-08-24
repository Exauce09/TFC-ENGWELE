import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class MedecinTeleconsultScreen extends StatefulWidget {
  const MedecinTeleconsultScreen({super.key});

  @override
  State<MedecinTeleconsultScreen> createState() => _MedecinTeleconsultScreenState();
}

class _MedecinTeleconsultScreenState extends State<MedecinTeleconsultScreen> {
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
      final data = await auth.medecinRepo.teleconsultations();
      if (mounted) setState(() => _items = data);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      appBar: AppBar(title: const Text('Téléconsultation')),
      body: SyncScaffoldBody(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (!auth.sync.isOnline)
                const Text('Rejoindre / fermer une salle nécessite Internet.'),
              if (_loading)
                const Center(child: CircularProgressIndicator())
              else if (_error != null)
                StaffErrorBox(message: _error!, onRetry: _load)
              else if (_items.isEmpty)
                const StaffEmpty(message: 'Aucune salle')
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
                          : Wrap(
                              spacing: 4,
                              children: [
                                FilledButton(
                                  onPressed: !auth.sync.isOnline
                                      ? null
                                      : () async {
                                          try {
                                            final data = await auth.medecinRepo.rejoindreTeleconsult(id);
                                            final url = (data['url'] ?? data['join_url'] ?? data['lien'] ?? '').toString();
                                            if (url.isNotEmpty) {
                                              await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
                                            }
                                          } catch (e) {
                                            if (!context.mounted) return;
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text(auth.api.friendlyError(e))),
                                            );
                                          }
                                        },
                                  child: const Text('Join'),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.close),
                                  onPressed: !auth.sync.isOnline
                                      ? null
                                      : () async {
                                          await auth.medecinRepo.fermerTeleconsult(id);
                                          await _load();
                                        },
                                ),
                              ],
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
