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
        'parent_invoice_id',
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

    protected $appends = [
        'paid_amount_usd',
        'balance_due_usd',
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

    /**
     * Documento origen (ej. Proforma o Cotización) desde el cual se generó esta factura.
     */
    public function parentInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'parent_invoice_id');
    }

    /**
     * Facturas o documentos derivados a partir de esta cotización o proforma.
     */
    public function childInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'parent_invoice_id');
    }

    /**
     * Abonos y pagos parciales registrados contra este documento.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class)->orderByDesc('payment_date')->orderByDesc('id');
    }

    /**
     * Registros de auditoría de quién creó, modificó, cobró o anuló el documento.
     */
    public function auditLogs(): HasMany
    {
        return $this->hasMany(InvoiceAuditLog::class)->orderByDesc('id');
    }

    /**
     * Total abonado en USD hasta la fecha.
     */
    public function getPaidAmountUsdAttribute(): float
    {
        if ($this->relationLoaded('payments')) {
            $sum = round((float) $this->payments->sum('amount_usd'), 2);
            if ($sum > 0) {
                return $sum;
            }
        }

        if ($this->status === 'pagada') {
            return (float) $this->total_usd;
        }

        return 0.0;
    }

    /**
     * Saldo pendiente por cobrar en USD.
     */
    public function getBalanceDueUsdAttribute(): float
    {
        if (in_array($this->status, ['pagada', 'anulada'], true)) {
            return 0.0;
        }

        return max(0.0, round((float) $this->total_usd - $this->paid_amount_usd, 2));
    }

    /**
     * Accesor resiliente para el régimen de conversión a bolívares.
     */
    public function getShowBsConversionAttribute($value): bool
    {
        if ($value !== null) {
            return (bool) $value;
        }

        $specs = $this->technical_specs;
        if (is_array($specs) && isset($specs['show_bs_conversion'])) {
            return (bool) $specs['show_bs_conversion'];
        }

        return true;
    }
}

