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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'track_inventory')) {
                $table->boolean('track_inventory')->default(false)->after('image_url');
            }
            if (!Schema::hasColumn('products', 'stock')) {
                $table->decimal('stock', 12, 2)->default(0)->after('track_inventory');
            }
            if (!Schema::hasColumn('products', 'min_stock')) {
                $table->decimal('min_stock', 12, 2)->default(0)->after('stock');
            }
            if (!Schema::hasColumn('products', 'technical_specs')) {
                $table->json('technical_specs')->nullable()->after('min_stock');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $cols = array_filter([
                'track_inventory',
                'stock',
                'min_stock',
                'technical_specs',
            ], fn($col) => Schema::hasColumn('products', $col));

            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
