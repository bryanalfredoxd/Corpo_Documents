<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Razón Social: ej. Agrosuministros Rodríguez C.A.
            $table->string('trade_name')->nullable(); // Nombre Comercial
            $table->string('tax_id')->unique(); // RIF: ej. J-50493821-4
            $table->string('logo_path')->nullable(); // Ruta del logo almacenado
            $table->text('address'); // Dirección fiscal completa
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('country')->default('Venezuela');
            $table->string('phone'); // Teléfono / WhatsApp principal
            $table->string('phone_secondary')->nullable(); // Teléfono secundario
            $table->string('email'); // Correo de facturación / contacto
            $table->string('website')->nullable(); // Redes / Web (ej. TikTok, Instagram, Web)
            $table->string('invoice_prefix')->default('F-'); // Prefijo de facturas (ej. F-, PROF-)
            $table->unsignedInteger('next_correlative')->default(1); // Siguiente correlativo numérico
            $table->unsignedInteger('next_control_number')->default(1); // Siguiente N° de control
            $table->text('default_terms')->nullable(); // Términos y condiciones por defecto (devoluciones, reclamos)
            $table->text('default_payment_terms')->nullable(); // Condiciones de pago por defecto (70% al firmar, etc.)
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
