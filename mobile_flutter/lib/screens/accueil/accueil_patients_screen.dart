import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../utils/json_safe.dart';
import '../widgets/staff_widgets.dart';

class AccueilPatientsScreen extends StatefulWidget {
  const AccueilPatientsScreen({super.key});

  @override
  State<AccueilPatientsScreen> createState() => _AccueilPatientsScreenState();
}

class _AccueilPatientsScreenState extends State<AccueilPatientsScreen> {
  final _q = TextEditingController();
  List<dynamic> _items = [];
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
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
      final items = await auth.accueilApi.patients(q: term ?? _q.text);
      if (mounted) setState(() => _items = items);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openAcces(Map<String, dynamic> p) async {
    var acces = asDynMap(p['acces']);
    final auth = context.read<AuthProvider>();
    final login = asStr(acces['login'] ?? asDynMap(p['user'])['login_identifiant'], '—');
    var password = asStr(acces['password']);

    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
          child: StatefulBuilder(
            builder: (ctx, setSheet) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Identifiants patient',
                    style: TextStyle(fontFamily: 'Fraunces', fontSize: 22, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Accueil uniquement. Remettez ces infos au patient.',
                    style: TextStyle(fontFamily: 'Outfit', fontSize: 13, color: AmenColors.muted),
                  ),
                  const SizedBox(height: 16),
                  _kv('Identifiant', login),
                  _kv('Mot de passe', password.isEmpty ? 'Déjà changé par le patient' : password),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () async {
                      try {
                        final data = await auth.accueilApi.resetPatientPassword(asInt(p['id']));
                        acces = asDynMap(data['acces']);
                        password = asStr(acces['password'], 'Amen2026');
                        setSheet(() {});
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Réinitialisé : $login / $password')),
                        );
                      } catch (e) {
                        if (!mounted) return;
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text(auth.api.friendlyError(e))),
                        );
                      }
                    },
                    child: const Text('Réinitialiser (Amen2026)'),
                  ),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () {
                      final text = password.isEmpty ? login : '$login\n$password';
                      Clipboard.setData(ClipboardData(text: text));
                    },
                    child: const Text('Copier'),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }

  Widget _kv(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontFamily: 'Outfit', fontSize: 11, color: AmenColors.muted, fontWeight: FontWeight.w700)),
          Text(value, style: const TextStyle(fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Patients')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: TextField(
              controller: _q,
              decoration: const InputDecoration(
                hintText: 'Rechercher…',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _load(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (_loading)
                    const Center(child: CircularProgressIndicator())
                  else if (_error != null)
                    StaffErrorBox(message: _error!, onRetry: () => _load())
                  else if (_items.isEmpty)
                    const StaffEmpty(message: 'Aucun patient')
                  else
                    ..._items.map((raw) {
                      final p = Map<String, dynamic>.from(raw as Map);
                      final user = asDynMap(p['user']);
                      final acces = asDynMap(p['acces']);
                      final name = asStr(user['name'] ?? p['nom'], 'Patient');
                      final phone = asStr(user['phone']);
                      final num = asStr(p['numero_patient']);
                      final login = asStr(acces['login'] ?? user['login_identifiant']);
                      return Card(
                        child: ListTile(
                          title: Text(name, style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(
                            [
                              if (num.isNotEmpty) num,
                              if (login.isNotEmpty) login,
                              if (phone.isNotEmpty) phone,
                            ].join(' · '),
                          ),
                          trailing: const Icon(Icons.vpn_key_outlined, color: AmenColors.primary),
                          onTap: () => _openAcces(p),
                        ),
                      );
                    }),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
