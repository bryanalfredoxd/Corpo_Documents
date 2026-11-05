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
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->unsignedInteger('item_order')->default(1); // Número correlativo de ítem (# 1, 2, 3...)
            $table->string('description'); // Descripción del producto o servicio (ej: "alimento agrícola", "Equipo FOB China")
            $table->text('details')->nullable(); // Detalles técnicos o notas adicionales del ítem
            $table->decimal('quantity', 12, 2)->default(1.00); // Cantidad
            $table->string('unit')->default('unid'); // Unidad de medida (ej: "saco", "unid", "servicio", "kg", "m³")
            $table->decimal('unit_price', 14, 2)->default(0.00); // Precio unitario en USD
            $table->decimal('total', 14, 2)->default(0.00); // Total del renglón (quantity * unit_price)
            $table->boolean('is_tax_exempt')->default(false); // Si el ítem está exento de IVA
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
