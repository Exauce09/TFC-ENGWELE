import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../widgets/sync_banner.dart';

class MedecinPrescriptionFormScreen extends StatefulWidget {
  const MedecinPrescriptionFormScreen({super.key, this.patientId, this.prescriptionId});

  final int? patientId;
  final int? prescriptionId;

  @override
  State<MedecinPrescriptionFormScreen> createState() => _MedecinPrescriptionFormScreenState();
}

class _MedecinPrescriptionFormScreenState extends State<MedecinPrescriptionFormScreen> {
  final _patientId = TextEditingController();
  final _contenu = TextEditingController();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    if (widget.patientId != null) _patientId.text = '${widget.patientId}';
  }

  @override
  void dispose() {
    _patientId.dispose();
    _contenu.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final auth = context.read<AuthProvider>();
    setState(() => _busy = true);
    try {
      final body = {
        'patient_id': int.tryParse(_patientId.text.trim()),
        'contenu': _contenu.text.trim(),
        'medicaments': _contenu.text.trim(),
      };
      if (widget.prescriptionId == null) {
        await auth.medecinRepo.createPrescription(body);
      } else {
        await auth.medecinRepo.updatePrescription(widget.prescriptionId!, body);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.sync.isOnline ? 'Prescription enregistrée' : 'En file de sync')),
      );
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _annuler() async {
    if (widget.prescriptionId == null) return;
    final auth = context.read<AuthProvider>();
    await auth.medecinRepo.annulerPrescription(widget.prescriptionId!);
    if (!mounted) return;
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Prescription'),
        actions: [
          if (widget.prescriptionId != null)
            IconButton(icon: const Icon(Icons.delete_outline), onPressed: _annuler),
        ],
      ),
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
              controller: _contenu,
              maxLines: 8,
              decoration: const InputDecoration(
                labelText: 'Médicaments / posologie',
                border: OutlineInputBorder(),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 20),
            FilledButton(onPressed: _busy ? null : _save, child: const Text('Enregistrer')),
          ],
        ),
      ),
    );
  }
}
