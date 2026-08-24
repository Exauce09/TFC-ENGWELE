import 'package:flutter/material.dart';

import '../theme/amen_theme.dart';

class AmenLogoMark extends StatelessWidget {
  const AmenLogoMark({super.key, this.size = 48});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: AmenColors.primary,
        borderRadius: BorderRadius.circular(size * 0.32),
        boxShadow: [
          BoxShadow(
            color: AmenColors.primary.withValues(alpha: 0.28),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Text(
        'A',
        style: TextStyle(
          fontFamily: 'Outfit',
          color: Colors.white,
          fontWeight: FontWeight.w800,
          fontSize: size * 0.42,
        ),
      ),
    );
  }
}

class AmenBrandMark extends StatelessWidget {
  const AmenBrandMark({super.key, this.light = false, this.size = 36});

  final bool light;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Text(
      'AMEN',
      style: TextStyle(
        fontFamily: 'Fraunces',
        fontSize: size,
        fontWeight: FontWeight.w600,
        color: light ? Colors.white : AmenColors.ink,
        height: 1,
        letterSpacing: 1.2,
      ),
    );
  }
}

/// Bandeau image hôpital — ancre visuelle réelle.
class AmenHospitalHero extends StatelessWidget {
  const AmenHospitalHero({
    super.key,
    required this.height,
    this.title,
    this.subtitle,
    this.child,
  });

  final double height;
  final String? title;
  final String? subtitle;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            'assets/images/login-hospital.jpg',
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: AmenColors.primaryDeep),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x33062E2C),
                  Color(0x99062E2C),
                  Color(0xE6062E2C),
                ],
              ),
            ),
          ),
          if (child != null)
            child!
          else
            Positioned(
              left: 24,
              right: 24,
              bottom: 28,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const AmenBrandMark(light: true, size: 42),
                  if (title != null) ...[
                    const SizedBox(height: 10),
                    Text(
                      title!,
                      style: const TextStyle(
                        fontFamily: 'Fraunces',
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.w600,
                        height: 1.1,
                      ),
                    ),
                  ],
                  if (subtitle != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      subtitle!,
                      style: TextStyle(
                        fontFamily: 'Outfit',
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 14,
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class AmenPageHeader extends StatelessWidget {
  const AmenPageHeader({
    super.key,
    required this.eyebrow,
    required this.title,
    this.subtitle,
    this.trailing,
  });

  final String eyebrow;
  final String title;
  final String? subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  eyebrow.toUpperCase(),
                  style: const TextStyle(
                    fontFamily: 'Outfit',
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.4,
                    color: AmenColors.primary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  title,
                  style: const TextStyle(
                    fontFamily: 'Fraunces',
                    fontSize: 32,
                    fontWeight: FontWeight.w600,
                    color: AmenColors.ink,
                    height: 1.05,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    subtitle!,
                    style: const TextStyle(fontFamily: 'Outfit', fontSize: 13.5, color: AmenColors.muted),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class AmenMetric extends StatelessWidget {
  const AmenMetric({
    super.key,
    required this.label,
    required this.value,
    this.onTap,
  });

  final String label;
  final String value;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: 'Fraunces',
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  color: AmenColors.ink,
                ),
              ),
              Text(
                label,
                style: const TextStyle(
                  fontFamily: 'Outfit',
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AmenColors.muted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AmenRow extends StatelessWidget {
  const AmenRow({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.leading,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Widget? leading;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AmenColors.paper,
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: AmenColors.line)),
          ),
          child: Row(
            children: [
              if (leading != null) ...[leading!, const SizedBox(width: 14)],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontFamily: 'Outfit',
                        fontWeight: FontWeight.w600,
                        fontSize: 15,
                        color: AmenColors.ink,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subtitle,
                      style: const TextStyle(fontFamily: 'Outfit', fontSize: 12.5, color: AmenColors.muted),
                    ),
                  ],
                ),
              ),
              trailing ?? const Icon(Icons.arrow_forward_ios, size: 14, color: AmenColors.muted),
            ],
          ),
        ),
      ),
    );
  }
}

class AmenEmptyState extends StatelessWidget {
  const AmenEmptyState({
    super.key,
    required this.message,
    this.actionLabel,
    this.onAction,
  });

  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(36),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(fontFamily: 'Outfit', color: AmenColors.muted, fontSize: 14),
            ),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 16),
              FilledButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}

class AmenErrorBox extends StatelessWidget {
  const AmenErrorBox({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF5F5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFECACA)),
      ),
      child: Column(
        children: [
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(fontFamily: 'Outfit', color: AmenColors.danger, fontSize: 13),
          ),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: onRetry, child: const Text('Réessayer')),
        ],
      ),
    );
  }
}

// Compat
class AmenActionCard extends AmenRow {
  AmenActionCard({
    super.key,
    required IconData icon,
    required super.title,
    required super.subtitle,
    required super.onTap,
  }) : super(leading: Icon(icon, color: AmenColors.primary, size: 22));
}

class AmenStatTile extends AmenMetric {
  const AmenStatTile({
    super.key,
    required super.label,
    required super.value,
    super.onTap,
  });
}

class AmenHeroHeader extends StatelessWidget {
  const AmenHeroHeader({
    super.key,
    required this.title,
    required this.subtitle,
    this.trailing,
  });

  final String title;
  final String subtitle;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return AmenPageHeader(
      eyebrow: 'AMEN',
      title: title,
      subtitle: subtitle,
      trailing: trailing,
    );
  }
}
