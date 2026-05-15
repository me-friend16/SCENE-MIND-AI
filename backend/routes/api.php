<?php

use App\Http\Controllers\AIController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CharacterController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ScreenplayController;
use Illuminate\Support\Facades\Route;

// ── Auth (public) ─────────────────────────────────────────────────────────────
Route::post('register', [AuthController::class, 'register']);
Route::post('login', [AuthController::class, 'login']);
Route::post('password-reset', [AuthController::class, 'requestPasswordReset']);
Route::post('password-update', [AuthController::class, 'resetPassword']);

// ── Protected ─────────────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('logout', [AuthController::class, 'logout']);

    // Projects
    Route::apiResource('projects', ProjectController::class)->only(['index', 'store', 'show', 'update', 'destroy']);

    // Screenplay (one per project, lazily created)
    Route::get('projects/{project}/screenplay', [ScreenplayController::class, 'show']);
    Route::patch('screenplays/{screenplay}', [ScreenplayController::class, 'update']);

    // Characters
    Route::get('projects/{project}/characters', [CharacterController::class, 'index']);
    Route::post('projects/{project}/characters', [CharacterController::class, 'store']);
    Route::patch('projects/{project}/characters/{character}', [CharacterController::class, 'update']);
    Route::delete('projects/{project}/characters/{character}', [CharacterController::class, 'destroy']);

    // AI (proxy to FastAPI)
    Route::prefix('ai')->group(function () {
        Route::post('generate-scene', [AIController::class, 'generateScene']);
        Route::post('generate-dialogue', [AIController::class, 'generateDialogue']);
        Route::post('rewrite-scene', [AIController::class, 'rewriteScene']);
        Route::post('check-continuity', [AIController::class, 'checkContinuity']);
        Route::post('analyze-story', [AIController::class, 'analyzeStory']);
        Route::post('character-profile', [AIController::class, 'characterProfile']);
    });

    // Legacy continuity check on project
    Route::post('projects/{project}/continuity-check', [ProjectController::class, 'continuityCheck']);
    Route::get('projects/{project}/story-analysis', [ProjectController::class, 'storyAnalysis']);
});
