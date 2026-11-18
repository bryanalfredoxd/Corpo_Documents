<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsignmentMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'consignment_id',
        'movement_type',
        'quantity',
        'previous_quantity',
        'new_quantity',
        'unit_price',
        'suggested_price',
        'invoice_id',
        'user_id',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'previous_quantity' => 'decimal:2',
        'new_quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'suggested_price' => 'decimal:2',
    ];

    public function consignment(): BelongsTo
    {
        return $this->belongsTo(Consignment::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getResultingBalanceAttribute(): float
    {
        return (float) ($this->new_quantity ?? 0);
    }
}

