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
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->string('code', 100)->nullable();
                $table->string('name');
                $table->text('details')->nullable();
                $table->string('category', 100)->nullable();
                $table->string('unit', 50)->default('unid');
                $table->decimal('unit_price', 12, 2)->default(0);
                $table->boolean('is_tax_exempt')->default(false);
                $table->text('image_url')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
