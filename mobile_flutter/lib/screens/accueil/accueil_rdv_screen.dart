import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../widgets/staff_widgets.dart';

class AccueilRdvScreen extends StatefulWidget {
  const AccueilRdvScreen({super.key});

  @override
  State<AccueilRdvScreen> createState() => _AccueilRdvScreenState();
}

class _AccueilRdvScreenState extends State<AccueilRdvScreen> {
  late String _date;
  List<dynamic> _items = [];
  String? _error;
  bool _loading = true;

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
      final items = await auth.accueilApi.rendezVous(date: _date);
      if (mounted) setState(() => _items = items);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _action(int id, String type) async {
    final auth = context.read<AuthProvider>();
    try {
      if (type == 'convertir') {
        await auth.accueilApi.convertirRdv(id);
      } else {
        await auth.accueilApi.marquerAbsent(id);
      }
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.api.friendlyError(e))),
      );
    }
  }

  Future<void> _pickDate() async {
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RDV du jour'),
        actions: [
          TextButton.icon(
            onPressed: _pickDate,
            icon: const Icon(Icons.event, color: Colors.white),
            label: Text(_date, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_error != null)
              StaffErrorBox(message: _error!, onRetry: _load)
            else if (_items.isEmpty)
              const StaffEmpty(message: 'Aucun RDV pour cette date')
            else
              ..._items.map((raw) {
                final rdv = Map<String, dynamic>.from(raw as Map);
                final patient = rdv['patient'];
                String name = 'Patient';
                if (patient is Map) {
                  final u = patient['user'];
                  if (u is Map && u['name'] != null) name = u['name'].toString();
                }
                final heure = (rdv['heure_rdv'] ?? '').toString();
                final id = (rdv['id'] as num).toInt();
                final medecin = rdv['medecin'];
                String med = '';
                if (medecin is Map && medecin['user'] is Map) {
                  med = (medecin['user'] as Map)['name']?.toString() ?? '';
                }
                return Card(
                  margin: const EdgeInsets.only(bottom: 10),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${heure.length >= 5 ? heure.substring(0, 5) : heure} — $name',
                          style: const TextStyle(fontWeight: FontWeight.w700),
                        ),
                        Text(
                          med.isNotEmpty ? med : (rdv['motif'] ?? '—').toString(),
                          style: TextStyle(color: Colors.grey.shade700),
                        ),
                        StatusChip(statut: (rdv['statut'] ?? '').toString()),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          children: [
                            FilledButton(
                              onPressed: () => _action(id, 'convertir'),
                              child: const Text('Arrivée'),
                            ),
                            OutlinedButton(
                              onPressed: () => _action(id, 'absent'),
                              child: const Text('Absent'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}
