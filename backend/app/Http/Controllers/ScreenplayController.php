<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Screenplay;
use Illuminate\Http\Request;

class ScreenplayController extends Controller
{
    /**
     * Get (or lazily create) the screenplay for a project.
     */
    public function show(Request $request, Project $project)
    {
        abort_if($request->user()->id !== $project->user_id, 403);

        $screenplay = $project->screenplay ?? Screenplay::create([
            'project_id' => $project->id,
            'title' => $project->title,
            'blocks' => [],
        ]);

        return response()->json(['screenplay' => $screenplay]);
    }

    /**
     * Save blocks array.
     */
    public function update(Request $request, Screenplay $screenplay)
    {
        abort_if($request->user()->id !== $screenplay->project->user_id, 403);

        $data = $request->validate([
            'blocks' => 'required|array',
            'blocks.*.id' => 'required|string',
            'blocks.*.type' => 'required|string|in:scene-heading,action,character,dialogue,parenthetical,transition',
            'blocks.*.content' => 'required|string',
            'blocks.*.position' => 'required|integer|min:0',
        ]);

        $screenplay->update([
            'blocks' => $data['blocks'],
            'version' => $screenplay->version + 1,
        ]);

        return response()->json(['screenplay' => $screenplay]);
    }
}
