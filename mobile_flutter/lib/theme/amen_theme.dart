import 'package:flutter/material.dart';

/// Aligné sur le site web AMEN (login hospitalier).
class AmenColors {
  static const ink = Color(0xFF0D3B3A);
  static const primary = Color(0xFF0D6E6E);
  static const primaryDeep = Color(0xFF062E2C);
  static const primarySoft = Color(0xFF1A7A6D);
  static const wash = Color(0xFFF7FAF9);
  static const paper = Color(0xFFFFFFFF);
  static const muted = Color(0xFF5A7A74);
  static const line = Color(0xFFD7E5E1);
  static const danger = Color(0xFF9B1C1C);
  static const success = Color(0xFF0E7A4C);
  static const warn = Color(0xFF9A6700);
}

class AmenBrand {
  static const name = 'Centre Médical AMEN';
  static const tagline = 'Votre santé, notre priorité';
  static const place = 'Matete · Kinshasa';
}

ThemeData buildAmenTheme() {
  const display = TextStyle(fontFamily: 'Fraunces', color: AmenColors.ink);
  const ui = TextStyle(fontFamily: 'Outfit', color: AmenColors.ink);

  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: AmenColors.wash,
    fontFamily: 'Outfit',
    colorScheme: const ColorScheme.light(
      primary: AmenColors.primary,
      onPrimary: Colors.white,
      secondary: AmenColors.primarySoft,
      surface: AmenColors.paper,
      onSurface: AmenColors.ink,
      error: AmenColors.danger,
    ),
    textTheme: TextTheme(
      displayLarge: display.copyWith(fontSize: 40, fontWeight: FontWeight.w600, height: 1.05),
      displayMedium: display.copyWith(fontSize: 32, fontWeight: FontWeight.w600),
      headlineMedium: display.copyWith(fontSize: 26, fontWeight: FontWeight.w600),
      titleLarge: ui.copyWith(fontSize: 18, fontWeight: FontWeight.w700),
      titleMedium: ui.copyWith(fontSize: 15, fontWeight: FontWeight.w600),
      bodyLarge: ui.copyWith(fontSize: 15, height: 1.4),
      bodyMedium: ui.copyWith(fontSize: 13.5, color: AmenColors.muted, height: 1.4),
      labelLarge: ui.copyWith(fontWeight: FontWeight.w700, fontSize: 14),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: AmenColors.paper,
      foregroundColor: AmenColors.ink,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontFamily: 'Outfit',
        fontSize: 17,
        fontWeight: FontWeight.w700,
        color: AmenColors.ink,
      ),
      iconTheme: IconThemeData(color: AmenColors.ink),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: AmenColors.paper,
      elevation: 0,
      height: 70,
      indicatorColor: AmenColors.primary.withValues(alpha: 0.12),
      labelTextStyle: WidgetStateProperty.resolveWith((s) {
        final sel = s.contains(WidgetState.selected);
        return TextStyle(
          fontFamily: 'Outfit',
          fontSize: 11,
          fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
          color: sel ? AmenColors.primary : AmenColors.muted,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((s) {
        final sel = s.contains(WidgetState.selected);
        return IconThemeData(color: sel ? AmenColors.primary : AmenColors.muted, size: 22);
      }),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: AmenColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        minimumSize: const Size.fromHeight(52),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AmenColors.ink,
        side: const BorderSide(color: AmenColors.line),
        minimumSize: const Size(0, 44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: AmenColors.primary),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AmenColors.paper,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AmenColors.line),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AmenColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AmenColors.primary, width: 1.5),
      ),
      labelStyle: const TextStyle(fontFamily: 'Outfit', color: AmenColors.muted, fontSize: 13),
      hintStyle: const TextStyle(fontFamily: 'Outfit', color: AmenColors.muted, fontSize: 13),
    ),
    tabBarTheme: const TabBarThemeData(
      indicatorColor: AmenColors.primary,
      labelColor: AmenColors.primary,
      unselectedLabelColor: AmenColors.muted,
      labelStyle: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w700, fontSize: 13),
      unselectedLabelStyle: TextStyle(fontFamily: 'Outfit', fontWeight: FontWeight.w500, fontSize: 13),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AmenColors.paper,
      selectedColor: AmenColors.primary.withValues(alpha: 0.12),
      labelStyle: const TextStyle(fontFamily: 'Outfit', fontSize: 12, fontWeight: FontWeight.w600, color: AmenColors.ink),
      side: const BorderSide(color: AmenColors.line),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),
    dividerTheme: const DividerThemeData(color: AmenColors.line, thickness: 1, space: 1),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AmenColors.primary,
      foregroundColor: Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    ),
    snackBarTheme: const SnackBarThemeData(
      backgroundColor: AmenColors.ink,
      contentTextStyle: TextStyle(fontFamily: 'Outfit', color: Colors.white),
      behavior: SnackBarBehavior.floating,
    ),
  );
}
