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
        if (!Schema::hasColumn('invoices', 'parent_invoice_id')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->foreignId('parent_invoice_id')
                    ->nullable()
                    ->after('user_id')
                    ->constrained('invoices')
                    ->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('invoices', 'parent_invoice_id')) {
            Schema::table('invoices', function (Blueprint $table) {
                $table->dropConstrainedForeignId('parent_invoice_id');
            });
        }
    }
};
