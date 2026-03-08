import 'package:flutter/material.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/canteen_model.dart';
import '../../data/repositories/canteen_repository.dart';

/// Canteen menus — view weekly/monthly meals, allergens, dietary info.
class CanteenScreen extends StatefulWidget {
  const CanteenScreen({super.key});

  @override
  State<CanteenScreen> createState() => _CanteenScreenState();
}

class _CanteenScreenState extends State<CanteenScreen> {
  List<CanteenMenu> _menus = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final menus = await getIt<CanteenRepository>().getPublishedMenus();
      setState(() {
        _menus = menus;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Cantine')),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _load, child: const Text('Réessayer')),
          ],
        ),
      );
    }
    if (_menus.isEmpty) {
      return const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.restaurant_menu, size: 64, color: Colors.grey),
            SizedBox(height: 12),
            Text('Aucun menu publié'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _menus.length,
        itemBuilder: (_, i) => _menuCard(_menus[i]),
      ),
    );
  }

  Widget _menuCard(CanteenMenu menu) {
    final period = switch (menu.periodType) {
      'WEEKLY' => 'Semaine',
      'MONTHLY' => 'Mois',
      'TRIMESTER' => 'Trimestre',
      _ => menu.periodType,
    };
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
      child: ExpansionTile(
        leading: const Icon(Icons.restaurant, color: Colors.deepOrange),
        title: Text(
          menu.title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(
          '$period : ${_fmt(menu.startDate)} — ${_fmt(menu.endDate)}',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        children: [
          if (menu.notes != null && menu.notes!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text(
                menu.notes!,
                style: const TextStyle(
                  fontSize: 12,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
          ...menu.items.map(_mealTile),
        ],
      ),
    );
  }

  Widget _mealTile(CanteenMenuItem item) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Day header
          Row(
            children: [
              Icon(Icons.calendar_today, size: 14, color: Colors.blue.shade700),
              const SizedBox(width: 6),
              Text(
                item.date != null
                    ? '${item.dayLabel} ${_fmt(item.date!)}'
                    : item.dayLabel,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              if (item.caloriesApprox != null) ...[
                const Spacer(),
                Text(
                  '${item.caloriesApprox} kcal',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),

          // Meals
          if (item.starter != null) _mealRow('🥗 Entrée', item.starter!),
          if (item.mainCourse != null)
            _mealRow('🍖 Plat principal', item.mainCourse!),
          if (item.sideDish != null)
            _mealRow('🥕 Accompagnement', item.sideDish!),
          if (item.dessert != null) _mealRow('🍰 Dessert', item.dessert!),

          // Dietary info
          if (item.allergens != null && item.allergens!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber, size: 14, color: Colors.red),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      'Allergènes : ${item.allergens}',
                      style: const TextStyle(fontSize: 11, color: Colors.red),
                    ),
                  ),
                ],
              ),
            ),
          if (item.suitableForDiabetic || item.suitableForCeliac)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Wrap(
                spacing: 8,
                children: [
                  if (item.suitableForDiabetic)
                    _dietChip('Diabétique ✓', Colors.teal),
                  if (item.suitableForCeliac)
                    _dietChip('Cœliaque ✓', Colors.purple),
                ],
              ),
            ),

          const Divider(),
        ],
      ),
    );
  }

  Widget _mealRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 130,
            child: Text(label, style: const TextStyle(fontSize: 12)),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _dietChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(label, style: TextStyle(fontSize: 10, color: color)),
    );
  }

  String _fmt(DateTime d) => '${d.day}/${d.month}/${d.year}';
}
