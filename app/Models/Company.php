<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'default_terms',
        'default_payment_terms',
        'is_active',
    ];

    protected $casts = [
        'next_correlative' => 'integer',
        'next_control_number' => 'integer',
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

        return Storage::disk('public')->url($this->logo_path);
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
}

