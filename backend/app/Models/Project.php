<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'genre',
        'status',
        'summary',
        'user_id',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function screenplay(): HasOne
    {
        return $this->hasOne(Screenplay::class);
    }

    public function characters(): HasMany
    {
        return $this->hasMany(Character::class);
    }

    public function continuityAlerts(): HasMany
    {
        return $this->hasMany(ContinuityAlert::class);
    }
}
