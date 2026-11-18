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
        Schema::create('consignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('description');
            $table->string('unit', 50)->default('unid');
            $table->decimal('current_quantity', 12, 2)->default(0);
            $table->decimal('unit_price', 14, 2)->default(0);
            $table->decimal('suggested_price', 14, 2)->nullable();
            $table->foreignId('initial_delivery_invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->string('status', 30)->default('activa'); // activa, liquidada_parcial, liquidada_total, devuelta
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['client_id', 'status']);
            $table->index(['company_id', 'status']);
        });

        Schema::create('consignment_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consignment_id')->constrained('consignments')->cascadeOnDelete();
            $table->string('movement_type', 30); // entrega_inicial, venta_facturada, reposicion, devolucion, ajuste
            $table->decimal('quantity', 12, 2);
            $table->decimal('previous_quantity', 12, 2)->default(0);
            $table->decimal('new_quantity', 12, 2)->default(0);
            $table->decimal('unit_price', 14, 2)->nullable();
            $table->decimal('suggested_price', 14, 2)->nullable();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['consignment_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consignment_movements');
        Schema::dropIfExists('consignments');
    }
};
