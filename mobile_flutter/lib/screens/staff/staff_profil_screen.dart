import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../config/api_config.dart';
import '../../models/auth_user.dart';
import '../../providers/auth_provider.dart';
import '../../theme/amen_theme.dart';

class StaffProfilScreen extends StatelessWidget {
  const StaffProfilScreen({super.key, required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final phone = (user?.phone ?? '').trim();

    return Scaffold(
      backgroundColor: AmenColors.wash,
      appBar: AppBar(title: Text(title)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [AmenColors.primaryDeep, AmenColors.primary],
              ),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 38,
                  backgroundColor: Colors.white.withValues(alpha: 0.18),
                  child: Text(
                    user?.initial ?? 'A',
                    style: const TextStyle(
                      fontFamily: 'Fraunces',
                      fontSize: 30,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user?.name ?? '—',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'Fraunces',
                    fontSize: 22,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  roleLabel(user?.role),
                  style: TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 13,
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            decoration: BoxDecoration(
              color: AmenColors.paper,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AmenColors.line),
            ),
            child: Column(
              children: [
                _row(Icons.email_outlined, 'Email', user?.email ?? '—'),
                if (phone.isNotEmpty) _row(Icons.phone_outlined, 'Téléphone', phone),
                _row(Icons.badge_outlined, 'Rôle', roleLabel(user?.role)),
              ],
            ),
          ),
          const SizedBox(height: 20),
          FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: AmenColors.danger,
              minimumSize: const Size.fromHeight(48),
            ),
            onPressed: () async => auth.logout(),
            icon: const Icon(Icons.logout),
            label: const Text('Se déconnecter'),
          ),
          const SizedBox(height: 16),
          Text(
            'AMEN Flutter  v1.2.10\n${ApiConfig.baseUrl}',
            textAlign: TextAlign.center,
            style: const TextStyle(fontFamily: 'Outfit', fontSize: 10, color: AmenColors.muted, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AmenColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AmenColors.muted,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(fontFamily: 'Outfit', fontSize: 14.5, color: AmenColors.ink),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
