<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        return response()->json($request->user()->projects()->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'genre' => 'required|string|max:100',
            'summary' => 'nullable|string',
        ]);

        $project = $request->user()->projects()->create([
            'title' => $data['title'],
            'genre' => $data['genre'],
            'summary' => $data['summary'] ?? null,
            'status' => 'draft',
        ]);

        return response()->json($project, 201);
    }

    public function show(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        return response()->json($project->load(['characters', 'screenplay']));
    }

    public function update(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'genre' => 'sometimes|string|max:100',
            'status' => 'sometimes|string|in:draft,in-progress,review,complete',
            'summary' => 'nullable|string',
        ]);

        $project->update($data);

        return response()->json($project);
    }

    public function destroy(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }

    public function continuityCheck(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        return response()->json([
            'issues' => [
                [
                    'type' => 'resurrection',
                    'severity' => 'critical',
                    'description' => 'Character appears alive after fatal injury in scene 12.',
                    'suggestion' => 'Review scenes 12–15 for consistency.',
                ],
            ],
        ]);
    }

    public function storyAnalysis(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        return response()->json([
            'score' => 68,
            'pacing' => 'balanced',
            'recommendations' => [
                'Increase conflict escalation in Act II.',
                'Add stronger emotional stakes to the midpoint.',
            ],
        ]);
    }
}
