<?php

namespace App\Http\Controllers;

use App\Models\Character;
use App\Models\Project;
use Illuminate\Http\Request;

class CharacterController extends Controller
{
    public function index(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        return response()->json([
            'characters' => $project->characters()->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $character = $project->characters()->create($data);

        return response()->json(['character' => $character], 201);
    }

    public function update(Request $request, Project $project, Character $character)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'ai_memory' => 'nullable|array',
        ]);

        $character->update($data);

        return response()->json(['character' => $character]);
    }

    public function destroy(Request $request, Project $project, Character $character)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        $character->delete();

        return response()->json(['message' => 'Deleted.']);
    }
}
