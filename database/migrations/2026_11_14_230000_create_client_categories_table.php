<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('client_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('description', 255)->nullable();
            $table->string('icon', 20)->default('🏷️');
            $table->string('color', 30)->default('blue');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Insertar categorías iniciales sugeridas según los rubros del negocio
        $defaults = [
            [
                'name' => 'Maquinaria Agrícola',
                'description' => 'Tractores, excavadoras, maquinaria pesada y repuestos',
                'icon' => '🚜',
                'color' => 'amber',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Insumos Agrícolas / Semilleros',
                'description' => 'Bandejas de semillero, agropecuarias e insumos de siembra',
                'icon' => '🌱',
                'color' => 'emerald',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Equipos Médicos',
                'description' => 'Estetoscopios, instrumental médico, insumos de salud y clínicas',
                'icon' => '🩺',
                'color' => 'sky',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Servicios de Importación China',
                'description' => 'Servicios logísticos, agenciamiento de compras y fletes marítimos/aéreos China',
                'icon' => '🚢',
                'color' => 'indigo',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Comercial General',
                'description' => 'Clientes generales, suministros de oficina y ventas comerciales varias',
                'icon' => '🏢',
                'color' => 'slate',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('client_categories')->insert($defaults);

        // Homologar clientes que tengan 'General' a 'Comercial General'
        if (Schema::hasColumn('clients', 'category')) {
            DB::table('clients')
                ->where('category', 'General')
                ->orWhereNull('category')
                ->update(['category' => 'Comercial General']);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_categories');
    }
};

