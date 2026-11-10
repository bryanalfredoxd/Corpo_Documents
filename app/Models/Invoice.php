<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'client_id',
        'user_id',
        'document_type',
        'document_subtitle',
        'correlative_number',
        'control_number',
        'order_number',
        'issue_date',
        'due_date',
        'offer_validity_days',
        'sale_condition',
        'sales_channel',
        'bcv_exchange_rate',
        'show_bs_conversion',
        'currency',
        'payment_method',
        'payment_reference',
        'subtotal',
        'shipping_cost',
        'discount',
        'tax_percentage',
        'tax_amount',
        'total_usd',
        'total_ves',
        'delivery_address',
        'payment_terms_notes',
        'shipping_terms_notes',
        'terms_conditions',
        'technical_specs',
        'status',
        'pdf_path',
    ];

    protected $casts = [
        'issue_date' => 'datetime',
        'due_date' => 'date',
        'offer_validity_days' => 'integer',
        'bcv_exchange_rate' => 'decimal:4',
        'show_bs_conversion' => 'boolean',
        'subtotal' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'discount' => 'decimal:2',
        'tax_percentage' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'total_usd' => 'decimal:2',
        'total_ves' => 'decimal:2',
        'technical_specs' => 'array',
    ];

    /**
     * Empresa emisora (con su logo e identificación fiscal).
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Cliente o adquiriente al que va dirigido el documento.
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    /**
     * Usuario que emitió o registró la factura.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Renglones / Ítems de la factura.
     */
    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class)->orderBy('item_order');
    }
}

