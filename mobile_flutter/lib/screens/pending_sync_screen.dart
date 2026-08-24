import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/sync/sync_engine.dart';
import '../widgets/sync_banner.dart';
import 'widgets/staff_widgets.dart';

class PendingSyncScreen extends StatefulWidget {
  const PendingSyncScreen({super.key});

  @override
  State<PendingSyncScreen> createState() => _PendingSyncScreenState();
}

class _PendingSyncScreenState extends State<PendingSyncScreen> {
  @override
  Widget build(BuildContext context) {
    final sync = context.watch<SyncEngine>();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Actions en attente'),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: sync.isOnline ? () => sync.syncNow() : null,
          ),
        ],
      ),
      body: SyncScaffoldBody(
        child: FutureBuilder(
          future: sync.listPendingActions(),
          builder: (context, snap) {
            if (!snap.hasData) {
              return const Center(child: CircularProgressIndicator());
            }
            final items = snap.data!;
            if (items.isEmpty) {
              return const StaffEmpty(message: 'Aucune action en attente');
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (_, i) {
                final it = items[i];
                return Card(
                  child: ListTile(
                    title: Text('${it.method} ${it.path}'),
                    subtitle: Text(
                      'statut: ${it.status}'
                      '${it.lastError != null ? '\n${it.lastError}' : ''}',
                    ),
                    isThreeLine: it.lastError != null,
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }
}
