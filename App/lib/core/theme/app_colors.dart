import 'package:flutter/material.dart';

/// TF Study Shelf Design System — Colors
/// Based on PRD 05: UI/UX Requirements
class AppColors {
  AppColors._();

  // ─── Brand Colors ─────────────────────────────
  static const Color primaryDark = Color(0xFF212121);
  static const Color accent = Color(0xFFFF7759);
  static const Color offWhite = Color(0xFFFAFAFA);

  // ─── Light Theme ──────────────────────────────
  static const Color lightBackground = Color(0xFFFAFAFA);
  static const Color lightSurface = Color(0xFFFFFFFF);
  static const Color lightElevated = Color(0x0A212121);
  static const Color lightTextPrimary = Color(0xFF212121);
  static const Color lightTextSecondary = Color(0x99212121);
  static const Color lightTextTertiary = Color(0x61212121);
  static const Color lightBorder = Color(0x1F212121);
  static const Color lightInputBg = Color(0x0A212121);
  static const Color lightInputPlaceholder = Color(0x66212121);

  // ─── Dark Theme ───────────────────────────────
  static const Color darkBackground = Color(0xFF212121);
  static const Color darkSurface = Color(0xFF2A2A2A);
  static const Color darkElevated = Color(0x0FFAFAFA);
  static const Color darkTextPrimary = Color(0xFFFAFAFA);
  static const Color darkTextSecondary = Color(0x99FAFAFA);
  static const Color darkTextTertiary = Color(0x61FAFAFA);
  static const Color darkBorder = Color(0x1FFAFAFA);
  static const Color darkInputBg = Color(0x14FAFAFA);
  static const Color darkInputPlaceholder = Color(0x66FAFAFA);

  // ─── Semantic Colors ──────────────────────────
  static const Color success = Color(0xFF28A745);
  static const Color error = Color(0xFFDC3545);
  static const Color warning = Color(0xFFFFC107);
  static const Color info = Color(0xFF17A2B8);

  // ─── Accent Variants ──────────────────────────
  static const Color accentHover = Color(0xD9FF7759);
  static const Color accentPressed = Color(0xB3FF7759);
  static const Color accentSubtle = Color(0x1AFF7759);

  // ─── Gradients ────────────────────────────────
  static const LinearGradient gradientPrimary = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accent, primaryDark],
  );

  static const LinearGradient gradientAccentSoft = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0x26FF7759), Color(0x0D212121)],
  );

  /// Lighter gradient for light mode headers
  static const LinearGradient gradientPrimaryLight = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xD9FF7759), Color(0xFFFF7759)],
  );
}
