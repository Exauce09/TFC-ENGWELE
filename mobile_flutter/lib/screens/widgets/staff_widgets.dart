import 'package:flutter/material.dart';

import '../../theme/amen_theme.dart';

class StaffErrorBox extends StatelessWidget {
  const StaffErrorBox({super.key, required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF5F5),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        children: [
          Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AmenColors.danger)),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: onRetry, child: const Text('Réessayer')),
        ],
      ),
    );
  }
}

class StaffEmpty extends StatelessWidget {
  const StaffEmpty({super.key, required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32),
      child: Text(message, textAlign: TextAlign.center, style: const TextStyle(color: AmenColors.muted)),
    );
  }
}

class StaffStat {
  const StaffStat(this.label, this.value);
  final String label;
  final String value;
}

class StaffStatGrid extends StatelessWidget {
  const StaffStatGrid({super.key, required this.items});
  final List<StaffStat> items;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 16,
      runSpacing: 8,
      children: items
          .map(
            (s) => SizedBox(
              width: (MediaQuery.sizeOf(context).width - 52) / 2,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(s.value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AmenColors.ink)),
                  Text(s.label, style: const TextStyle(color: AmenColors.muted, fontSize: 12)),
                ],
              ),
            ),
          )
          .toList(),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.statut});
  final String statut;

  @override
  Widget build(BuildContext context) {
    if (statut.isEmpty) return const SizedBox.shrink();
    Color fg = AmenColors.muted;
    switch (statut) {
      case 'en_cours':
      case 'confirme':
        fg = AmenColors.primary;
        break;
      case 'termine':
      case 'paye':
      case 'payee':
        fg = AmenColors.success;
        break;
      case 'absent':
      case 'annule':
        fg = AmenColors.warn;
        break;
    }
    return Padding(
      padding: const EdgeInsets.only(top: 6),
      child: Text(
        statut.replaceAll('_', ' ').toUpperCase(),
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 0.6),
      ),
    );
  }
}
