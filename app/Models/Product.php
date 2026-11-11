<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'details',
        'category',
        'unit',
        'unit_price',
        'is_tax_exempt',
        'image_url',
        'track_inventory',
        'stock',
        'min_stock',
        'technical_specs',
        'is_active',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'is_tax_exempt' => 'boolean',
        'track_inventory' => 'boolean',
        'stock' => 'decimal:2',
        'min_stock' => 'decimal:2',
        'technical_specs' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Renglones de facturas/cotizaciones vinculados a este producto.
     */
    public function invoiceItems(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}

