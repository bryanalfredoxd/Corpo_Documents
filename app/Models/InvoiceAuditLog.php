<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Schema;

class InvoiceAuditLog extends Model
{
    protected $fillable = [
        'invoice_id',
        'user_id',
        'action',
        'correlative_number',
        'document_type',
        'description',
        'metadata',
        'ip_address',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Documento relacionado (nullable si fue eliminado).
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Usuario que ejecutó la acción.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Registra un evento de auditoría de forma segura (resiliente si no existe la tabla aún).
     */
    public static function record(
        ?Invoice $invoice,
        ?int $userId,
        string $action,
        string $description,
        array $metadata = [],
        ?string $ipAddress = null
    ): void {
        if (! Schema::hasTable('invoice_audit_logs')) {
            return;
        }

        self::create([
            'invoice_id' => $invoice?->id,
            'user_id' => $userId,
            'action' => $action,
            'correlative_number' => $invoice?->correlative_number,
            'document_type' => $invoice?->document_type,
            'description' => mb_substr($description, 0, 250),
            'metadata' => ! empty($metadata) ? $metadata : null,
            'ip_address' => $ipAddress,
        ]);
    }
}

