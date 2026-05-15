<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScreenplayVersion extends Model
{
    protected $fillable = ['screenplay_id', 'version', 'blocks', 'label'];

    protected $casts = ['blocks' => 'array'];

    public function screenplay(): BelongsTo
    {
        return $this->belongsTo(Screenplay::class);
    }
}
