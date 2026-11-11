<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class Company extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'trade_name',
        'tax_id',
        'logo_path',
        'address',
        'city',
        'state',
        'country',
        'phone',
        'phone_secondary',
        'email',
        'website',
        'invoice_prefix',
        'next_correlative',
        'next_control_number',
        'proforma_prefix',
        'next_proforma_correlative',
        'quote_prefix',
        'next_quote_correlative',
        'delivery_note_prefix',
        'next_delivery_note_correlative',
        'default_terms',
        'default_payment_terms',
        'is_active',
    ];

    protected $casts = [
        'next_correlative' => 'integer',
        'next_control_number' => 'integer',
        'next_proforma_correlative' => 'integer',
        'next_quote_correlative' => 'integer',
        'next_delivery_note_correlative' => 'integer',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'logo_url',
    ];

    /**
     * Obtiene la URL completa del logo para renderizado web y PDF.
     */
    public function getLogoUrlAttribute(): ?string
    {
        if (! $this->logo_path) {
            return null;
        }

        if (str_starts_with($this->logo_path, 'http://') || str_starts_with($this->logo_path, 'https://')) {
            return $this->logo_path;
        }

        return asset('storage/' . ltrim($this->logo_path, '/'));
    }

    /**
     * Facturas y proformas emitidas por esta empresa.
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Cuentas bancarias registradas para la empresa.
     */
    public function bankAccounts(): HasMany
    {
        return $this->hasMany(CompanyBankAccount::class);
    }

    /**
     * Genera y formatea el siguiente número correlativo fiscal.
     */
    public function getFormattedNextCorrelative(): string
    {
        $prefix = $this->invoice_prefix ?: 'F-';
        return sprintf('%s%07d', $prefix, $this->next_correlative);
    }

    /**
     * Devuelve la configuración de correlativo y prefijo independiente según el tipo de documento.
     */
    public function getSequenceConfigForType(string $documentType): array
    {
        if ($documentType === 'proforma' && Schema::hasColumn('companies', 'next_proforma_correlative')) {
            return [
                'prefix' => $this->proforma_prefix ?: 'PROF-',
                'next' => (int) ($this->next_proforma_correlative ?: 1),
                'counter_col' => 'next_proforma_correlative',
                'uses_fiscal_control' => false,
            ];
        }

        if ($documentType === 'cotizacion' && Schema::hasColumn('companies', 'next_quote_correlative')) {
            return [
                'prefix' => $this->quote_prefix ?: 'COT-',
                'next' => (int) ($this->next_quote_correlative ?: 1),
                'counter_col' => 'next_quote_correlative',
                'uses_fiscal_control' => false,
            ];
        }

        if ($documentType === 'nota_entrega' && Schema::hasColumn('companies', 'next_delivery_note_correlative')) {
            return [
                'prefix' => $this->delivery_note_prefix ?: 'NE-',
                'next' => (int) ($this->next_delivery_note_correlative ?: 1),
                'counter_col' => 'next_delivery_note_correlative',
                'uses_fiscal_control' => false,
            ];
        }

        return [
            'prefix' => $this->invoice_prefix ?: 'F-',
            'next' => (int) ($this->next_correlative ?: 1),
            'counter_col' => 'next_correlative',
            'uses_fiscal_control' => true,
        ];
    }
}

