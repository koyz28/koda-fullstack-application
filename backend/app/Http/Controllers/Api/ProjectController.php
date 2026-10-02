<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\ListProjectsRequest;
use App\Http\Requests\Projects\SaveProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

class ProjectController extends Controller
{
    public function index(ListProjectsRequest $request): AnonymousResourceCollection
    {
        $projects = $request->user()
            ->projects()
            ->search($request->string('search')->toString())
            ->withStatus($request->status())
            ->withPriority($request->priority())
            ->sortBy($request->string('sort')->toString())
            ->paginate($request->perPage())
            ->withQueryString();

        return ProjectResource::collection($projects);
    }

    public function store(SaveProjectRequest $request): JsonResponse
    {
        $project = $request->user()->projects()->create($request->validated());

        return ProjectResource::make($project->refresh())
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function show(Project $project): ProjectResource
    {
        Gate::authorize('view', $project);

        return ProjectResource::make($project);
    }

    public function update(SaveProjectRequest $request, Project $project): ProjectResource
    {
        Gate::authorize('update', $project);

        $project->update($request->validated());

        return ProjectResource::make($project);
    }

    public function destroy(Project $project): Response
    {
        Gate::authorize('delete', $project);

        $project->delete();

        return response()->noContent();
    }
}
