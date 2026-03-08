import 'package:flutter/material.dart';

/// Generic paginated list view that calls [onLoadMore] when the user
/// scrolls near the bottom.
///
/// Works with any data type [T]. The caller supplies the item builder,
/// current items list, and loading / hasMore flags.
///
/// ```dart
/// PaginatedListView<Student>(
///   items: students,
///   isLoading: isLoading,
///   hasMore: hasNextPage,
///   onLoadMore: () => bloc.add(LoadMoreStudents()),
///   itemBuilder: (ctx, student) => StudentTile(student),
///   emptyWidget: Text('Aucun élève'),
/// )
/// ```
class PaginatedListView<T> extends StatefulWidget {
  /// The current list of items to display.
  final List<T> items;

  /// Whether a page is currently being fetched.
  final bool isLoading;

  /// Whether there are more pages after the current one.
  final bool hasMore;

  /// Called when the user scrolls near the end.
  final VoidCallback onLoadMore;

  /// Builds each item widget.
  final Widget Function(BuildContext context, T item) itemBuilder;

  /// Shown when [items] is empty and [isLoading] is false.
  final Widget? emptyWidget;

  /// Optional header widget above the list.
  final Widget? header;

  /// Optional separator between items.
  final Widget? separator;

  /// Scroll threshold in pixels from the bottom to trigger [onLoadMore].
  final double loadMoreThreshold;

  /// Optional padding around the list.
  final EdgeInsetsGeometry? padding;

  const PaginatedListView({
    super.key,
    required this.items,
    required this.isLoading,
    required this.hasMore,
    required this.onLoadMore,
    required this.itemBuilder,
    this.emptyWidget,
    this.header,
    this.separator,
    this.loadMoreThreshold = 200,
    this.padding,
  });

  @override
  State<PaginatedListView<T>> createState() => _PaginatedListViewState<T>();
}

class _PaginatedListViewState<T> extends State<PaginatedListView<T>> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!widget.hasMore || widget.isLoading) return;

    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.offset;

    if (maxScroll - currentScroll <= widget.loadMoreThreshold) {
      widget.onLoadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.items.isEmpty && !widget.isLoading) {
      return widget.emptyWidget ?? const Center(child: Text('Aucun élément'));
    }

    final itemCount =
        widget.items.length +
        (widget.header != null ? 1 : 0) +
        (widget.hasMore || widget.isLoading ? 1 : 0);

    return ListView.separated(
      controller: _scrollController,
      padding: widget.padding ?? const EdgeInsets.symmetric(vertical: 8),
      itemCount: itemCount,
      separatorBuilder: (_, _) => widget.separator ?? const SizedBox(height: 0),
      itemBuilder: (context, index) {
        // Header slot
        if (widget.header != null && index == 0) {
          return widget.header!;
        }

        final dataIndex = index - (widget.header != null ? 1 : 0);

        // Loading indicator at the bottom
        if (dataIndex >= widget.items.length) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: CircularProgressIndicator()),
          );
        }

        return widget.itemBuilder(context, widget.items[dataIndex]);
      },
    );
  }
}
