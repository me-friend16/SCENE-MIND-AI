<?php

namespace App\Http\Controllers;

use App\Models\Screenplay;
use Illuminate\Http\Request;

class ScreenplayVersionController extends Controller
{
    public function index(Request $request, Screenplay $screenplay)
    {
        abort_if($request->user()->id !== $screenplay->project->user_id, 403);

        return response()->json([
            'versions' => $screenplay->versions()->select(['id', 'version', 'label', 'created_at'])->get(),
        ]);
    }

    public function show(Request $request, Screenplay $screenplay, int $version)
    {
        abort_if($request->user()->id !== $screenplay->project->user_id, 403);

        $record = $screenplay->versions()->where('version', $version)->firstOrFail();
        return response()->json(['version' => $record]);
    }

    public function restore(Request $request, Screenplay $screenplay, int $version)
    {
        abort_if($request->user()->id !== $screenplay->project->user_id, 403);

        $record = $screenplay->versions()->where('version', $version)->firstOrFail();

        // Save current state as a new version before restoring
        $screenplay->versions()->create([
            'version' => $screenplay->version + 1,
            'blocks' => $screenplay->blocks,
            'label' => 'Auto-saved before restore',
        ]);

        $screenplay->update([
            'blocks' => $record->blocks,
            'version' => $screenplay->version + 2,
        ]);

        return response()->json(['screenplay' => $screenplay->fresh()]);
    }
}
