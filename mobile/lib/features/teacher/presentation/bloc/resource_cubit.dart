import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../core/di/injection.dart';
import '../../data/models/resource_model.dart';
import '../../data/repositories/resource_repository.dart';

// ── States ──────────────────────────────────────────────────────────────────

abstract class ResourceState extends Equatable {
  const ResourceState();
  @override
  List<Object?> get props => [];
}

class ResourceInitial extends ResourceState {}

class ResourceLoading extends ResourceState {}

class ResourceLoaded extends ResourceState {
  final List<TeachingResource> resources;
  const ResourceLoaded(this.resources);
  @override
  List<Object?> get props => [resources];
}

class ResourceUploading extends ResourceState {}

class ResourceUploaded extends ResourceState {}

class ResourceError extends ResourceState {
  final String message;
  const ResourceError(this.message);
  @override
  List<Object?> get props => [message];
}

// ── Cubit ───────────────────────────────────────────────────────────────────

class ResourceCubit extends Cubit<ResourceState> {
  final ResourceRepository _repo = getIt<ResourceRepository>();

  ResourceCubit() : super(ResourceInitial());

  Future<void> loadResources({String? subjectId, String? chapter}) async {
    emit(ResourceLoading());
    try {
      final resources = await _repo.getResources(
        subjectId: subjectId,
        chapter: chapter,
      );
      emit(ResourceLoaded(resources));
    } catch (e) {
      emit(ResourceError(e.toString()));
    }
  }

  Future<void> uploadResource({
    required String title,
    String? description,
    required String subjectId,
    String? chapter,
    required String resourceType,
    String? filePath,
    String? externalLink,
  }) async {
    emit(ResourceUploading());
    try {
      await _repo.uploadResource(
        title: title,
        description: description,
        subjectId: subjectId,
        chapter: chapter,
        resourceType: resourceType,
        filePath: filePath,
        externalLink: externalLink,
      );
      emit(ResourceUploaded());
    } catch (e) {
      emit(ResourceError(e.toString()));
    }
  }

  Future<void> deleteResource(String id) async {
    emit(ResourceLoading());
    try {
      await _repo.deleteResource(id);
      // Reload after delete
      final resources = await _repo.getResources();
      emit(ResourceLoaded(resources));
    } catch (e) {
      emit(ResourceError(e.toString()));
    }
  }
}
