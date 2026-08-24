import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../data/sync/sync_engine.dart';
import '../data/sync/sync_status.dart';
import '../theme/amen_theme.dart';

class SyncBanner extends StatelessWidget {
  const SyncBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final sync = context.watch<SyncEngine>();
    final status = sync.uiStatus;
    if (status == SyncUiStatus.synced) return const SizedBox.shrink();

    final label = sync.pendingCount > 0
        ? '${status.label} · ${sync.pendingCount}'
        : (sync.lastError ?? status.label);

    return Material(
      color: status == SyncUiStatus.offline
          ? const Color(0xFFFFF7E8)
          : status == SyncUiStatus.error
              ? const Color(0xFFFFF1F1)
              : const Color(0xFFE8F5F3),
      child: InkWell(
        onTap: sync.isOnline ? () => sync.syncNow() : null,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Icon(
                status == SyncUiStatus.offline ? Icons.wifi_off : Icons.sync,
                size: 16,
                color: status == SyncUiStatus.error ? AmenColors.danger : AmenColors.primary,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: status == SyncUiStatus.error ? AmenColors.danger : AmenColors.ink,
                  ),
                ),
              ),
              if (sync.isOnline)
                const Text(
                  'Actualiser',
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 12,
                    color: AmenColors.primary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class SyncScaffoldBody extends StatelessWidget {
  const SyncScaffoldBody({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SyncBanner(),
        Expanded(child: child),
      ],
    );
  }
}
