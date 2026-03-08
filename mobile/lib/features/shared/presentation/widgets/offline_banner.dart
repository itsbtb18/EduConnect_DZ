import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/network/connectivity_cubit.dart';

/// Persistent banner displayed at the top of the app when offline.
///
/// Wrap the main content of each scaffold (or the whole app body) with this
/// widget so the banner appears above everything else.
class OfflineBanner extends StatelessWidget {
  final Widget child;

  const OfflineBanner({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<ConnectivityCubit, ConnectivityState>(
      builder: (context, state) {
        return Column(
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              height: state.isOnline ? 0 : _bannerHeight(context),
              child: state.isOnline
                  ? const SizedBox.shrink()
                  : _banner(context, state),
            ),
            Expanded(child: child),
          ],
        );
      },
    );
  }

  double _bannerHeight(BuildContext context) {
    // Account for safe area on iOS notch devices.
    final top = MediaQuery.of(context).padding.top;
    return 36 +
        (top > 0 ? 0 : 0); // fixed height; safe area handled by Scaffold
  }

  Widget _banner(BuildContext context, ConnectivityState state) {
    final syncLabel = state.pendingSyncCount > 0
        ? ' · ${state.pendingSyncCount} en attente'
        : '';

    return Material(
      color: Colors.orange.shade800,
      child: SafeArea(
        bottom: false,
        child: SizedBox(
          height: 36,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('📵', style: TextStyle(fontSize: 14)),
              const SizedBox(width: 6),
              Text(
                'Mode hors ligne$syncLabel',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
