import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../widgets/amen_ui.dart';
import '../../widgets/sync_banner.dart';

class MedecinPatientsScreen extends StatefulWidget {
  const MedecinPatientsScreen({super.key});

  @override
  State<MedecinPatientsScreen> createState() => _MedecinPatientsScreenState();
}

class _MedecinPatientsScreenState extends State<MedecinPatientsScreen> {
  final _q = TextEditingController();
  List<dynamic> _items = [];
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
    _q.addListener(() {
      final t = _q.text.trim();
      if (t.isEmpty || t.length >= 2) _load(term: t);
    });
  }

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  Future<void> _load({String? term}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      final items = await auth.medecinRepo.patients(q: term ?? _q.text);
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
      appBar: AppBar(title: const Text('Patients')),
      body: SyncScaffoldBody(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: TextField(
                controller: _q,
                decoration: const InputDecoration(
                  hintText: 'Rechercher un patient…',
                  prefixIcon: Icon(Icons.search),
                ),
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                color: AmenColors.primary,
                onRefresh: () => _load(),
                child: _loading
                    ? ListView(children: const [SizedBox(height: 100), Center(child: CircularProgressIndicator())])
                    : _error != null
                        ? ListView(padding: const EdgeInsets.all(16), children: [AmenErrorBox(message: _error!, onRetry: () => _load())])
                        : _items.isEmpty
                            ? ListView(children: const [AmenEmptyState(message: 'Aucun patient')])
                            : ListView.builder(
                                itemCount: _items.length,
                                itemBuilder: (_, i) {
                                  final p = Map<String, dynamic>.from(_items[i] as Map);
                                  final user = p['user'];
                                  final name = user is Map
                                      ? (user['name'] ?? p['nom'] ?? 'Patient').toString()
                                      : (p['nom'] ?? 'Patient').toString();
                                  final id = (p['id'] as num).toInt();
                                  final phone = user is Map ? user['phone']?.toString() : null;
                                  final numP = p['numero_patient']?.toString();
                                  final subtitleParts = [
                                    if (numP != null && numP.isNotEmpty) '#$numP',
                                    if (phone != null && phone.isNotEmpty) phone,
                                  ];
                                  return AmenRow(
                                    title: name,
                                    subtitle: subtitleParts.isEmpty ? 'Fiche patient' : subtitleParts.join(' · '),
                                    leading: const Icon(Icons.person_outline, color: AmenColors.primary),
                                    onTap: () => context.push('/medecin/patients/$id'),
                                  );
                                },
                              ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
