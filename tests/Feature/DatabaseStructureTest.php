<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseStructureTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_has_seeded_entities(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertDatabaseHas('companies', [
            'tax_id' => 'J-50493821-4',
            'name' => 'AGROSUMINISTROS RODRÍGUEZ C.A.',
        ]);

        $this->assertDatabaseHas('companies', [
            'tax_id' => 'J-507874141',
            'name' => 'MOAIVEN GROUP C.A. · IMPORT & LOGISTICS',
        ]);

        $this->assertDatabaseHas('clients', [
            'tax_id' => 'V-29923421',
            'name' => 'Bryan Moreno',
        ]);

        $this->assertDatabaseHas('invoices', [
            'correlative_number' => 'F-0000003',
            'total_usd' => 97.00,
        ]);

        $this->assertDatabaseHas('invoices', [
            'correlative_number' => 'PROF-0000001',
            'total_usd' => 54000.00,
        ]);

        // Verificar relaciones
        $invoice = Invoice::where('correlative_number', 'F-0000003')->first();
        $this->assertNotNull($invoice);
        $this->assertEquals('AGROSUMINISTROS RODRÍGUEZ C.A.', $invoice->company->name);
        $this->assertEquals('Bryan Moreno', $invoice->client->name);
        $this->assertCount(1, $invoice->items);
        $this->assertEquals('alimento agrícola', $invoice->items->first()->description);
        $this->assertEquals(876.80, $invoice->bcv_exchange_rate);

        // Verificar logo URL
        $this->assertNotNull($invoice->company->logo_url);
    }
}
