import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';
import '../../utils/json_safe.dart';
import '../../widgets/amen_ui.dart';
import '../../widgets/sync_banner.dart';

class PatientDossierScreen extends StatefulWidget {
  const PatientDossierScreen({super.key, this.initialTab = 0});

  final int initialTab;

  static int tabIndexFromQuery(String? tab) {
    switch ((tab ?? '').toLowerCase()) {
      case '1':
      case 'consultations':
      case 'consultation':
        return 1;
      case '2':
      case 'resultats':
      case 'résultats':
      case 'examens':
        return 2;
      case '3':
      case 'ordonnances':
      case 'prescriptions':
        return 3;
      case '0':
      case 'complet':
      case 'dossier':
      default:
        return 0;
    }
  }

  @override
  State<PatientDossierScreen> createState() => _PatientDossierScreenState();
}

class _PatientDossierScreenState extends State<PatientDossierScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  Map<String, dynamic>? _dossier;
  List<dynamic> _prescriptions = [];
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    final start = widget.initialTab.clamp(0, 3);
    _tabs = TabController(length: 4, vsync: this, initialIndex: start);
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void didUpdateWidget(covariant PatientDossierScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialTab != widget.initialTab && widget.initialTab >= 0 && widget.initialTab < 4) {
      _tabs.animateTo(widget.initialTab);
    }
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final auth = context.read<AuthProvider>();
    try {
      final results = await Future.wait([
        auth.patientRepo.dossier(),
        auth.patientRepo.prescriptions(),
      ]);
      if (!mounted) return;
      setState(() {
        _dossier = asDynMap(results[0]);
        _prescriptions = asDynList(results[1]);
      });
    } catch (e) {
      if (mounted) setState(() => _error = auth.api.friendlyError(e));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _fmt(dynamic raw) {
    if (raw == null || raw.toString().trim().isEmpty) return '—';
    try {
      return DateFormat('dd/MM/yyyy').format(DateTime.parse(raw.toString()));
    } catch (_) {
      return raw.toString();
    }
  }

  String _medecinName(Map m) {
    final med = asDynMap(m['medecin']);
    final user = asDynMap(med['user']);
    return asStr(user['name'] ?? med['nom'] ?? m['medecin_nom'], '');
  }

  String _deptName(Map m) {
    final d = asDynMap(m['departement']);
    return asStr(d['nom'] ?? m['service'], '');
  }

  String _examenTitle(Map m) => asStr(
        m['type_examen'] ?? m['type_analyse'] ?? m['libelle'] ?? m['type'] ?? m['nom'] ?? m['examen'],
        'Examen',
      );

  List<dynamic> get _consultations =>
      asDynList(_dossier?['consultations'] ?? _dossier?['dossiers']);

  List<dynamic> get _visites => asDynList(_dossier?['visites']);

  List<dynamic> get _resultats {
    final examens = asDynList(_dossier?['examens'] ?? _dossier?['analyses']);
    final derniers = asDynList(_dossier?['derniers_resultats']);
    final analyses = asDynList(_dossier?['analyses']);
    final fromExamens = examens.where((e) {
      final m = asDynMap(e);
      return asStr(m['statut']) == 'termine' || asDynList(m['resultats']).isNotEmpty;
    }).toList();
    if (fromExamens.isNotEmpty) return fromExamens;
    if (derniers.isNotEmpty) return derniers;
    if (examens.isNotEmpty) return examens;
    return analyses;
  }

  Map<String, dynamic> get _patient {
    final p = asDynMap(_dossier?['patient']);
    if (p.isNotEmpty) return p;
    return asDynMap(_dossier);
  }

  Widget _sectionTitle(String text) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 18, 16, 8),
      child: Text(
        text,
        style: const TextStyle(
          fontFamily: 'Outfit',
          fontSize: 13,
          fontWeight: FontWeight.w800,
          letterSpacing: 0.6,
          color: AmenColors.primary,
        ),
      ),
    );
  }

  Widget _block(String label, String value, {Color? bg}) {
    if (value.trim().isEmpty || value == '—') return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bg ?? AmenColors.wash,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AmenColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontFamily: 'Outfit',
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: AmenColors.muted,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: const TextStyle(
              fontFamily: 'Outfit',
              fontSize: 14,
              height: 1.45,
              color: AmenColors.ink,
            ),
          ),
        ],
      ),
    );
  }

  Widget _patientHeader() {
    final p = _patient;
    final user = asDynMap(p['user']);
    final name = asStr(user['name'] ?? p['nom'], 'Patient');
    final numero = asStr(p['numero_patient'], '—');
    final allergies = asStr(p['allergies'], 'Aucune connue');
    final naissance = _fmt(p['date_naissance']);

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AmenColors.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AmenColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'DOSSIER COMPLET',
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: AmenColors.primary,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 8),
          Text(name, style: const TextStyle(fontFamily: 'Fraunces', fontSize: 22, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text('N° patient : $numero', style: const TextStyle(fontFamily: 'Outfit', fontSize: 13, color: AmenColors.muted)),
          Text('Naissance : $naissance', style: const TextStyle(fontFamily: 'Outfit', fontSize: 13, color: AmenColors.muted)),
          Text(
            'Allergies : $allergies',
            style: TextStyle(
              fontFamily: 'Outfit',
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: allergies == 'Aucune connue' ? AmenColors.muted : AmenColors.danger,
            ),
          ),
        ],
      ),
    );
  }

  Widget _visiteCard(Map m) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFEEF7F5),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AmenColors.line),
      ),
      child: Text(
        '${asStr(m['numero_admission'], 'Visite')} · ${asStr(m['statut_label'] ?? m['statut'])}'
        '${asStr(m['service']).isNotEmpty ? ' · ${asStr(m['service'])}' : ''}'
        '${asStr(m['motif']).isNotEmpty ? '\n${asStr(m['motif'])}' : ''}',
        style: const TextStyle(fontFamily: 'Outfit', fontSize: 13, height: 1.35, color: AmenColors.ink),
      ),
    );
  }

  Widget _consultationCard(Map m) {
    final triage = asDynMap(m['triage']);
    final diagnostics = asDynList(m['diagnostics']);
    final hasMedical = asStr(m['anamnese']).isNotEmpty ||
        asStr(m['examen_clinique']).isNotEmpty ||
        asStr(m['diagnostic_final']).isNotEmpty ||
        asStr(m['diagnostic_provisoire']).isNotEmpty ||
        diagnostics.isNotEmpty;

    final meta = [
      _fmt(m['date_consultation'] ?? m['created_at'] ?? m['date']),
      if (_deptName(m).isNotEmpty) _deptName(m),
      if (_medecinName(m).isNotEmpty) _medecinName(m),
      if (asStr(m['numero_admission']).isNotEmpty) asStr(m['numero_admission']),
    ].join(' · ');

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AmenColors.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AmenColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            asStr(m['motif'] ?? m['numero_dossier'], 'Consultation'),
            style: const TextStyle(fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w700, color: AmenColors.ink),
          ),
          const SizedBox(height: 4),
          Text(meta, style: const TextStyle(fontFamily: 'Outfit', fontSize: 12, color: AmenColors.muted)),
          if (asStr(m['statut_parcours_label']).isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              asStr(m['statut_parcours_label']),
              style: const TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w700, color: AmenColors.primary),
            ),
          ],
          if (triage.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFED7AA)),
              ),
              child: Text(
                'Triage · urgence ${asStr(triage['niveau_urgence'], '—')}'
                '${triage['temperature'] != null ? ' · T° ${triage['temperature']}' : ''}'
                '${triage['tension_arterielle'] != null ? ' · TA ${triage['tension_arterielle']}' : ''}'
                '${triage['frequence_cardiaque'] != null ? ' · FC ${triage['frequence_cardiaque']}' : ''}'
                '${triage['saturation_02'] != null ? ' · SpO₂ ${triage['saturation_02']}%' : ''}',
                style: const TextStyle(fontFamily: 'Outfit', fontSize: 13, color: AmenColors.ink),
              ),
            ),
          ],
          _block('Anamnèse', asStr(m['anamnese'])),
          _block('Examen clinique', asStr(m['examen_clinique'])),
          _block(
            'Diagnostic',
            asStr(m['diagnostic_final'] ?? m['diagnostic_provisoire']),
            bg: const Color(0xFFECFDF5),
          ),
          for (final d in diagnostics)
            _block(
              'Diagnostic ${asStr(asDynMap(d)['code_cim10']).isNotEmpty ? '(${asStr(asDynMap(d)['code_cim10'])})' : ''}',
              asStr(asDynMap(d)['libelle']),
              bg: const Color(0xFFECFDF5),
            ),
          _block('Observations', asStr(m['observations'])),
          if (!hasMedical)
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text(
                'Fiche d’arrivée enregistrée. Le détail médical apparaît dès que le médecin complète la consultation.',
                style: TextStyle(fontFamily: 'Outfit', fontSize: 13, color: AmenColors.muted, height: 1.4),
              ),
            ),
        ],
      ),
    );
  }

  Widget _resultatCard(Map m) {
    final params = asDynList(m['resultats']);
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AmenColors.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AmenColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_examenTitle(m), style: const TextStyle(fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text(
            '${asStr(m['statut_label'] ?? m['statut'], '—')} · ${_fmt(m['termine_at'] ?? m['date_analyse'] ?? m['created_at'] ?? m['date_prelevement'])}'
            '${asStr(m['numero_admission']).isNotEmpty ? ' · ${asStr(m['numero_admission'])}' : ''}',
            style: const TextStyle(fontFamily: 'Outfit', fontSize: 12, color: AmenColors.muted),
          ),
          if (params.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 10),
              child: Text('Aucun paramètre détaillé.', style: TextStyle(color: AmenColors.muted, fontSize: 13)),
            )
          else
            ...params.map((p) {
              final row = asDynMap(p);
              final label = asStr(row['parametre'] ?? row['nom'], 'Paramètre');
              final val = [
                asStr(row['valeur']),
                asStr(row['unite']),
                if (asStr(row['norme']).isNotEmpty) '(norme ${asStr(row['norme'])})',
                if (asStr(row['flag']).isNotEmpty) '[${asStr(row['flag'])}]',
              ].where((s) => s.isNotEmpty).join(' ');
              return Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    Expanded(child: Text(label, style: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w600))),
                    Text(val.isEmpty ? '—' : val, style: const TextStyle(fontFamily: 'Outfit')),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _ordonnanceCard(Map m) {
    final meds = m['medicaments'];
    String contenu;
    if (meds is List) {
      contenu = meds.map((e) {
        if (e is Map) {
          final row = asDynMap(e);
          return [
            asStr(row['nom'] ?? row['medicament'] ?? row['libelle']),
            asStr(row['posologie'] ?? row['dosage']),
            asStr(row['duree']),
          ].where((s) => s.isNotEmpty).join(' — ');
        }
        return e.toString();
      }).where((s) => s.trim().isNotEmpty).join('\n');
    } else {
      contenu = asStr(m['contenu'] ?? meds ?? m['posologie'] ?? m['instructions'] ?? m['instructions_generales']);
    }

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AmenColors.paper,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AmenColors.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            asStr(m['numero_ordonnance'], 'Ordonnance'),
            style: const TextStyle(fontFamily: 'Outfit', fontSize: 16, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          Text(
            '${_fmt(m['created_at'] ?? m['date'] ?? m['date_prescription'])} · ${asStr(m['statut_label'] ?? m['statut'], '—')}',
            style: const TextStyle(fontFamily: 'Outfit', fontSize: 12, color: AmenColors.muted),
          ),
          _block('Contenu', contenu),
          _block('Instructions', asStr(m['instructions_generales'] ?? m['posologie_generale'] ?? m['diagnostic_motif'])),
          if (_medecinName(m).isNotEmpty) _block('Médecin', _medecinName(m)),
        ],
      ),
    );
  }

  Widget _empty(String msg) => AmenEmptyState(message: msg);

  Widget _scrollBody(List<Widget> children) {
    return RefreshIndicator(
      color: AmenColors.primary,
      onRefresh: _load,
      child: ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 28),
        children: children,
      ),
    );
  }

  Widget _completView() {
    final consultations = _consultations;
    final resultats = _resultats;
    final visites = _visites;

    return _scrollBody([
      _patientHeader(),
      if (visites.isNotEmpty) ...[
        _sectionTitle('VISITES'),
        ...visites.map((v) => _visiteCard(asDynMap(v))),
      ],
      _sectionTitle('CONSULTATIONS (${consultations.length})'),
      if (consultations.isEmpty)
        _empty('Aucune consultation enregistrée.')
      else
        ...consultations.map((c) => _consultationCard(asDynMap(c))),
      _sectionTitle('RÉSULTATS (${resultats.length})'),
      if (resultats.isEmpty)
        _empty('Aucun résultat disponible.')
      else
        ...resultats.map((r) => _resultatCard(asDynMap(r))),
      _sectionTitle('ORDONNANCES (${_prescriptions.length})'),
      if (_prescriptions.isEmpty)
        _empty('Aucune ordonnance.')
      else
        ..._prescriptions.map((p) => _ordonnanceCard(asDynMap(p))),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final consultations = _consultations;
    final resultats = _resultats;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon dossier'),
        bottom: TabBar(
          controller: _tabs,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          tabs: [
            const Tab(text: 'Complet'),
            Tab(text: 'Consultations (${consultations.length})'),
            Tab(text: 'Résultats (${resultats.length})'),
            Tab(text: 'Ordonnances (${_prescriptions.length})'),
          ],
        ),
      ),
      body: SyncScaffoldBody(
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Padding(padding: const EdgeInsets.all(16), child: AmenErrorBox(message: _error!, onRetry: _load))
                : TabBarView(
                    controller: _tabs,
                    children: [
                      _completView(),
                      _scrollBody([
                        if (consultations.isEmpty)
                          _empty('Aucune consultation enregistrée.')
                        else
                          ...consultations.map((c) => _consultationCard(asDynMap(c))),
                      ]),
                      _scrollBody([
                        if (resultats.isEmpty)
                          _empty('Aucun résultat disponible.')
                        else
                          ...resultats.map((r) => _resultatCard(asDynMap(r))),
                      ]),
                      _scrollBody([
                        if (_prescriptions.isEmpty)
                          _empty('Aucune ordonnance.')
                        else
                          ..._prescriptions.map((p) => _ordonnanceCard(asDynMap(p))),
                      ]),
                    ],
                  ),
      ),
    );
  }
}
