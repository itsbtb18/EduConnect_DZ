import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../parent/data/models/canteen_model.dart';
import '../../../parent/data/repositories/canteen_repository.dart';

/// Student canteen menu screen — weekly menu display.
class StudentCanteenScreen extends StatefulWidget {
  const StudentCanteenScreen({super.key});

  @override
  State<StudentCanteenScreen> createState() => _StudentCanteenScreenState();
}

class _StudentCanteenScreenState extends State<StudentCanteenScreen> {
  bool _loading = true;
  String? _error;
  List<CanteenMenu> _menus = [];

  @override
  void initState() {
    super.initState();
    _loadMenus();
  }

  Future<void> _loadMenus() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _menus = await getIt<CanteenRepository>().getPublishedMenus();
    } catch (e) {
      _error = e.toString();
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cantine 🍽️'), centerTitle: true),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _buildError()
          : _menus.isEmpty
          ? _buildEmpty()
          : _buildMenus(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: AppColors.error),
          const SizedBox(height: 12),
          Text(_error!, style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _loadMenus,
            icon: const Icon(Icons.refresh),
            label: const Text('Réessayer'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('🍽️', style: TextStyle(fontSize: 48)),
          SizedBox(height: 12),
          Text(
            'Aucun menu publié',
            style: TextStyle(fontSize: 16, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildMenus() {
    return RefreshIndicator(
      onRefresh: _loadMenus,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _menus.length,
        itemBuilder: (context, index) {
          final menu = _menus[index];
          return _MenuCard(menu: menu);
        },
      ),
    );
  }
}

class _MenuCard extends StatelessWidget {
  final CanteenMenu menu;
  const _MenuCard({required this.menu});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('📋', style: TextStyle(fontSize: 20)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    menu.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    menu.periodType,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (menu.items.isEmpty)
              const Text(
                'Pas de détails disponibles',
                style: TextStyle(color: AppColors.textHint),
              )
            else
              ...menu.items.map((item) => _MealRow(item: item)),
            if (menu.notes != null && menu.notes!.isNotEmpty) ...[
              const Divider(height: 20),
              Row(
                children: [
                  const Icon(
                    Icons.info_outline,
                    size: 14,
                    color: AppColors.textHint,
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      menu.notes!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textHint,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _MealRow extends StatelessWidget {
  final CanteenMenuItem item;
  const _MealRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 56,
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Text(
              item.dayLabel,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 12,
                color: AppColors.primary,
              ),
            ),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item.starter != null) _mealLine('🥗', item.starter!),
                if (item.mainCourse != null) _mealLine('🍖', item.mainCourse!),
                if (item.sideDish != null) _mealLine('🥘', item.sideDish!),
                if (item.dessert != null) _mealLine('🍨', item.dessert!),
              ],
            ),
          ),
          if (item.suitableForDiabetic || item.suitableForCeliac)
            Column(
              children: [
                if (item.suitableForDiabetic)
                  const Tooltip(
                    message: 'Convient aux diabétiques',
                    child: Text('💉', style: TextStyle(fontSize: 14)),
                  ),
                if (item.suitableForCeliac)
                  const Tooltip(
                    message: 'Sans gluten',
                    child: Text('🌾', style: TextStyle(fontSize: 14)),
                  ),
              ],
            ),
        ],
      ),
    );
  }

  Widget _mealLine(String emoji, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 12)),
          const SizedBox(width: 4),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 13))),
        ],
      ),
    );
  }
}
