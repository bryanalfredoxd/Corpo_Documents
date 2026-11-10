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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->cascadeOnDelete();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            // Identificación del documento
            $table->enum('document_type', ['factura', 'proforma', 'cotizacion', 'nota_entrega'])->default('factura');
            $table->string('document_subtitle')->nullable(); // Ej: "LÍNEA MÁQUINAS"
            $table->string('correlative_number'); // Ej: "F-0000003"
            $table->string('control_number')->nullable(); // Ej: "00-089123"
            $table->string('order_number')->nullable(); // Ej: "Pedido #3"
            
            // Fechas y condiciones
            $table->dateTime('issue_date'); // Fecha y hora de emisión
            $table->date('due_date')->nullable(); // Fecha de vencimiento
            $table->unsignedInteger('offer_validity_days')->nullable(); // Ej: 15 días de validez (Proforma)
            $table->string('sale_condition')->default('Venta de Contado'); // Venta de Contado, Crédito 15 días, etc.
            $table->string('sales_channel')->default('Oficina / Presencial'); // Tienda en Línea, Oficina, etc.
            
            // Multimoneda y Tasa de Cambio BCV
            $table->decimal('bcv_exchange_rate', 14, 4)->default(1.0000); // Tasa oficial publicada por el BCV
            $table->boolean('show_bs_conversion')->default(true); // Si se muestra o no la conversión en Bolívares
            $table->string('currency', 3)->default('USD'); // USD o VES
            
            // Formas de Pago
            $table->string('payment_method')->nullable(); // PAGO MOVIL, TRANSFERENCIA, ZELLE, EFECTIVO
            $table->string('payment_reference')->nullable(); // Referencia bancaria (ej. 161773827)
            
            // Montos y Liquidación Fiscal
            $table->decimal('subtotal', 14, 2)->default(0.00); // Monto base de los productos/servicios
            $table->decimal('shipping_cost', 14, 2)->default(0.00); // Flete / Delivery / Seguro
            $table->decimal('discount', 14, 2)->default(0.00); // Descuentos aplicados
            $table->decimal('tax_percentage', 5, 2)->default(16.00); // Alícuota IVA (16.00% o 0.00% si exento)
            $table->decimal('tax_amount', 14, 2)->default(0.00); // Monto liquidado de IVA
            $table->decimal('total_usd', 14, 2)->default(0.00); // TOTAL USD
            $table->decimal('total_ves', 18, 2)->default(0.00); // TOTAL VES en Bolívares (USD * Tasa BCV)

            // Datos adicionales de entrega y ficha técnica
            $table->text('delivery_address')->nullable(); // Dirección de entrega específica
            $table->text('payment_terms_notes')->nullable(); // Desglose de pagos (ej: 70% anticipo, 30% restante)
            $table->text('shipping_terms_notes')->nullable(); // Condiciones de envío / plazos
            $table->text('terms_conditions')->nullable(); // Términos y condiciones de garantía o devolución
            $table->json('technical_specs')->nullable(); // Ficha técnica del equipo (ej: motor, potencia, peso)
            
            // Estado y Archivo
            $table->enum('status', ['emitida', 'borrador', 'anulada', 'pagada'])->default('emitida');
            $table->string('pdf_path')->nullable(); // Ruta del archivo PDF generado
            
            $table->timestamps();

            // Índices para búsquedas rápidas
            $table->index(['company_id', 'correlative_number']);
            $table->index('issue_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
