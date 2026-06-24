<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    public $timestamps = true;

    const CREATED_AT = 'created_at';
    const UPDATED_AT = null;
    protected $fillable = [
        'user_id',
        'titre',
        'message',
        'type',
        'data',
        'canal',
        'lu',
        'lu_at',
    ];

    protected $casts = [
        'data' => 'array',
        'lu' => 'boolean',
        'lu_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
