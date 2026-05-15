<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContinuityAlert extends Model
{
    protected $fillable = [
        'project_id',
        'type',
        'severity',
        'description',
        'suggestion',
        'scene_ref',
        'resolved',
    ];

    protected $casts = [
        'resolved' => 'boolean',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
