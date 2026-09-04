import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../auth/bloc/auth_bloc.dart';
import '../../theme/cubit/theme_cubit.dart';
import '../../../core/services/backup_service.dart';
import 'package:file_picker/file_picker.dart';

/// Profile Page — Stats, settings, theme, backup, account management
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // ── Profile Header ─────────────────────────
          SliverToBoxAdapter(
            child: BlocBuilder<AuthBloc, AuthState>(
              builder: (context, state) {
                final name = state is AuthAuthenticated
                    ? (state.displayName ?? state.email.split('@').first)
                    : 'Guest User';
                final email = state is AuthAuthenticated
                    ? state.email
                    : 'Sign in to sync your progress';
                final isGuest = state is! AuthAuthenticated;

                final isDark = Theme.of(context).brightness == Brightness.dark;
                return Container(
                  decoration: BoxDecoration(
                    gradient: isDark
                        ? AppColors.gradientPrimary
                        : AppColors.gradientPrimaryLight,
                  ),
                  padding: EdgeInsets.fromLTRB(
                    AppTheme.spaceLg,
                    MediaQuery.of(context).padding.top + AppTheme.spaceLg,
                    AppTheme.spaceLg,
                    AppTheme.spaceXl,
                  ),
                  child: Column(
                    children: [
                      // Avatar
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: Colors.white.withValues(alpha: 0.4),
                              width: 2),
                        ),
                        child: Center(
                          child: Text(
                            name.isNotEmpty ? name[0].toUpperCase() : 'G',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 36,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: AppTheme.spaceMd),
                      Text(name,
                          style: AppTypography.headline
                              .copyWith(color: Colors.white)),
                      const SizedBox(height: 4),
                      Text(email,
                          style: AppTypography.bodyMedium.copyWith(
                              color: Colors.white.withValues(alpha: 0.75))),
                      if (isGuest) ...[
                        const SizedBox(height: AppTheme.spaceMd),
                        ElevatedButton(
                          onPressed: () => context.go('/login'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.accent,
                          ),
                          child: const Text('Sign In / Sign Up'),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),

          // ── Stats Row ──────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(AppTheme.spaceMd),
              padding: const EdgeInsets.symmetric(
                  vertical: AppTheme.spaceMd),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(AppTheme.radiusLg),
                border:
                    Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Row(
                children: [
                  _StatItem(label: 'Books Read', value: '12'),
                  _VerticalDivider(),
                  _StatItem(label: 'Study Hours', value: '48'),
                  _VerticalDivider(),
                  _StatItem(label: 'Quiz Score', value: '87%'),
                ],
              ),
            ),
          ),

          // ── Settings ───────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppTheme.spaceMd),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _SectionLabel('Appearance'),
                  Card(
                    child: BlocBuilder<ThemeCubit, ThemeMode>(
                      builder: (context, themeMode) => Column(
                        children: [
                          _ThemeOption(
                            label: 'System Default',
                            icon: Icons.brightness_auto_rounded,
                            selected: themeMode == ThemeMode.system,
                            onTap: () => context
                                .read<ThemeCubit>()
                                .setTheme(ThemeMode.system),
                          ),
                          const Divider(height: 1),
                          _ThemeOption(
                            label: 'Light Mode',
                            icon: Icons.light_mode_rounded,
                            selected: themeMode == ThemeMode.light,
                            onTap: () => context
                                .read<ThemeCubit>()
                                .setTheme(ThemeMode.light),
                          ),
                          const Divider(height: 1),
                          _ThemeOption(
                            label: 'Dark Mode',
                            icon: Icons.dark_mode_rounded,
                            selected: themeMode == ThemeMode.dark,
                            onTap: () => context
                                .read<ThemeCubit>()
                                .setTheme(ThemeMode.dark),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppTheme.spaceMd),
                  _SectionLabel('Data & Backup'),
                  Card(
                    child: Column(
                      children: [
                        _SettingsTile(
                          icon: Icons.upload_file_rounded,
                          title: 'Export Data',
                          subtitle: 'Save your progress to a local file',
                          onTap: () async {
                            final path = await BackupService.instance.exportData();
                            if (path != null && context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exported to: $path')));
                            } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to export data')));
                            }
                          },
                        ),
                        const Divider(height: 1),
                        _SettingsTile(
                          icon: Icons.file_download_rounded,
                          title: 'Import Data',
                          subtitle: 'Restore from a local backup file',
                          onTap: () async {
                            final result = await FilePicker.platform.pickFiles(
                              type: FileType.custom,
                              allowedExtensions: ['json'],
                            );
                            if (result != null && result.files.single.path != null) {
                              final success = await BackupService.instance.importData(result.files.single.path!);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(success ? 'Import successful!' : 'Import failed')));
                              }
                            }
                          },
                        ),
                        const Divider(height: 1),
                        _SettingsTile(
                          icon: Icons.delete_outline_rounded,
                          title: 'Clear Cache',
                          subtitle: 'Free up storage space',
                          onTap: () {},
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppTheme.spaceMd),
                  _SectionLabel('About'),
                  Card(
                    child: Column(
                      children: [
                        _SettingsTile(
                          icon: Icons.info_outline_rounded,
                          title: 'App Version',
                          subtitle: '1.0.0 (build 1)',
                          onTap: null,
                          trailing: const SizedBox.shrink(),
                        ),
                        const Divider(height: 1),
                        _SettingsTile(
                          icon: Icons.privacy_tip_outlined,
                          title: 'Privacy Policy',
                          onTap: () {},
                        ),
                        const Divider(height: 1),
                        _SettingsTile(
                          icon: Icons.description_outlined,
                          title: 'Terms of Service',
                          onTap: () {},
                        ),
                        const Divider(height: 1),
                        _SettingsTile(
                          icon: Icons.star_outline_rounded,
                          title: 'Rate the App',
                          onTap: () {},
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppTheme.spaceMd),
                  // Sign out
                  BlocBuilder<AuthBloc, AuthState>(
                    builder: (context, state) {
                      if (state is! AuthAuthenticated) {
                        return const SizedBox.shrink();
                      }
                      return Column(
                        children: [
                          _SectionLabel('Account'),
                          Card(
                            child: Column(
                              children: [
                                _SettingsTile(
                                  icon: Icons.logout_rounded,
                                  title: 'Sign Out',
                                  titleColor: AppColors.error,
                                  iconColor: AppColors.error,
                                  onTap: () {
                                    context
                                        .read<AuthBloc>()
                                        .add(const AuthLogoutRequested());
                                    context.go('/login');
                                  },
                                ),
                                const Divider(height: 1),
                                _SettingsTile(
                                  icon: Icons.delete_forever_rounded,
                                  title: 'Delete Account',
                                  titleColor: AppColors.error,
                                  iconColor: AppColors.error,
                                  onTap: () => _showDeleteDialog(context),
                                ),
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: AppTheme.space2Xl),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
            'This will permanently delete your account and all your data. This cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              context.go('/login');
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  const _StatItem({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(value,
              style: AppTypography.headline
                  .copyWith(color: AppColors.accent)),
          const SizedBox(height: 2),
          Text(label,
              style: AppTypography.bodySmall.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.5),
              )),
        ],
      ),
    );
  }
}

class _VerticalDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 40, color: Theme.of(context).dividerColor);
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
          left: 4, bottom: AppTheme.spaceXs, top: AppTheme.spaceXs),
      child: Text(
        text.toUpperCase(),
        style: AppTypography.labelSmall.copyWith(
          color: Theme.of(context)
              .colorScheme
              .onSurface
              .withValues(alpha: 0.4),
          letterSpacing: 1.2,
        ),
      ),
    );
  }
}

class _ThemeOption extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _ThemeOption({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon,
          color: selected ? AppColors.accent : null),
      title: Text(label,
          style: AppTypography.bodyMedium.copyWith(
            color: selected ? AppColors.accent : null,
            fontWeight: selected ? FontWeight.w600 : null,
          )),
      trailing: selected
          ? const Icon(Icons.check_circle_rounded,
              color: AppColors.accent, size: 20)
          : null,
      onTap: onTap,
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback? onTap;
  final Color? titleColor;
  final Color? iconColor;
  final Widget? trailing;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
    this.titleColor,
    this.iconColor,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor),
      title: Text(title,
          style: AppTypography.bodyMedium
              .copyWith(color: titleColor)),
      subtitle: subtitle != null
          ? Text(subtitle!,
              style: AppTypography.bodySmall.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withValues(alpha: 0.5),
              ))
          : null,
      trailing: trailing ?? const Icon(Icons.chevron_right_rounded),
      onTap: onTap,
    );
  }
}
