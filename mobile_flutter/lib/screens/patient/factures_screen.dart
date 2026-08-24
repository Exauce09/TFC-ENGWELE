import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../widgets/amen_ui.dart';
import '../../widgets/sync_banner.dart';
import '../widgets/staff_widgets.dart';

class PatientFacturesScreen extends StatefulWidget {
  const PatientFacturesScreen({super.key});

  @override
  State<PatientFacturesScreen> createState() => _PatientFacturesScreenState();
}

class _PatientFacturesScreenState extends State<PatientFacturesScreen> {
  List<dynamic> _items = [];
  String? _error;
  bool _loading = true;
  String _filter = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      final data = await auth.patientRepo.factures();
      if (mounted) setState(() => _items = data);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool _isAPayer(Map f) =>
      ['emise', 'partiellement_payee', 'impayee'].contains(f['statut']?.toString());

  List<dynamic> get _filtered {
    if (_filter == 'a_payer') return _items.whereType<Map>().where(_isAPayer).toList();
    if (_filter == 'payees') {
      return _items.whereType<Map>().where((f) => f['statut']?.toString() == 'payee').toList();
    }
    return _items;
  }

  String _money(dynamic n) {
    final v = num.tryParse(n?.toString() ?? '0') ?? 0;
    return '${NumberFormat('#,###').format(v)} FC';
  }

  Future<void> _payer(Map f) async {
    final auth = context.read<AuthProvider>();
    final phone = TextEditingController(text: auth.user?.phone ?? '');
    String mode = 'airtel_money';
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: StatefulBuilder(
            builder: (ctx, setModal) {
              return Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Payer ${f['numero_facture'] ?? ''}', style: Theme.of(ctx).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text('Reste : ${_money(f['reste_a_payer'] ?? f['montant'])}', style: const TextStyle(color: AmenColors.muted)),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: mode,
                    decoration: const InputDecoration(labelText: 'Opérateur'),
                    items: const [
                      DropdownMenuItem(value: 'airtel_money', child: Text('Airtel Money')),
                      DropdownMenuItem(value: 'mpesa', child: Text('M-Pesa')),
                    ],
                    onChanged: (v) => setModal(() => mode = v ?? mode),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Téléphone Mobile Money'),
                  ),
                  const SizedBox(height: 16),
                  FilledButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    child: const Text('Confirmer le paiement'),
                  ),
                  TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Annuler')),
                ],
              );
            },
          ),
        );
      },
    );
    if (ok != true) {
      phone.dispose();
      return;
    }
    try {
      await auth.patientRepo.payerFacture(
        (f['id'] as num).toInt(),
        mode: mode,
        telephone: phone.text.trim(),
      );
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.sync.isOnline ? 'Paiement enregistré' : 'Paiement mis en file de sync'),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    } finally {
      phone.dispose();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes factures')),
      body: SyncScaffoldBody(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: Row(
                children: [
                  ChoiceChip(
                    label: const Text('Toutes'),
                    selected: _filter == 'all',
                    onSelected: (_) => setState(() => _filter = 'all'),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('À payer'),
                    selected: _filter == 'a_payer',
                    onSelected: (_) => setState(() => _filter = 'a_payer'),
                  ),
                  const SizedBox(width: 8),
                  ChoiceChip(
                    label: const Text('Payées'),
                    selected: _filter == 'payees',
                    onSelected: (_) => setState(() => _filter = 'payees'),
                  ),
                ],
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                color: AmenColors.primary,
                onRefresh: _load,
                child: _loading
                    ? ListView(children: const [SizedBox(height: 120), Center(child: CircularProgressIndicator())])
                    : _error != null
                        ? ListView(padding: const EdgeInsets.all(16), children: [AmenErrorBox(message: _error!, onRetry: _load)])
                        : _filtered.isEmpty
                            ? ListView(children: const [AmenEmptyState(message: 'Aucune facture')])
                            : ListView.builder(
                                itemCount: _filtered.length,
                                itemBuilder: (_, i) {
                                  final f = Map<String, dynamic>.from(_filtered[i] as Map);
                                  final aPayer = _isAPayer(f);
                                  return Material(
                                    color: AmenColors.paper,
                                    child: InkWell(
                                      onTap: aPayer ? () => _payer(f) : null,
                                      child: Container(
                                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 14),
                                        decoration: const BoxDecoration(
                                          border: Border(bottom: BorderSide(color: AmenColors.line)),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              f['numero_facture']?.toString() ?? 'Facture',
                                              style: Theme.of(context).textTheme.titleMedium,
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              _money(f['montant_ttc'] ?? f['montant'] ?? f['reste_a_payer']),
                                              style: const TextStyle(
                                                fontSize: 20,
                                                fontWeight: FontWeight.w700,
                                                color: AmenColors.ink,
                                              ),
                                            ),
                                            StatusChip(statut: (f['statut'] ?? '').toString()),
                                            if (aPayer) ...[
                                              const SizedBox(height: 10),
                                              FilledButton(
                                                onPressed: () => _payer(f),
                                                child: const Text('Payer maintenant'),
                                              ),
                                            ],
                                          ],
                                        ),
                                      ),
                                    ),
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
