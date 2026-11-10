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
        if (!Schema::hasColumn('invoices', 'show_bs_conversion')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->boolean('show_bs_conversion')->default(true)->after('bcv_exchange_rate');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('invoices', 'show_bs_conversion')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropColumn('show_bs_conversion');
            });
        }
    }
};
