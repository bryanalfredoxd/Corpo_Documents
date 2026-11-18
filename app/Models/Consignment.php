<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Consignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'client_id',
        'product_id',
        'description',
        'unit',
        'current_quantity',
        'unit_price',
        'suggested_price',
        'initial_delivery_invoice_id',
        'status',
        'notes',
    ];

    protected $casts = [
        'current_quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'suggested_price' => 'decimal:2',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function initialDeliveryInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'initial_delivery_invoice_id');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(ConsignmentMovement::class)->latest('id');
    }
}
