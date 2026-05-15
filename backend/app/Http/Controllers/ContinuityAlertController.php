<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ContinuityAlertController extends Controller
{
    public function index(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        return response()->json([
            'alerts' => $project->continuityAlerts()
                ->where('resolved', false)
                ->orderByDesc('created_at')
                ->get(),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        $data = $request->validate([
            'issues' => 'required|array',
            'issues.*.type' => 'required|string',
            'issues.*.severity' => 'required|string|in:critical,high,medium,low',
            'issues.*.description' => 'required|string',
            'issues.*.suggestion' => 'nullable|string',
            'issues.*.scene_ref' => 'nullable|string',
        ]);

        // Replace existing unresolved alerts
        $project->continuityAlerts()->where('resolved', false)->delete();

        $alerts = collect($data['issues'])->map(fn($issue) =>
            $project->continuityAlerts()->create([
                'type' => $issue['type'],
                'severity' => $issue['severity'],
                'description' => $issue['description'],
                'suggestion' => $issue['suggestion'] ?? null,
                'scene_ref' => $issue['scene_ref'] ?? null,
            ])
        );

        return response()->json(['alerts' => $alerts]);
    }

    public function resolve(Request $request, Project $project, int $alert)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        $record = $project->continuityAlerts()->findOrFail($alert);
        $record->update(['resolved' => true]);

        return response()->json(['message' => 'Resolved.']);
    }
}
