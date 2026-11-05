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
        Schema::create('company_bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->string('bank_name'); // Ej: Banesco, Banco de Venezuela, Mercantil, Zelle, Banesco Panamá
            $table->string('account_number')->nullable(); // Número de cuenta de 20 dígitos o identificador
            $table->string('account_type')->default('Corriente'); // Corriente, Ahorro, Zelle, Pago Móvil
            $table->string('holder_name'); // Nombre o Razón Social del titular
            $table->string('holder_tax_id'); // Cédula o RIF del titular
            $table->string('phone')->nullable(); // Teléfono para Pago Móvil
            $table->string('email')->nullable(); // Email para Zelle / Notificaciones
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_bank_accounts');
    }
};
