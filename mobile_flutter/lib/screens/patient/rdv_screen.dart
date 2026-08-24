import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../utils/json_safe.dart';
import '../../widgets/amen_ui.dart';
import '../../widgets/sync_banner.dart';

class PatientRdvScreen extends StatefulWidget {
  const PatientRdvScreen({super.key});

  @override
  State<PatientRdvScreen> createState() => _PatientRdvScreenState();
}

class _PatientRdvScreenState extends State<PatientRdvScreen> {
  List<dynamic> _items = [];
  String? _error;
  bool _loading = true;

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
      final data = await auth.patientRepo.rendezVous();
      if (mounted) setState(() => _items = data);
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _annuler(int id) async {
    final auth = context.read<AuthProvider>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Annuler le RDV ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Non')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Oui')),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await auth.patientRepo.annulerRendezVous(id);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    }
  }

  Future<void> _reporter(Map<String, dynamic> r) async {
    final auth = context.read<AuthProvider>();
    final id = (r['id'] as num).toInt();
    DateTime date = DateTime.now().add(const Duration(days: 1));
    final d = await showDatePicker(
      context: context,
      initialDate: date,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (d == null || !mounted) return;
    final t = await showTimePicker(context: context, initialTime: const TimeOfDay(hour: 9, minute: 0));
    if (t == null || !mounted) return;
    date = DateTime(d.year, d.month, d.day, t.hour, t.minute);
    try {
      await auth.patientRepo.reporterRendezVous(id, {
        'date_rdv': DateFormat('yyyy-MM-dd').format(date),
        'heure_rdv': DateFormat('HH:mm').format(date),
      });
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            auth.sync.isOnline ? 'RDV reporté' : 'Report enregistré — sync à la reconnexion',
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
    }
  }

  String _fmt(dynamic raw) {
    if (raw == null) return '—';
    try {
      return DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(raw.toString()));
    } catch (_) {
      return raw.toString();
    }
  }

  String _medecinName(Map<String, dynamic> r) {
    final med = r['medecin'];
    if (med is Map) {
      final u = med['user'];
      if (u is Map && u['name'] != null) return u['name'].toString();
      if (med['nom'] != null) return med['nom'].toString();
    }
    return r['medecin_nom']?.toString() ?? 'Médecin';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Mes rendez-vous')),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreate,
        icon: const Icon(Icons.add),
        label: const Text('Nouveau RDV'),
      ),
      body: SyncScaffoldBody(
        child: RefreshIndicator(
          color: AmenColors.primary,
          onRefresh: _load,
          child: _loading
              ? ListView(children: const [SizedBox(height: 120), Center(child: CircularProgressIndicator())])
              : _error != null
                  ? ListView(
                      padding: const EdgeInsets.all(16),
                      children: [AmenErrorBox(message: _error!, onRetry: _load)],
                    )
                  : _items.isEmpty
                      ? ListView(children: const [AmenEmptyState(message: 'Aucun rendez-vous')])
                      : ListView.builder(
                          itemCount: _items.length,
                          itemBuilder: (context, i) {
                            final r = Map<String, dynamic>.from(_items[i] as Map);
                            final id = (r['id'] as num?)?.toInt();
                            final statut = (r['statut'] ?? '').toString();
                            final pending = r['sync_status'] == 'pending';
                            return Container(
                              width: double.infinity,
                              padding: const EdgeInsets.fromLTRB(20, 16, 20, 12),
                              decoration: const BoxDecoration(
                                color: AmenColors.paper,
                                border: Border(bottom: BorderSide(color: AmenColors.line)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    r['motif']?.toString() ?? 'Rendez-vous',
                                    style: Theme.of(context).textTheme.titleMedium,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${_fmt(r['date_heure'] ?? r['date'])} · ${_medecinName(r)}',
                                    style: const TextStyle(color: AmenColors.muted),
                                  ),
                                  Text(
                                    '${statut.replaceAll('_', ' ')}${pending ? ' · sync…' : ''}',
                                    style: const TextStyle(
                                      color: AmenColors.primary,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  if (id != null && (statut == 'en_attente' || statut == 'confirme'))
                                    Padding(
                                      padding: const EdgeInsets.only(top: 8),
                                      child: Row(
                                        children: [
                                          OutlinedButton(
                                            onPressed: () => _reporter(r),
                                            child: const Text('Reporter'),
                                          ),
                                          const SizedBox(width: 8),
                                          TextButton(
                                            onPressed: () => _annuler(id),
                                            child: const Text(
                                              'Annuler',
                                              style: TextStyle(color: AmenColors.danger),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                ],
                              ),
                            );
                          },
                        ),
        ),
      ),
    );
  }

  Future<void> _openCreate() async {
    final auth = context.read<AuthProvider>();
    List<dynamic> deps = [];
    List<dynamic> allMeds = [];
    try {
      deps = await auth.patientRepo.departements();
      allMeds = await auth.patientRepo.medecins();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.api.friendlyError(e))));
      return;
    }
    if (!mounted) return;

    final deptIdsWithDocs = allMeds
        .map((raw) => asInt(asDynMap(raw)['departement_id'] ?? asDynMap(asDynMap(raw)['user'])['departement_id']))
        .where((id) => id != 0)
        .toSet();
    if (deptIdsWithDocs.isNotEmpty) {
      final filtered = deps.where((d) => deptIdsWithDocs.contains(asInt(asDynMap(d)['id']))).toList();
      if (filtered.isNotEmpty) deps = filtered;
    }

    int? depId;
    int? medId;
    List<dynamic> meds = [];
    List<dynamic> slots = [];
    String? selectedSlot;
    final motif = TextEditingController();
    DateTime day = DateTime.now().add(const Duration(days: 1));

    Future<void> loadSlots(StateSetter setModal) async {
      if (medId == null) {
        slots = [];
        selectedSlot = null;
        setModal(() {});
        return;
      }
      final dateStr =
          '${day.year.toString().padLeft(4, '0')}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
      try {
        slots = await auth.patientRepo.creneaux(medecinId: medId!, date: dateStr);
      } catch (_) {
        slots = [];
      }
      selectedSlot = null;
      setModal(() {});
    }

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModal) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
              ),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Nouveau rendez-vous', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<int>(
                      isExpanded: true,
                      decoration: const InputDecoration(labelText: 'Département', border: OutlineInputBorder()),
                      items: deps
                          .map((d) {
                            final m = asDynMap(d);
                            return DropdownMenuItem(
                              value: asInt(m['id']),
                              child: Text(asStr(m['nom']), overflow: TextOverflow.ellipsis),
                            );
                          })
                          .where((e) => e.value != 0)
                          .toList(),
                      onChanged: (v) async {
                        depId = v;
                        medId = null;
                        meds = [];
                        setModal(() {});
                        if (v != null) {
                          meds = await auth.patientRepo.medecins(departementId: v);
                        }
                        setModal(() {});
                      },
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<int>(
                      isExpanded: true,
                      value: medId != null && meds.any((m) => asInt(asDynMap(m)['id']) == medId) ? medId : null,
                      decoration: InputDecoration(
                        labelText: 'Médecin',
                        helperText: depId == null
                            ? 'Choisissez d’abord un département'
                            : (meds.isEmpty ? 'Aucun médecin dans ce service' : '${meds.length} médecin(s)'),
                      ),
                      items: meds.map((raw) {
                        final m = asDynMap(raw);
                        final user = asDynMap(m['user']);
                        final name = asStr(
                          m['name'] ?? user['name'] ?? m['nom'],
                          'Médecin',
                        );
                        final spec = asStr(m['specialite']);
                        return DropdownMenuItem(
                          value: asInt(m['id']),
                          child: Text(
                            spec.isEmpty ? name : '$name — $spec',
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).where((e) => e.value != 0).toList(),
                      onChanged: (v) async {
                        medId = v;
                        await loadSlots(setModal);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: motif,
                      decoration: const InputDecoration(labelText: 'Motif', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Jour : ${DateFormat('dd/MM/yyyy').format(day)}'),
                      trailing: const Icon(Icons.edit_calendar),
                      onTap: () async {
                        final d = await showDatePicker(
                          context: ctx,
                          initialDate: day,
                          firstDate: DateTime.now(),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (d == null) return;
                        day = d;
                        await loadSlots(setModal);
                      },
                    ),
                    if (slots.isNotEmpty) ...[
                      const Text('Créneaux disponibles', style: TextStyle(fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: slots.map((s) {
                          final label = s is Map
                              ? (s['heure'] ?? s['slot'] ?? s['label'] ?? s.toString()).toString()
                              : s.toString();
                          final selected = selectedSlot == label;
                          return ChoiceChip(
                            label: Text(label),
                            selected: selected,
                            onSelected: (_) => setModal(() => selectedSlot = label),
                          );
                        }).toList(),
                      ),
                    ] else if (medId != null)
                      Text(
                        auth.sync.isOnline
                            ? 'Aucun créneau — une heure libre sera proposée'
                            : 'Hors ligne : créneaux indisponibles, envoi en file sync',
                        style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                      ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () async {
                        if (depId == null || medId == null || motif.text.trim().isEmpty) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(content: Text('Complétez tous les champs')),
                          );
                          return;
                        }
                        if (slots.isNotEmpty && selectedSlot == null) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(content: Text('Choisissez un créneau horaire')),
                          );
                          return;
                        }
                        var heure = '09:00';
                        if (selectedSlot != null && selectedSlot!.length >= 5) {
                          heure = selectedSlot!.substring(0, 5);
                        }
                        final dateRdv =
                            '${day.year.toString().padLeft(4, '0')}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
                        try {
                          await auth.patientRepo.prendreRendezVous({
                            'departement_id': depId,
                            'medecin_id': medId,
                            'motif': motif.text.trim(),
                            'date_rdv': dateRdv,
                            'heure_rdv': heure,
                            'type': 'presentiel',
                          });
                          if (ctx.mounted) Navigator.pop(ctx);
                          await _load();
                        } catch (e) {
                          if (!ctx.mounted) return;
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: Text(auth.api.friendlyError(e))),
                          );
                        }
                      },
                      child: const Text('Enregistrer'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
    motif.dispose();
  }
}
