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
        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['persona', 'empresa'])->default('persona'); // Persona natural o jurídica
            $table->string('name'); // Nombre completo o Razón Social
            $table->string('tax_id')->unique(); // Cédula o RIF (ej. V-29923421, J-50192834-1)
            $table->string('email')->nullable();
            $table->string('phone'); // Teléfono / WhatsApp
            $table->string('phone_secondary')->nullable();
            $table->text('address')->nullable(); // Dirección fiscal / Dirección de entrega
            $table->string('contact_person')->nullable(); // Persona de contacto en caso de empresa
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
