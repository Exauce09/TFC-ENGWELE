import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class PatientNotificationsScreen extends StatefulWidget {
  const PatientNotificationsScreen({super.key});

  @override
  State<PatientNotificationsScreen> createState() => _PatientNotificationsScreenState();
}

class _PatientNotificationsScreenState extends State<PatientNotificationsScreen> {
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
      final data = await auth.patientRepo.notifications();
      if (mounted) setState(() => _items = data);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await auth.patientRepo.toutLireNotifications();
              await _load();
            },
            child: const Text('Tout lire', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: SyncScaffoldBody(
        child: RefreshIndicator(
          onRefresh: _load,
          child: _loading
              ? ListView(children: const [SizedBox(height: 80), Center(child: CircularProgressIndicator())])
              : _error != null
                  ? ListView(padding: const EdgeInsets.all(16), children: [StaffErrorBox(message: _error!, onRetry: _load)])
                  : _items.isEmpty
                      ? ListView(children: const [StaffEmpty(message: 'Aucune notification')])
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _items.length,
                          itemBuilder: (_, i) {
                            final n = Map<String, dynamic>.from(_items[i] as Map);
                            final id = (n['id'] as num?)?.toInt();
                            final lu = n['lu'] == true || n['read_at'] != null;
                            return Card(
                              color: lu ? null : Colors.teal.shade50,
                              child: ListTile(
                                title: Text(n['titre']?.toString() ?? n['title']?.toString() ?? 'Notification'),
                                subtitle: Text(n['message']?.toString() ?? n['body']?.toString() ?? ''),
                                trailing: id == null || lu
                                    ? null
                                    : IconButton(
                                        icon: const Icon(Icons.done),
                                        onPressed: () async {
                                          await auth.patientRepo.marquerNotificationLu(id);
                                          await _load();
                                        },
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
