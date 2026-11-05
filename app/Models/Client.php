<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'name',
        'tax_id',
        'email',
        'phone',
        'phone_secondary',
        'address',
        'contact_person',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Facturas asociadas a este cliente / adquiriente.
     */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /**
     * Filtrar solo empresas / jurídicos.
     */
    public function scopeEmpresas(Builder $query): Builder
    {
        return $query->where('type', 'empresa');
    }

    /**
     * Filtrar solo personas naturales.
     */
    public function scopePersonas(Builder $query): Builder
    {
        return $query->where('type', 'persona');
    }
}

