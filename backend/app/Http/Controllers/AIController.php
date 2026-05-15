<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AIController extends Controller
{
    private string $aiBase;

    public function __construct()
    {
        $this->aiBase = config('services.ai.url', 'http://localhost:8001');
    }

    public function generateScene(Request $request)
    {
        $payload = $request->validate([
            'project_id' => 'required|string',
            'prompt' => 'required|string|max:2000',
            'genre' => 'nullable|string',
            'scene_text' => 'nullable|string',
            'mode' => 'nullable|string|in:generate,continue,rewrite,dialogue',
        ]);

        return $this->proxy('/api/generate-scene', $payload);
    }

    public function generateDialogue(Request $request)
    {
        $payload = $request->validate([
            'project_id' => 'required|string',
            'prompt' => 'required|string|max:2000',
            'scene_text' => 'nullable|string',
            'genre' => 'nullable|string',
        ]);

        return $this->proxy('/api/generate-dialogue', $payload);
    }

    public function rewriteScene(Request $request)
    {
        $payload = $request->validate([
            'project_id' => 'required|string',
            'prompt' => 'required|string|max:2000',
            'scene_text' => 'required|string',
            'genre' => 'nullable|string',
        ]);

        return $this->proxy('/api/rewrite-scene', $payload);
    }

    public function checkContinuity(Request $request)
    {
        $payload = $request->validate([
            'project_id' => 'required|string',
            'screenplay_text' => 'required|string',
            'characters' => 'required|array',
            'characters.*' => 'string',
        ]);

        return $this->proxy('/api/continuity-check', $payload);
    }

    public function analyzeStory(Request $request)
    {
        $payload = $request->validate([
            'project_id' => 'required|string',
            'screenplay_text' => 'required|string',
        ]);

        return $this->proxy('/api/story-analysis', $payload);
    }

    private function proxy(string $path, array $payload)
    {
        $response = Http::timeout(60)->post($this->aiBase . $path, $payload);

        return response()->json($response->json(), $response->status());
    }
}
