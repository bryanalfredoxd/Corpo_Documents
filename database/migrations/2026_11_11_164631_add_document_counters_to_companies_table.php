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
        Schema::table('companies', function (Blueprint $table) {
            if (!Schema::hasColumn('companies', 'proforma_prefix')) {
                $table->string('proforma_prefix', 15)->default('PROF-')->after('next_control_number');
            }
            if (!Schema::hasColumn('companies', 'next_proforma_correlative')) {
                $table->unsignedInteger('next_proforma_correlative')->default(1)->after('proforma_prefix');
            }
            if (!Schema::hasColumn('companies', 'quote_prefix')) {
                $table->string('quote_prefix', 15)->default('COT-')->after('next_proforma_correlative');
            }
            if (!Schema::hasColumn('companies', 'next_quote_correlative')) {
                $table->unsignedInteger('next_quote_correlative')->default(1)->after('quote_prefix');
            }
            if (!Schema::hasColumn('companies', 'delivery_note_prefix')) {
                $table->string('delivery_note_prefix', 15)->default('NE-')->after('next_quote_correlative');
            }
            if (!Schema::hasColumn('companies', 'next_delivery_note_correlative')) {
                $table->unsignedInteger('next_delivery_note_correlative')->default(1)->after('delivery_note_prefix');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $cols = array_filter([
                'proforma_prefix',
                'next_proforma_correlative',
                'quote_prefix',
                'next_quote_correlative',
                'delivery_note_prefix',
                'next_delivery_note_correlative',
            ], fn($col) => Schema::hasColumn('companies', $col));

            if (!empty($cols)) {
                $table->dropColumn($cols);
            }
        });
    }
};
