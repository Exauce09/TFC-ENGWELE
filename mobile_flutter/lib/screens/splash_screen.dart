import 'package:flutter/material.dart';

import '../theme/amen_theme.dart';
import '../widgets/amen_ui.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late final AnimationController _c;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          Image.asset(
            'assets/images/login-hospital.jpg',
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: AmenColors.primaryDeep),
          ),
          Container(color: AmenColors.primaryDeep.withValues(alpha: 0.72)),
          FadeTransition(
            opacity: CurvedAnimation(parent: _c, curve: Curves.easeOut),
            child: const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AmenBrandMark(light: true, size: 52),
                  SizedBox(height: 12),
                  Text(
                    AmenBrand.name,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontFamily: 'Fraunces',
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 28),
                  SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
