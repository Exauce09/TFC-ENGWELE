import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class PatientOnboardingScreen extends StatefulWidget {
  const PatientOnboardingScreen({super.key});

  @override
  State<PatientOnboardingScreen> createState() => _PatientOnboardingScreenState();
}

class _PatientOnboardingScreenState extends State<PatientOnboardingScreen> {
  final _phone = TextEditingController();
  final _adresse = TextEditingController();
  final _commune = TextEditingController(text: 'Matete');
  final _ville = TextEditingController(text: 'Kinshasa');
  final _urgenceNom = TextEditingController();
  final _urgenceTel = TextEditingController();
  final _password = TextEditingController();
  final _password2 = TextEditingController();
  String _sexe = 'F';
  DateTime? _naissance;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final u = context.read<AuthProvider>().user;
      _phone.text = u?.phone ?? '';
    });
  }

  @override
  void dispose() {
    _phone.dispose();
    _adresse.dispose();
    _commune.dispose();
    _ville.dispose();
    _urgenceNom.dispose();
    _urgenceTel.dispose();
    _password.dispose();
    _password2.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_password.text.length < 8 || _password.text != _password2.text) {
      setState(() => _error = 'Mot de passe : min. 8 caractères et confirmation identique.');
      return;
    }
    if (_phone.text.trim().isEmpty) {
      setState(() => _error = 'Téléphone requis.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      await auth.completePatientOnboarding({
        'phone': _phone.text.trim(),
        'password': _password.text,
        'password_confirmation': _password2.text,
        'sexe': _sexe,
        if (_naissance != null)
          'date_naissance':
              '${_naissance!.year.toString().padLeft(4, '0')}-${_naissance!.month.toString().padLeft(2, '0')}-${_naissance!.day.toString().padLeft(2, '0')}',
        'adresse': _adresse.text.trim(),
        'commune': _commune.text.trim(),
        'ville': _ville.text.trim(),
        'contact_urgence_nom': _urgenceNom.text.trim(),
        'contact_urgence_tel': _urgenceTel.text.trim(),
      });
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Première connexion')),
      body: SyncScaffoldBody(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Complétez votre profil pour sécuriser votre compte patient.',
              style: TextStyle(fontSize: 15),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phone,
              decoration: const InputDecoration(labelText: 'Téléphone', border: OutlineInputBorder()),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _sexe,
              decoration: const InputDecoration(labelText: 'Sexe', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'F', child: Text('Féminin')),
                DropdownMenuItem(value: 'M', child: Text('Masculin')),
              ],
              onChanged: (v) => setState(() => _sexe = v ?? 'F'),
            ),
            const SizedBox(height: 12),
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(
                _naissance == null
                    ? 'Date de naissance'
                    : '${_naissance!.day}/${_naissance!.month}/${_naissance!.year}',
              ),
              trailing: const Icon(Icons.cake_outlined),
              onTap: () async {
                final d = await showDatePicker(
                  context: context,
                  initialDate: DateTime(1995),
                  firstDate: DateTime(1920),
                  lastDate: DateTime.now(),
                );
                if (d != null) setState(() => _naissance = d);
              },
            ),
            TextField(
              controller: _adresse,
              decoration: const InputDecoration(labelText: 'Adresse', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _commune,
              decoration: const InputDecoration(labelText: 'Commune', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _ville,
              decoration: const InputDecoration(labelText: 'Ville', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _urgenceNom,
              decoration: const InputDecoration(labelText: 'Contact urgence (nom)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _urgenceTel,
              decoration: const InputDecoration(labelText: 'Contact urgence (tél.)', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Nouveau mot de passe', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _password2,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Confirmer', border: OutlineInputBorder()),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              StaffErrorBox(message: _error!, onRetry: _submit),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _busy ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Valider mon profil'),
            ),
          ],
        ),
      ),
    );
  }
}
