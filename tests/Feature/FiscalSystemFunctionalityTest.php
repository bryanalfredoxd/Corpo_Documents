<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanyBankAccount;
use App\Models\Invoice;
use App\Models\InvoiceAuditLog;
use App\Models\InvoicePayment;
use App\Models\Product;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FiscalSystemFunctionalityTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_is_redirected_to_login(): void
    {
        $response = $this->get('/');
        $response->assertRedirect('/login');
    }

    public function test_registration_route_is_disabled(): void
    {
        $response = $this->get('/register');
        $response->assertStatus(404);
    }

    public function test_login_screen_renders_successfully(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
    }

    public function test_user_can_login_and_access_dashboard(): void
    {
        $this->seed(DatabaseSeeder::class);

        $response = $this->post('/login', [
            'email' => 'admin@corpoasia.com',
            'password' => 'password123',
        ]);

        $response->assertRedirect('/');
        $this->assertAuthenticated();

        $dashboardResponse = $this->get('/');
        $dashboardResponse->assertStatus(200);
    }

    public function test_authenticated_user_can_create_company_with_logo(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        $logoFile = UploadedFile::fake()->image('logo_test.png', 200, 200);

        $response = $this->actingAs($user)->post('/companies', [
            'name' => 'Transportes & Carga Los Llanos, C.A.',
            'tax_id' => 'J-99887766-5',
            'phone' => '+58 412 111 2233',
            'email' => 'contacto@losllanos.com',
            'address' => 'Barinas, Edo. Barinas',
            'invoice_prefix' => 'LL-',
            'logo' => $logoFile,
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('companies', [
            'name' => 'Transportes & Carga Los Llanos, C.A.',
            'tax_id' => 'J-99887766-5',
            'invoice_prefix' => 'LL-',
        ]);

        $company = Company::where('tax_id', 'J-99887766-5')->first();
        $this->assertNotNull($company->logo_path);
        Storage::disk('public')->assertExists($company->logo_path);
    }

    public function test_authenticated_user_can_create_company_without_email(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/companies', [
            'name' => 'Agro Insumos Sin Correo, C.A.',
            'tax_id' => 'J-11223344-5',
            'phone' => '+58 414 777 8899',
            'email' => null,
            'address' => 'Barinas, Edo. Barinas',
            'invoice_prefix' => 'AG-',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('companies', [
            'name' => 'Agro Insumos Sin Correo, C.A.',
            'tax_id' => 'J-11223344-5',
            'email' => null,
        ]);
    }

    public function test_authenticated_user_can_create_client(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/clients', [
            'type' => 'persona',
            'name' => 'Carlos Alberto Rivas',
            'tax_id' => 'V-15890123',
            'phone' => '+58 414 999 1122',
            'email' => 'carlos.rivas@gmail.com',
            'address' => 'Valencia, Edo. Carabobo',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('clients', [
            'tax_id' => 'V-15890123',
            'name' => 'Carlos Alberto Rivas',
        ]);
    }

    public function test_authenticated_user_can_create_invoice_with_items(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::where('email', 'admin@corpoasia.com')->first();
        $company = Company::first();
        $client = Client::first();

        $response = $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'issue_date' => '2026-11-04',
            'sale_condition' => 'Venta de Contado',
            'bcv_exchange_rate' => 876.80,
            'currency' => 'USD',
            'payment_method' => 'PAGO MOVIL',
            'shipping_cost' => 15.00,
            'discount' => 0.00,
            'tax_percentage' => 16.00,
            'items' => [
                [
                    'description' => 'Servicio de Asesoría Integral',
                    'quantity' => 2,
                    'unit' => 'servicio',
                    'unit_price' => 50.00,
                    'is_tax_exempt' => false,
                ],
            ],
        ]);

        $response->assertSessionHas('success');

        // Subtotal: 100, Flete: 15, IVA (16% de 100): 16, Total USD: 131.00
        $this->assertDatabaseHas('invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'subtotal' => 100.00,
            'shipping_cost' => 15.00,
            'tax_amount' => 16.00,
            'total_usd' => 131.00,
        ]);
    }

    public function test_authenticated_user_can_consult_cne_api(): void
    {
        $user = User::factory()->create();

        Http::fake([
            'api.cedula.com.ve/*' => Http::response([
                'error' => false,
                'data' => [
                    'nacionalidad' => 'V',
                    'cedula' => 29923421,
                    'rif' => 'V299234211',
                    'primer_nombre' => 'BRYAN',
                    'segundo_nombre' => 'ALFREDO',
                    'primer_apellido' => 'MORENO',
                    'segundo_apellido' => 'MARQUEZ',
                    'cne' => [
                        'estado' => 'CARABOBO',
                        'municipio' => 'VALENCIA',
                        'parroquia' => 'SAN JOSE',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->actingAs($user)->postJson('/clients/consult-cne', [
            'nacionalidad' => 'V',
            'cedula' => '29923421',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'full_name' => 'BRYAN ALFREDO MORENO MARQUEZ',
                'rif' => 'V299234211',
            ]);
    }

    public function test_authenticated_user_can_update_company(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Original Company Name',
            'tax_id' => 'J-12345678-9',
            'phone' => '+58 412 0000000',
            'email' => 'original@empresa.com',
            'address' => 'Caracas, Venezuela',
            'invoice_prefix' => 'F-',
            'next_correlative' => 1,
            'next_control_number' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->put("/companies/{$company->id}", [
            'name' => 'Updated Company Name',
            'tax_id' => 'J-12345678-9',
            'phone' => '+58 414 9999999',
            'email' => 'updated@empresa.com',
            'address' => 'Valencia, Venezuela',
            'city' => 'Valencia',
            'state' => 'Carabobo',
            'invoice_prefix' => 'F-',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Updated Company Name',
            'phone' => '+58 414 9999999',
            'city' => 'Valencia',
        ]);
    }

    public function test_authenticated_user_can_update_company_removing_email(): void
    {
        $user = User::factory()->create();

        $company = Company::create([
            'name' => 'Original Company',
            'tax_id' => 'J-55667788-9',
            'phone' => '+58 412 0000000',
            'email' => 'original@empresa.com',
            'address' => 'Caracas, Venezuela',
            'invoice_prefix' => 'F-',
            'next_correlative' => 1,
            'next_control_number' => 1,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->put("/companies/{$company->id}", [
            'name' => 'Updated Company Without Email',
            'tax_id' => 'J-55667788-9',
            'phone' => '+58 412 0000000',
            'email' => '',
            'address' => 'Caracas, Venezuela',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'name' => 'Updated Company Without Email',
            'email' => null,
        ]);
    }

    public function test_authenticated_user_can_update_client(): void
    {
        $user = User::factory()->create();
        $client = Client::create([
            'type' => 'persona',
            'name' => 'Juan Perez',
            'tax_id' => 'V-11223344',
            'phone' => '+58 412 3333333',
            'email' => 'juan@gmail.com',
            'address' => 'Barinas',
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->put("/clients/{$client->id}", [
            'type' => 'persona',
            'name' => 'Juan Carlos Perez',
            'tax_id' => 'V-11223344',
            'phone' => '+58 412 8888888',
            'email' => 'juancarlos@gmail.com',
            'address' => 'Barinitas',
        ]);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('clients', [
            'id' => $client->id,
            'name' => 'Juan Carlos Perez',
            'phone' => '+58 412 8888888',
            'address' => 'Barinitas',
        ]);
    }

    public function test_invoice_can_be_created_in_solo_dolares_mode(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::first();
        $company = Company::first();
        $client = Client::first();

        $response = $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'cotizacion',
            'document_subtitle' => 'PRESUPUESTO BICICLETAS',
            'issue_date' => '2026-11-10',
            'sale_condition' => 'Venta de Contado',
            'sales_channel' => 'Oficina',
            'bcv_exchange_rate' => 880.50,
            'show_bs_conversion' => false,
            'currency' => 'USD',
            'payment_method' => 'EFECTIVO (USD)',
            'shipping_cost' => 0,
            'discount' => 0,
            'tax_percentage' => 0,
            'items' => [
                [
                    'description' => 'Bicicleta Montañera Rin 29',
                    'details' => 'Color negro mate, cambios Shimano',
                    'quantity' => 2,
                    'unit' => 'UND',
                    'unit_price' => 250.00,
                    'is_tax_exempt' => true,
                ],
            ],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('invoices', [
            'document_type' => 'cotizacion',
            'total_usd' => 500.00,
            'show_bs_conversion' => false,
        ]);
    }

    public function test_authenticated_user_can_manage_product_catalog(): void
    {
        $user = User::factory()->create();

        // 1. Registrar nuevo producto
        $createResponse = $this->actingAs($user)->post('/products', [
            'code' => 'BIC-001',
            'name' => 'Bicicleta Montañera Rin 29',
            'details' => 'Frenos de disco hidráulicos, cambios Shimano',
            'category' => 'Bicicletas',
            'unit' => 'unid',
            'unit_price' => 320.00,
            'is_tax_exempt' => true,
        ]);

        $createResponse->assertSessionHas('success');
        $this->assertDatabaseHas('products', [
            'code' => 'BIC-001',
            'name' => 'Bicicleta Montañera Rin 29',
            'unit_price' => 320.00,
            'is_tax_exempt' => 1,
            'is_active' => 1,
        ]);

        $product = Product::where('code', 'BIC-001')->first();

        // 2. Actualizar producto existente
        $updateResponse = $this->actingAs($user)->put("/products/{$product->id}", [
            'code' => 'BIC-001',
            'name' => 'Bicicleta Montañera Rin 29 Pro',
            'details' => 'Actualizada con suspensión bloqueable',
            'category' => 'Bicicletas',
            'unit' => 'unid',
            'unit_price' => 350.50,
            'is_tax_exempt' => false,
        ]);

        $updateResponse->assertSessionHas('success');
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Bicicleta Montañera Rin 29 Pro',
            'unit_price' => 350.50,
            'is_tax_exempt' => 0,
        ]);

        // 3. Eliminar (desactivar) producto del catálogo
        $deleteResponse = $this->actingAs($user)->delete("/products/{$product->id}");
        $deleteResponse->assertSessionHas('success');
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'is_active' => 0,
        ]);
    }

    public function test_authenticated_user_can_manage_company_bank_accounts(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::first();
        $company = Company::first();

        // 1. Crear cuenta bancaria
        $storeResponse = $this->actingAs($user)->post("/companies/{$company->id}/bank-accounts", [
            'bank_name' => 'Bancamiga',
            'account_type' => 'Pago Móvil',
            'account_number' => '0172-0001-11-22334455',
            'holder_name' => $company->name,
            'holder_tax_id' => $company->tax_id,
            'phone' => '0412-5556677',
            'email' => 'pagos@empresa.com',
        ]);

        $storeResponse->assertSessionHas('success');
        $this->assertDatabaseHas('company_bank_accounts', [
            'company_id' => $company->id,
            'bank_name' => 'Bancamiga',
            'account_type' => 'Pago Móvil',
            'phone' => '0412-5556677',
        ]);

        $account = CompanyBankAccount::where('bank_name', 'Bancamiga')->first();

        // 2. Actualizar cuenta bancaria
        $updateResponse = $this->actingAs($user)->put("/bank-accounts/{$account->id}", [
            'bank_name' => 'Bancamiga Internacional',
            'account_type' => 'Cuenta USD / Nacional',
            'account_number' => '0172-9999-11-22334455',
            'holder_name' => $company->name,
            'holder_tax_id' => $company->tax_id,
        ]);

        $updateResponse->assertSessionHas('success');
        $this->assertDatabaseHas('company_bank_accounts', [
            'id' => $account->id,
            'bank_name' => 'Bancamiga Internacional',
        ]);

        // 3. Eliminar cuenta bancaria
        $deleteResponse = $this->actingAs($user)->delete("/bank-accounts/{$account->id}");
        $deleteResponse->assertSessionHas('success');
        $this->assertDatabaseMissing('company_bank_accounts', ['id' => $account->id]);
    }

    public function test_invoice_lifecycle_draft_update_emit_pay_and_annul(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::first();
        $company = Company::first();
        $client = Client::first();
        $initialCorrelative = $company->next_correlative;

        // 1. Guardar como borrador (no debe consumir correlativo)
        $draftResponse = $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Venta de Contado',
            'bcv_exchange_rate' => 880.00,
            'currency' => 'USD',
            'shipping_cost' => 0,
            'discount' => 10.00,
            'tax_percentage' => 0,
            'status' => 'borrador',
            'items' => [
                [
                    'description' => 'Producto Borrador',
                    'quantity' => 1,
                    'unit' => 'unid',
                    'unit_price' => 100.00,
                    'is_tax_exempt' => true,
                ],
            ],
        ]);

        $draftResponse->assertSessionHas('success');
        $company->refresh();
        $this->assertEquals($initialCorrelative, $company->next_correlative);

        $invoice = Invoice::latest('id')->first();
        $this->assertEquals('borrador', $invoice->status);
        $this->assertStringStartsWith('BORR-', $invoice->correlative_number);
        $this->assertEquals(90.00, (float) $invoice->total_usd);

        // 2. Actualizar borrador con nuevo ítem y descuento (aún borrador)
        $updateResponse = $this->actingAs($user)->put("/invoices/{$invoice->id}", [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Venta de Contado',
            'bcv_exchange_rate' => 880.00,
            'currency' => 'USD',
            'shipping_cost' => 0,
            'discount' => 20.00,
            'tax_percentage' => 0,
            'status' => 'borrador',
            'items' => [
                [
                    'description' => 'Producto Editado',
                    'quantity' => 2,
                    'unit' => 'unid',
                    'unit_price' => 100.00,
                    'is_tax_exempt' => true,
                ],
            ],
        ]);

        $updateResponse->assertSessionHas('success');
        $invoice->refresh();
        $this->assertEquals(180.00, (float) $invoice->total_usd);

        // 3. Emitir borrador -> debe asignar correlativo real e incrementar contador
        $emitResponse = $this->actingAs($user)->patch("/invoices/{$invoice->id}/status", [
            'status' => 'emitida',
        ]);

        $emitResponse->assertSessionHas('success');
        $invoice->refresh();
        $company->refresh();
        $this->assertEquals('emitida', $invoice->status);
        $this->assertStringStartsNotWith('BORR-', $invoice->correlative_number);
        $this->assertEquals($initialCorrelative + 1, $company->next_correlative);

        // 4. Marcar pagada y luego anular conservando correlativo
        $this->actingAs($user)->patch("/invoices/{$invoice->id}/status", ['status' => 'pagada'])
            ->assertSessionHas('success');
        $this->assertEquals('pagada', $invoice->fresh()->status);

        $this->actingAs($user)->patch("/invoices/{$invoice->id}/status", ['status' => 'anulada'])
            ->assertSessionHas('success');
        $this->assertEquals('anulada', $invoice->fresh()->status);
        $this->assertEquals($invoice->correlative_number, $invoice->fresh()->correlative_number);
    }

    public function test_company_update_saves_correlatives_website_and_default_terms(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::first();
        $company = Company::first();

        $response = $this->actingAs($user)->put("/companies/{$company->id}", [
            'name' => $company->name,
            'tax_id' => $company->tax_id,
            'phone' => $company->phone,
            'address' => $company->address,
            'invoice_prefix' => 'CORP-',
            'next_correlative' => 50,
            'next_control_number' => 120,
            'website' => 'www.inversionescorpoasia.com',
            'default_terms' => 'Garantía de 30 días por defectos de fábrica.',
            'default_payment_terms' => 'Pago 100% contra entrega.',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('companies', [
            'id' => $company->id,
            'invoice_prefix' => 'CORP-',
            'next_correlative' => 50,
            'next_control_number' => 120,
            'website' => 'www.inversionescorpoasia.com',
            'default_terms' => 'Garantía de 30 días por defectos de fábrica.',
            'default_payment_terms' => 'Pago 100% contra entrega.',
        ]);
    }

    public function test_independent_document_sequences_do_not_consume_fiscal_correlatives(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::first();
        $company = Company::first();
        $initialInvoiceCorr = $company->next_correlative;
        $initialControl = $company->next_control_number;
        $client = Client::first();

        $basePayload = [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880.00,
            'currency' => 'USD',
            'shipping_cost' => 0,
            'discount' => 0,
            'tax_percentage' => 0,
            'items' => [
                ['description' => 'Item Test', 'quantity' => 1, 'unit' => 'unid', 'unit_price' => 50.00, 'is_tax_exempt' => true],
            ],
        ];

        // 1. Proforma
        $this->actingAs($user)->post('/invoices', array_merge($basePayload, ['document_type' => 'proforma']))
            ->assertSessionHas('success');
        $prof = Invoice::latest('id')->first();
        $this->assertStringStartsWith('PROF-', $prof->correlative_number);

        // 2. Cotización
        $this->actingAs($user)->post('/invoices', array_merge($basePayload, ['document_type' => 'cotizacion']))
            ->assertSessionHas('success');
        $cot = Invoice::latest('id')->first();
        $this->assertStringStartsWith('COT-', $cot->correlative_number);

        // 3. Nota de Entrega
        $this->actingAs($user)->post('/invoices', array_merge($basePayload, ['document_type' => 'nota_entrega']))
            ->assertSessionHas('success');
        $ne = Invoice::latest('id')->first();
        $this->assertStringStartsWith('NE-', $ne->correlative_number);

        // Verificar que los correlativos fiscales de Factura NO se tocaron
        $company->refresh();
        $this->assertEquals($initialInvoiceCorr, $company->next_correlative);
        $this->assertEquals($initialControl, $company->next_control_number);
        $this->assertEquals(2, $company->next_proforma_correlative);
        $this->assertEquals(2, $company->next_quote_correlative);
        $this->assertEquals(2, $company->next_delivery_note_correlative);
    }

    public function test_convert_quote_or_proforma_to_fiscal_invoice_in_one_click(): void
    {
        $this->seed(DatabaseSeeder::class);
        $user = User::first();
        $company = Company::first();
        $client = Client::first();

        $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'cotizacion',
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880.00,
            'currency' => 'USD',
            'tax_percentage' => 0,
            'items' => [
                ['description' => 'Bicicleta BMX Pro', 'quantity' => 3, 'unit' => 'unid', 'unit_price' => 120.00, 'is_tax_exempt' => true],
            ],
        ])->assertSessionHas('success');

        $quote = Invoice::where('document_type', 'cotizacion')->latest('id')->first();
        $initialInvoiceCorr = $company->fresh()->next_correlative;

        $convertResponse = $this->actingAs($user)->post("/invoices/{$quote->id}/convert-to-invoice");
        $convertResponse->assertSessionHas('success');

        $newFiscalInvoice = Invoice::where('parent_invoice_id', $quote->id)->first();
        $this->assertNotNull($newFiscalInvoice);
        $this->assertEquals('factura', $newFiscalInvoice->document_type);
        $this->assertEquals('emitida', $newFiscalInvoice->status);
        $this->assertEquals(360.00, (float) $newFiscalInvoice->total_usd);
        $this->assertStringStartsWith($company->invoice_prefix ?: 'F-', $newFiscalInvoice->correlative_number);
        $this->assertEquals($initialInvoiceCorr + 1, $company->fresh()->next_correlative);
        $this->assertCount(1, $newFiscalInvoice->items);
        $this->assertEquals('Bicicleta BMX Pro', $newFiscalInvoice->items->first()->description);
    }

    public function test_dashboard_metrics_separate_fiscal_invoices_from_quotes_and_annulled(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Empresa Métricas C.A.',
            'tax_id' => 'J-77777777-7',
            'phone' => '+58 412 0000000',
            'address' => 'Caracas',
            'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'persona',
            'name' => 'Cliente Test',
            'tax_id' => 'V-9999999',
            'phone' => '+58 414 0000000',
            'is_active' => true,
        ]);

        // Factura emitida (por cobrar): $200
        Invoice::create([
            'company_id' => $company->id, 'client_id' => $client->id, 'document_type' => 'factura',
            'correlative_number' => 'F-0000001', 'issue_date' => '2026-11-11', 'bcv_exchange_rate' => 880,
            'currency' => 'USD', 'total_usd' => 200.00, 'total_ves' => 176000.00, 'status' => 'emitida',
        ]);
        // Factura pagada (cobrada): $300
        Invoice::create([
            'company_id' => $company->id, 'client_id' => $client->id, 'document_type' => 'factura',
            'correlative_number' => 'F-0000002', 'issue_date' => '2026-11-11', 'bcv_exchange_rate' => 880,
            'currency' => 'USD', 'total_usd' => 300.00, 'total_ves' => 264000.00, 'status' => 'pagada',
        ]);
        // Factura anulada (NO debe sumar): $999
        Invoice::create([
            'company_id' => $company->id, 'client_id' => $client->id, 'document_type' => 'factura',
            'correlative_number' => 'F-0000003', 'issue_date' => '2026-11-11', 'bcv_exchange_rate' => 880,
            'currency' => 'USD', 'total_usd' => 999.00, 'total_ves' => 879120.00, 'status' => 'anulada',
        ]);
        // Cotización activa (debe ir en total_quoted_usd, NO en total_usd): $500
        Invoice::create([
            'company_id' => $company->id, 'client_id' => $client->id, 'document_type' => 'cotizacion',
            'correlative_number' => 'COT-0000001', 'issue_date' => '2026-11-11', 'bcv_exchange_rate' => 880,
            'currency' => 'USD', 'total_usd' => 500.00, 'total_ves' => 440000.00, 'status' => 'emitida',
        ]);

        $response = $this->actingAs($user)->get('/');
        $response->assertStatus(200);
        $props = $response->viewData('page')['props'];
        $stats = $props['stats'];

        $this->assertEquals(500.00, (float) $stats['total_usd']); // 200 + 300
        $this->assertEquals(200.00, (float) $stats['total_receivable_usd']);
        $this->assertEquals(300.00, (float) $stats['total_collected_usd']);
        $this->assertEquals(500.00, (float) $stats['total_quoted_usd']);
        $this->assertEquals(2, $stats['fiscal_invoices_count']);
        $this->assertEquals(1, $stats['quotes_count']);
    }

    public function test_product_inventory_and_dynamic_technical_specs_can_be_saved_and_cleared(): void
    {
        $user = User::factory()->create();

        $specsPayload = [
            'equipment_year' => '2023 / Nueva',
            'equipment_vin' => 'KOM-PC200-8899',
            'specs' => [
                ['category' => 'Motor', 'name' => 'Potencia', 'value' => '155 HP'],
                ['category' => 'Peso', 'name' => 'Operativo', 'value' => '21,500 kg'],
            ],
        ];

        $this->actingAs($user)->post('/products', [
            'code' => 'EXC-PC200',
            'name' => 'Excavadora Komatsu PC200',
            'category' => 'Maquinaria',
            'unit' => 'unid',
            'unit_price' => 48000,
            'track_inventory' => 1,
            'stock' => 4,
            'min_stock' => 1,
            'technical_specs' => json_encode($specsPayload),
        ])->assertRedirect();

        $product = Product::where('code', 'EXC-PC200')->firstOrFail();
        $this->assertTrue($product->track_inventory);
        $this->assertEquals(4.0, (float) $product->stock);
        $this->assertEquals(1.0, (float) $product->min_stock);
        $this->assertSame('2023 / Nueva', $product->technical_specs['equipment_year']);
        $this->assertSame('KOM-PC200-8899', $product->technical_specs['equipment_vin']);
        $this->assertCount(2, $product->technical_specs['specs']);

        // Actualizar limpiando technical_specs con string vacío (caso FormData) no debe fallar validación
        $this->actingAs($user)->put("/products/{$product->id}", [
            'code' => 'EXC-PC200',
            'name' => 'Excavadora Komatsu PC200',
            'category' => 'Maquinaria',
            'unit' => 'unid',
            'unit_price' => 48000,
            'track_inventory' => 1,
            'stock' => 6,
            'min_stock' => 2,
            'technical_specs' => '',
        ])->assertRedirect();

        $product->refresh();
        $this->assertEquals(6.0, (float) $product->stock);
        $this->assertEquals(2.0, (float) $product->min_stock);
        $this->assertNull($product->technical_specs);
    }

    public function test_inventory_deducts_only_on_emitted_invoices_and_delivery_notes_and_restores_on_annul_update_destroy(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Corpo Asia CA',
            'tax_id' => 'J-50123456-7',
            'phone' => '+58 212 0000000',
            'address' => 'Caracas',
            'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'empresa',
            'name' => 'Constructora Norte CA',
            'tax_id' => 'J-40987654-3',
            'phone' => '+58 414 1112233',
            'is_active' => true,
        ]);
        $product = Product::create([
            'code' => 'REP-100',
            'name' => 'Bomba Hidráulica K5V',
            'category' => 'Repuestos',
            'unit' => 'unid',
            'unit_price' => 150,
            'track_inventory' => true,
            'stock' => 10,
            'min_stock' => 2,
            'is_active' => true,
        ]);

        $basePayload = [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'issue_date' => '2026-11-11',
            'offer_validity_days' => 8,
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880,
            'show_bs_conversion' => true,
            'currency' => 'USD',
            'payment_method' => 'ZELLE',
            'shipping_cost' => 0,
            'discount' => 0,
            'tax_percentage' => 16,
        ];

        // 1. Cotización emitida -> NO descuenta stock
        $this->actingAs($user)->post('/invoices', array_merge($basePayload, [
            'document_type' => 'cotizacion',
            'status' => 'emitida',
            'items' => [[
                'product_id' => $product->id, 'description' => $product->name,
                'quantity' => 4, 'unit' => 'unid', 'unit_price' => 150, 'is_tax_exempt' => false,
            ]],
        ]))->assertRedirect();
        $this->assertEquals(10.0, (float) $product->fresh()->stock);

        // 2. Proforma emitida -> NO descuenta stock
        $this->actingAs($user)->post('/invoices', array_merge($basePayload, [
            'document_type' => 'proforma',
            'status' => 'emitida',
            'items' => [[
                'product_id' => $product->id, 'description' => $product->name,
                'quantity' => 3, 'unit' => 'unid', 'unit_price' => 150, 'is_tax_exempt' => false,
            ]],
        ]))->assertRedirect();
        $this->assertEquals(10.0, (float) $product->fresh()->stock);

        // 3. Borrador de Factura -> NO descuenta stock
        $this->actingAs($user)->post('/invoices', array_merge($basePayload, [
            'document_type' => 'factura',
            'status' => 'borrador',
            'items' => [[
                'product_id' => $product->id, 'description' => $product->name,
                'quantity' => 2, 'unit' => 'unid', 'unit_price' => 150, 'is_tax_exempt' => false,
            ]],
        ]))->assertRedirect();
        $this->assertEquals(10.0, (float) $product->fresh()->stock);

        // 4. Nota de Entrega emitida -> SÍ descuenta 3 (10 -> 7)
        $this->actingAs($user)->post('/invoices', array_merge($basePayload, [
            'document_type' => 'nota_entrega',
            'status' => 'emitida',
            'items' => [[
                'product_id' => $product->id, 'description' => $product->name,
                'quantity' => 3, 'unit' => 'unid', 'unit_price' => 150, 'is_tax_exempt' => false,
            ]],
        ]))->assertRedirect();
        $deliveryNote = Invoice::where('document_type', 'nota_entrega')->firstOrFail();
        $this->assertEquals(7.0, (float) $product->fresh()->stock);

        // 5. Factura emitida -> SÍ descuenta 2 (7 -> 5)
        $this->actingAs($user)->post('/invoices', array_merge($basePayload, [
            'document_type' => 'factura',
            'status' => 'emitida',
            'items' => [[
                'product_id' => $product->id, 'description' => $product->name,
                'quantity' => 2, 'unit' => 'unid', 'unit_price' => 150, 'is_tax_exempt' => false,
            ]],
        ]))->assertRedirect();
        $factura = Invoice::where('document_type', 'factura')->where('status', 'emitida')->firstOrFail();
        $this->assertEquals(5.0, (float) $product->fresh()->stock);

        // 6. Editar factura cambiando cantidad 2 -> 4 (restaura 2, descuenta 4 => 3)
        $this->actingAs($user)->put("/invoices/{$factura->id}", array_merge($basePayload, [
            'document_type' => 'factura',
            'status' => 'emitida',
            'items' => [[
                'product_id' => $product->id, 'description' => $product->name,
                'quantity' => 4, 'unit' => 'unid', 'unit_price' => 150, 'is_tax_exempt' => false,
            ]],
        ]))->assertRedirect();
        $this->assertEquals(3.0, (float) $product->fresh()->stock);

        // 7. Anular factura -> restaura los 4 (3 -> 7)
        $this->actingAs($user)->patch("/invoices/{$factura->id}/status", [
            'status' => 'anulada',
        ])->assertRedirect();
        $this->assertEquals(7.0, (float) $product->fresh()->stock);

        // 8. Eliminar Nota de Entrega emitida -> restaura sus 3 (7 -> 10)
        $this->actingAs($user)->delete("/invoices/{$deliveryNote->id}")->assertRedirect();
        $this->assertEquals(10.0, (float) $product->fresh()->stock);
    }

    public function test_converting_quote_to_invoice_deducts_inventory_once_and_dashboard_calculates_product_stats(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Corpo Asia CA',
            'tax_id' => 'J-50123456-7',
            'phone' => '+58 212 0000000',
            'address' => 'Caracas',
            'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'persona',
            'name' => 'Cliente Maquinaria',
            'tax_id' => 'V-11223344',
            'phone' => '+58 412 0000000',
            'is_active' => true,
        ]);
        $product = Product::create([
            'code' => 'GEN-50KW',
            'name' => 'Planta Eléctrica 50KVA',
            'category' => 'Equipos',
            'unit' => 'unid',
            'unit_price' => 1000,
            'track_inventory' => true,
            'stock' => 10,
            'min_stock' => 1,
            'is_active' => true,
        ]);

        // Cotización de 2 unidades -> stock permanece en 10
        $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'cotizacion',
            'status' => 'emitida',
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880,
            'currency' => 'USD',
            'payment_method' => 'TRANSFERENCIA',
            'tax_percentage' => 0,
            'items' => [[
                'product_id' => $product->id, 'description' => $product->name,
                'quantity' => 2, 'unit' => 'unid', 'unit_price' => 1000, 'is_tax_exempt' => true,
            ]],
        ])->assertRedirect();

        $quote = Invoice::where('document_type', 'cotizacion')->firstOrFail();
        $this->assertEquals(10.0, (float) $product->fresh()->stock);

        // Convertir cotización a Factura Fiscal -> descuenta 2 unidades (10 -> 8)
        $this->actingAs($user)->post("/invoices/{$quote->id}/convert-to-invoice")->assertRedirect();
        $this->assertEquals(8.0, (float) $product->fresh()->stock);

        // Emitir Nota de Entrega por 1 unidad (8 -> 7) y convertirla a Factura -> NO descuenta doble (queda en 7)
        $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'nota_entrega',
            'status' => 'emitida',
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880,
            'currency' => 'USD',
            'payment_method' => 'EFECTIVO',
            'tax_percentage' => 0,
            'items' => [[
                'product_id' => $product->id, 'description' => $product->name,
                'quantity' => 1, 'unit' => 'unid', 'unit_price' => 1000, 'is_tax_exempt' => true,
            ]],
        ])->assertRedirect();
        $deliveryNote = Invoice::where('document_type', 'nota_entrega')->firstOrFail();
        $this->assertEquals(7.0, (float) $product->fresh()->stock);

        $this->actingAs($user)->post("/invoices/{$deliveryNote->id}/convert-to-invoice")->assertRedirect();
        $this->assertEquals(7.0, (float) $product->fresh()->stock);

        // Verificar métricas cruzadas del catálogo en '/'
        $props = $this->actingAs($user)->get('/')->viewData('page')['props'];
        $loadedProduct = collect($props['products'])->firstWhere('id', $product->id);
        $this->assertNotNull($loadedProduct);
        $this->assertEquals(2.0, (float) $loadedProduct['quoted_units']);
        $this->assertGreaterThanOrEqual(3.0, (float) $loadedProduct['sold_units']);
    }

    public function test_partial_payments_calculate_balances_promote_to_paid_and_revert_on_delete(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Corpo Asia CA',
            'tax_id' => 'J-50123456-7',
            'phone' => '+58 212 0000000',
            'address' => 'Caracas',
            'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'persona',
            'name' => 'Cliente Pagos Parciales',
            'tax_id' => 'V-7777777',
            'phone' => '+58 414 0000000',
            'is_active' => true,
        ]);

        $invoice = Invoice::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'correlative_number' => 'F-0000010',
            'issue_date' => '2026-11-11',
            'bcv_exchange_rate' => 880,
            'currency' => 'USD',
            'total_usd' => 1000.00,
            'total_ves' => 880000.00,
            'status' => 'emitida',
        ]);

        // 1. Abono inicial 70% ($700): sigue 'emitida', resta $300
        $this->actingAs($user)->post("/invoices/{$invoice->id}/payments", [
            'payment_date' => '2026-11-11',
            'amount_usd' => 700.00,
            'payment_method' => 'TRANSFERENCIA',
            'reference' => 'REF-70PCT',
            'notes' => 'Hito inicial firma de contrato',
        ])->assertRedirect();

        $invoice->refresh()->load('payments');
        $this->assertSame('emitida', $invoice->status);
        $this->assertEquals(700.00, $invoice->paid_amount_usd);
        $this->assertEquals(300.00, $invoice->balance_due_usd);

        $stats = $this->actingAs($user)->get('/')->viewData('page')['props']['stats'];
        $this->assertEquals(700.00, (float) $stats['total_collected_usd']);
        $this->assertEquals(300.00, (float) $stats['total_receivable_usd']);

        // 2. Segundo abono 30% ($300): completa el 100% -> pasa automáticamente a 'pagada'
        $this->actingAs($user)->post("/invoices/{$invoice->id}/payments", [
            'payment_date' => '2026-11-12',
            'amount_usd' => 300.00,
            'payment_method' => 'ZELLE',
            'reference' => 'ZELLE-30PCT',
        ])->assertRedirect();

        $invoice->refresh()->load('payments');
        $this->assertSame('pagada', $invoice->status);
        $this->assertEquals(1000.00, $invoice->paid_amount_usd);
        $this->assertEquals(0.00, $invoice->balance_due_usd);

        $stats = $this->actingAs($user)->get('/')->viewData('page')['props']['stats'];
        $this->assertEquals(1000.00, (float) $stats['total_collected_usd']);
        $this->assertEquals(0.00, (float) $stats['total_receivable_usd']);

        // 3. Eliminar el segundo abono -> saldo queda > 0 y revierte automáticamente a 'emitida'
        $secondPayment = InvoicePayment::where('reference', 'ZELLE-30PCT')->firstOrFail();
        $this->actingAs($user)->delete("/invoice-payments/{$secondPayment->id}")->assertRedirect();

        $invoice->refresh()->load('payments');
        $this->assertSame('emitida', $invoice->status);
        $this->assertEquals(700.00, $invoice->paid_amount_usd);
        $this->assertEquals(300.00, $invoice->balance_due_usd);

        // 4. Factura anulada rechaza nuevos abonos con error de validación
        $annulled = Invoice::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'correlative_number' => 'F-0000011',
            'issue_date' => '2026-11-11',
            'bcv_exchange_rate' => 880,
            'currency' => 'USD',
            'total_usd' => 250.00,
            'total_ves' => 220000.00,
            'status' => 'anulada',
        ]);

        $this->actingAs($user)->post("/invoices/{$annulled->id}/payments", [
            'payment_date' => '2026-11-12',
            'amount_usd' => 100.00,
            'payment_method' => 'EFECTIVO',
        ])->assertSessionHasErrors('amount_usd');

        $this->assertSame(0, $annulled->payments()->count());
    }

    public function test_backend_pagination_and_sql_search_filtering_in_dashboard(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        $comp1 = Company::create([
            'name' => 'Empresa Uno CA', 'tax_id' => 'J-11111111-1',
            'phone' => '+58 212 1111111', 'address' => 'Caracas', 'is_active' => true,
        ]);
        $comp2 = Company::create([
            'name' => 'Empresa Dos CA', 'tax_id' => 'J-22222222-2',
            'phone' => '+58 212 2222222', 'address' => 'Valencia', 'is_active' => true,
        ]);
        $clientVip = Client::create([
            'type' => 'empresa', 'name' => 'Cliente Excavaciones VIP',
            'tax_id' => 'J-90000001-0', 'phone' => '+58 414 0000001', 'is_active' => true,
        ]);
        $clientOther = Client::create([
            'type' => 'persona', 'name' => 'Juan Perez Regular',
            'tax_id' => 'V-12345678', 'phone' => '+58 412 0000002', 'is_active' => true,
        ]);

        // Crear 12 documentos regulares + 3 documentos específicos para búsqueda/filtros = 15 totales
        for ($i = 1; $i <= 12; $i++) {
            Invoice::create([
                'company_id' => $comp1->id,
                'client_id' => $clientOther->id,
                'user_id' => $user->id,
                'document_type' => 'factura',
                'correlative_number' => sprintf('F-%07d', $i),
                'issue_date' => '2026-11-01',
                'bcv_exchange_rate' => 880,
                'currency' => 'USD',
                'total_usd' => 100.00,
                'total_ves' => 88000.00,
                'status' => $i <= 5 ? 'pagada' : 'emitida',
            ]);
        }

        Invoice::create([
            'company_id' => $comp2->id, 'client_id' => $clientVip->id, 'user_id' => $user->id,
            'document_type' => 'proforma', 'correlative_number' => 'PROF-0000099',
            'issue_date' => '2026-11-10', 'bcv_exchange_rate' => 880, 'currency' => 'USD',
            'total_usd' => 5000.00, 'total_ves' => 4400000.00, 'status' => 'emitida',
        ]);
        Invoice::create([
            'company_id' => $comp2->id, 'client_id' => $clientVip->id, 'user_id' => $user->id,
            'document_type' => 'factura', 'correlative_number' => 'F-0000088',
            'issue_date' => '2026-11-11', 'bcv_exchange_rate' => 880, 'currency' => 'USD',
            'total_usd' => 250.00, 'total_ves' => 220000.00, 'status' => 'anulada',
        ]);
        Invoice::create([
            'company_id' => $comp1->id, 'client_id' => $clientOther->id, 'user_id' => $user->id,
            'document_type' => 'cotizacion', 'correlative_number' => 'BORR-000001',
            'issue_date' => '2026-11-12', 'bcv_exchange_rate' => 880, 'currency' => 'USD',
            'total_usd' => 300.00, 'total_ves' => 264000.00, 'status' => 'borrador',
        ]);

        // Página 1 debe traer exactamente 10 registros de un total de 15
        $page1 = $this->actingAs($user)->get('/')->viewData('page')['props'];
        $this->assertCount(10, $page1['invoices']['data']);
        $this->assertSame(15, $page1['invoices']['total']);
        $this->assertSame(2, $page1['invoices']['last_page']);
        $this->assertSame(5, $page1['statusCounts']['pagada']);
        $this->assertSame(1, $page1['statusCounts']['anulada']);
        $this->assertSame(1, $page1['statusCounts']['borrador']);

        // Página 2 debe traer los 5 registros restantes
        $page2 = $this->actingAs($user)->get('/?page=2')->viewData('page')['props'];
        $this->assertCount(5, $page2['invoices']['data']);
        $this->assertSame(2, $page2['invoices']['current_page']);

        // Búsqueda en SQL por nombre de cliente + filtro empresa/estado
        $filtered = $this->actingAs($user)->get('/?search=Excavaciones&company_id=' . $comp2->id . '&status=emitida')
            ->viewData('page')['props'];
        $this->assertCount(1, $filtered['invoices']['data']);
        $this->assertSame('PROF-0000099', $filtered['invoices']['data'][0]['correlative_number']);

        // Totales SQL globales: 12 facturas activas * $100 = $1200 ($500 cobrados, $700 por cobrar)
        $this->assertEquals(1200.00, (float) $page1['stats']['total_usd']);
        $this->assertEquals(500.00, (float) $page1['stats']['total_collected_usd']);
        $this->assertEquals(700.00, (float) $page1['stats']['total_receivable_usd']);
        $this->assertEquals(5000.00, (float) $page1['stats']['total_quoted_usd']);
    }

    public function test_sales_book_csv_export_filters_by_company_date_range_and_calculates_seniat_columns(): void
    {
        $user = User::factory()->create(['role' => 'admin', 'name' => 'Contadora Ana']);
        $comp1 = Company::create([
            'name' => 'Comercializadora A', 'tax_id' => 'J-10000001-1',
            'phone' => '+58 212 1000000', 'address' => 'Caracas', 'is_active' => true,
        ]);
        $comp2 = Company::create([
            'name' => 'Comercializadora B', 'tax_id' => 'J-20000002-2',
            'phone' => '+58 212 2000000', 'address' => 'Maracay', 'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'empresa', 'name' => 'Comprador Fiscal SRL',
            'tax_id' => 'J-30000003-3', 'phone' => '+58 414 3000000', 'is_active' => true,
        ]);

        // Factura 1 en Noviembre (Empresa 1): 1 ítem gravable $100 (IVA 16% = $16) + 1 ítem exento $50 => Total $166
        $invNov = Invoice::create([
            'company_id' => $comp1->id, 'client_id' => $client->id, 'user_id' => $user->id,
            'document_type' => 'factura', 'correlative_number' => 'F-0000101', 'control_number' => '00-000101',
            'issue_date' => '2026-11-10', 'bcv_exchange_rate' => 100, 'show_bs_conversion' => true,
            'currency' => 'USD', 'subtotal' => 150.00, 'tax_percentage' => 16.00, 'tax_amount' => 16.00,
            'total_usd' => 166.00, 'total_ves' => 16600.00, 'status' => 'emitida',
        ]);
        $invNov->items()->create([
            'item_order' => 1, 'description' => 'Repuesto gravado', 'quantity' => 1, 'unit' => 'unid',
            'unit_price' => 100, 'total' => 100, 'is_tax_exempt' => false,
        ]);
        $invNov->items()->create([
            'item_order' => 2, 'description' => 'Insumo exento', 'quantity' => 1, 'unit' => 'unid',
            'unit_price' => 50, 'total' => 50, 'is_tax_exempt' => true,
        ]);

        // Factura 2 ANULADA en Noviembre (Empresa 1) -> debe aparecer en secuencia con 0.00
        Invoice::create([
            'company_id' => $comp1->id, 'client_id' => $client->id, 'user_id' => $user->id,
            'document_type' => 'factura', 'correlative_number' => 'F-0000102', 'control_number' => '00-000102',
            'issue_date' => '2026-11-12', 'bcv_exchange_rate' => 100, 'show_bs_conversion' => true,
            'currency' => 'USD', 'total_usd' => 999.00, 'total_ves' => 99900.00, 'status' => 'anulada',
        ]);

        // Cotización y factura de Empresa 2 y factura de Octubre (NO deben salir en filtro Empresa 1 / Noviembre / Fiscal)
        Invoice::create([
            'company_id' => $comp1->id, 'client_id' => $client->id, 'user_id' => $user->id,
            'document_type' => 'cotizacion', 'correlative_number' => 'COT-0000001',
            'issue_date' => '2026-11-11', 'bcv_exchange_rate' => 100, 'currency' => 'USD',
            'total_usd' => 400.00, 'total_ves' => 40000.00, 'status' => 'emitida',
        ]);
        Invoice::create([
            'company_id' => $comp1->id, 'client_id' => $client->id, 'user_id' => $user->id,
            'document_type' => 'factura', 'correlative_number' => 'F-0000050',
            'issue_date' => '2026-10-15', 'bcv_exchange_rate' => 100, 'currency' => 'USD',
            'total_usd' => 200.00, 'total_ves' => 20000.00, 'status' => 'pagada',
        ]);
        Invoice::create([
            'company_id' => $comp2->id, 'client_id' => $client->id, 'user_id' => $user->id,
            'document_type' => 'factura', 'correlative_number' => 'F-0000201',
            'issue_date' => '2026-11-11', 'bcv_exchange_rate' => 100, 'currency' => 'USD',
            'total_usd' => 800.00, 'total_ves' => 80000.00, 'status' => 'pagada',
        ]);

        $response = $this->actingAs($user)->get(
            "/reports/sales-book?company_id={$comp1->id}&start_date=2026-11-01&end_date=2026-11-30&scope=fiscal&include_annulled=1&format=csv"
        );

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('content-type'));

        $csv = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('F-0000101', $csv);
        $this->assertStringContainsString('F-0000102', $csv);
        $this->assertStringContainsString('DOCUMENTO ANULADO', $csv);
        $this->assertStringContainsString('Contadora Ana', $csv);
        $this->assertStringContainsString('100.00', $csv);
        $this->assertStringContainsString('50.00', $csv);
        $this->assertStringContainsString('16.00', $csv);
        $this->assertStringContainsString('166.00', $csv);
        $this->assertStringContainsString('16600.00', $csv);
        $this->assertStringContainsString('TOTALES', $csv);

        // No debe incluir cotización, factura de octubre ni factura de empresa 2
        $this->assertStringNotContainsString('COT-0000001', $csv);
        $this->assertStringNotContainsString('F-0000050', $csv);
        $this->assertStringNotContainsString('F-0000201', $csv);
    }

    public function test_company_and_client_logical_archiving_preserves_invoice_history(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $comp1 = Company::create([
            'name' => 'Empresa Principal CA', 'tax_id' => 'J-11111111-1',
            'phone' => '+58 212 1111111', 'address' => 'Caracas', 'is_active' => true,
        ]);
        $comp2 = Company::create([
            'name' => 'Empresa Secundaria CA', 'tax_id' => 'J-22222222-2',
            'phone' => '+58 212 2222222', 'address' => 'Valencia', 'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'persona', 'name' => 'Cliente Archivo',
            'tax_id' => 'V-5555555', 'phone' => '+58 414 5555555', 'is_active' => true,
        ]);

        $invoice = Invoice::create([
            'company_id' => $comp2->id, 'client_id' => $client->id, 'user_id' => $admin->id,
            'document_type' => 'factura', 'correlative_number' => 'F-0000001',
            'issue_date' => '2026-11-11', 'bcv_exchange_rate' => 880, 'currency' => 'USD',
            'total_usd' => 120.00, 'total_ves' => 105600.00, 'status' => 'emitida',
        ]);

        // Archivar Empresa 2 y Cliente -> desactivación lógica manteniendo la factura
        $this->actingAs($admin)->delete("/companies/{$comp2->id}")->assertRedirect();
        $this->actingAs($admin)->delete("/clients/{$client->id}")->assertRedirect();

        $this->assertFalse($comp2->fresh()->is_active);
        $this->assertFalse($client->fresh()->is_active);
        $this->assertDatabaseHas('invoices', ['id' => $invoice->id, 'company_id' => $comp2->id, 'client_id' => $client->id]);

        // Intentar archivar la ÚLTIMA empresa emisora activa debe fallar validación
        $this->actingAs($admin)->delete("/companies/{$comp1->id}")->assertSessionHasErrors('company');
        $this->assertTrue($comp1->fresh()->is_active);

        // El directorio en '/' ya no lista la empresa/cliente archivados pero conserva la factura histórica
        $props = $this->actingAs($admin)->get('/')->viewData('page')['props'];
        $this->assertCount(1, $props['companies']);
        $this->assertCount(0, $props['clients']);
        $this->assertCount(1, $props['invoices']['data']);
    }

    public function test_ajax_invoice_query_and_audit_logs_endpoints_and_full_document_lifecycle_trail(): void
    {
        $user = User::factory()->create(['name' => 'Director CorpoAsia']);
        $company = Company::create([
            'name' => 'Corpo Asia CA', 'tax_id' => 'J-50123456-7',
            'phone' => '+58 212 0000000', 'address' => 'Caracas', 'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'persona', 'name' => 'Cliente Auditoria',
            'tax_id' => 'V-6666666', 'phone' => '+58 414 6666666', 'is_active' => true,
        ]);

        // La pantalla de gestión de usuarios fue eliminada (solo existe acceso por BD)
        $this->actingAs($user)->post('/users', [
            'name' => 'Otro', 'email' => 'otro@test.com', 'password' => '123456',
        ])->assertNotFound();

        $invoicePayloadBase = [
            'company_id' => $company->id, 'client_id' => $client->id,
            'issue_date' => '2026-11-11', 'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880, 'currency' => 'USD',
            'payment_method' => 'TRANSFERENCIA', 'tax_percentage' => 0,
            'items' => [[
                'description' => 'Maquinaria Demo', 'quantity' => 1, 'unit' => 'unid', 'unit_price' => 500, 'is_tax_exempt' => true,
            ]],
        ];

        // 1. Crear cotización, editarla, convertirla a factura, cobrar abono, anular y eliminar
        $this->actingAs($user)->post('/invoices', array_merge($invoicePayloadBase, [
            'document_type' => 'cotizacion',
        ]))->assertRedirect();
        $quote = Invoice::where('document_type', 'cotizacion')->firstOrFail();

        $this->actingAs($user)->put("/invoices/{$quote->id}", array_merge($invoicePayloadBase, [
            'document_type' => 'cotizacion',
            'items' => [[
                'description' => 'Maquinaria Demo', 'quantity' => 1, 'unit' => 'unid', 'unit_price' => 750, 'is_tax_exempt' => true,
            ]],
        ]))->assertRedirect();

        $this->actingAs($user)->post("/invoices/{$quote->id}/convert-to-invoice")->assertRedirect();
        $fiscalInv = Invoice::where('document_type', 'factura')->firstOrFail();

        $this->actingAs($user)->post("/invoices/{$fiscalInv->id}/payments", [
            'payment_date' => '2026-11-11', 'amount_usd' => 250, 'payment_method' => 'ZELLE',
        ])->assertRedirect();

        $this->actingAs($user)->patch("/invoices/{$fiscalInv->id}/status", ['status' => 'anulada'])->assertRedirect();
        $this->actingAs($user)->delete("/invoices/{$fiscalInv->id}")->assertRedirect();

        // Verificar que la bitácora conservó toda la trazabilidad
        $this->assertDatabaseHas('invoice_audit_logs', ['action' => 'created', 'user_id' => $user->id, 'correlative_number' => $quote->correlative_number]);
        $this->assertDatabaseHas('invoice_audit_logs', ['action' => 'updated', 'user_id' => $user->id, 'correlative_number' => $quote->correlative_number]);
        $this->assertDatabaseHas('invoice_audit_logs', ['action' => 'converted', 'user_id' => $user->id, 'correlative_number' => $fiscalInv->correlative_number]);
        $this->assertDatabaseHas('invoice_audit_logs', ['action' => 'payment_added', 'user_id' => $user->id, 'correlative_number' => $fiscalInv->correlative_number]);
        $this->assertDatabaseHas('invoice_audit_logs', ['action' => 'annulled', 'user_id' => $user->id, 'correlative_number' => $fiscalInv->correlative_number]);
        $this->assertDatabaseHas('invoice_audit_logs', ['action' => 'deleted', 'user_id' => $user->id, 'correlative_number' => $fiscalInv->correlative_number]);

        $deleteLog = InvoiceAuditLog::where('action', 'deleted')->where('correlative_number', $fiscalInv->correlative_number)->firstOrFail();
        $this->assertNull($deleteLog->invoice_id);

        // 2. Endpoint AJAX JSON del Libro de Ventas (/invoices/query) sin recarga de página
        $ajaxInvoices = $this->actingAs($user)->getJson("/invoices/query?search={$quote->correlative_number}&status=emitida");
        $ajaxInvoices->assertOk()
            ->assertJsonPath('statusCounts.todos', 1)
            ->assertJsonPath('invoices.data.0.correlative_number', $quote->correlative_number);

        // 3. Endpoint AJAX JSON de Auditoría (/audit-logs) con resumen y filtros
        $ajaxAudit = $this->actingAs($user)->getJson('/audit-logs?action=payments');
        $ajaxAudit->assertOk()
            ->assertJsonPath('summary.payments', 1)
            ->assertJsonPath('summary.annulled_deleted', 2)
            ->assertJsonCount(1, 'logs.data');
    }

    public function test_invoice_persists_global_and_per_item_product_image_visibility_flags(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Corpo Asia CA', 'tax_id' => 'J-50123456-7',
            'phone' => '+58 212 0000000', 'address' => 'Caracas', 'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'persona', 'name' => 'Cliente Imagenes',
            'tax_id' => 'V-8888888', 'phone' => '+58 414 8888888', 'is_active' => true,
        ]);

        // Crear factura ocultando imágenes globalmente y con ítem 2 también marcado show_image = false
        $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880,
            'currency' => 'USD',
            'payment_method' => 'PAGO MOVIL',
            'tax_percentage' => 16,
            'show_item_images' => false,
            'items' => [
                [
                    'description' => 'Item 1 con foto visible', 'quantity' => 1, 'unit' => 'unid',
                    'unit_price' => 100, 'is_tax_exempt' => false, 'image_url' => '/storage/products/demo1.png', 'show_image' => true,
                ],
                [
                    'description' => 'Item 2 con foto oculta', 'quantity' => 1, 'unit' => 'unid',
                    'unit_price' => 200, 'is_tax_exempt' => false, 'image_url' => '/storage/products/demo2.png', 'show_image' => false,
                ],
            ],
        ])->assertRedirect();

        $invoice = Invoice::with('items')->latest('id')->firstOrFail();
        $this->assertFalse($invoice->technical_specs['show_item_images']);
        $this->assertSame([2], $invoice->technical_specs['hidden_image_orders']);
        $this->assertSame('/storage/products/demo1.png', $invoice->items[0]->image_url);
        $this->assertSame('/storage/products/demo2.png', $invoice->items[1]->image_url);

        // Al actualizar activando show_item_images = true y mostrando ambos, se limpia hidden_image_orders
        $this->actingAs($user)->put("/invoices/{$invoice->id}", [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880,
            'currency' => 'USD',
            'payment_method' => 'PAGO MOVIL',
            'tax_percentage' => 16,
            'show_item_images' => true,
            'items' => [
                [
                    'description' => 'Item 1', 'quantity' => 1, 'unit' => 'unid',
                    'unit_price' => 100, 'is_tax_exempt' => false, 'image_url' => '/storage/products/demo1.png', 'show_image' => true,
                ],
                [
                    'description' => 'Item 2', 'quantity' => 1, 'unit' => 'unid',
                    'unit_price' => 200, 'is_tax_exempt' => false, 'image_url' => '/storage/products/demo2.png', 'show_image' => true,
                ],
            ],
        ])->assertRedirect();

        $invoice->refresh();
        $this->assertTrue($invoice->technical_specs['show_item_images']);
        $this->assertSame([], $invoice->technical_specs['hidden_image_orders']);
    }

    public function test_sales_book_exports_real_xlsx_and_optional_csv_with_totals(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Corpo Asia CA',
            'tax_id' => 'J-50123456-7',
            'phone' => '+58 212 0000000',
            'address' => 'Caracas',
            'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'empresa',
            'name' => 'Cliente Export XLSX',
            'tax_id' => 'J-40112233-9',
            'phone' => '+58 414 1112233',
            'is_active' => true,
        ]);

        Invoice::create([
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'correlative_number' => 'F-0000050',
            'control_number' => '00-000050',
            'issue_date' => '2026-11-11',
            'bcv_exchange_rate' => 880,
            'show_bs_conversion' => true,
            'currency' => 'USD',
            'subtotal' => 100.00,
            'tax_percentage' => 16,
            'tax_amount' => 16.00,
            'total_usd' => 116.00,
            'total_ves' => 102080.00,
            'status' => 'emitida',
        ]);

        // 1. Exportación por defecto en Excel real (.xlsx via OpenSpout)
        $xlsxResponse = $this->actingAs($user)->get('/reports/sales-book?scope=fiscal');
        $xlsxResponse->assertStatus(200);
        $this->assertStringContainsString(
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            (string) $xlsxResponse->headers->get('Content-Type')
        );
        $this->assertStringContainsString('.xlsx', (string) $xlsxResponse->headers->get('Content-Disposition'));

        $filePath = $xlsxResponse->baseResponse->getFile()->getPathname();
        $this->assertSame('PK', substr((string) file_get_contents($filePath), 0, 2));
        @unlink($filePath);

        // 2. Exportación explícita en CSV UTF-8
        $csvResponse = $this->actingAs($user)->get('/reports/sales-book?scope=fiscal&format=csv');
        $csvResponse->assertStatus(200);
        $csvContent = $csvResponse->streamedContent();
        $this->assertStringContainsString('F-0000050', $csvContent);
        $this->assertStringContainsString('TOTALES', $csvContent);
    }

    public function test_invoice_pdf_endpoint_renders_classic_and_modern_templates_via_dompdf(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Inversiones CorpoAsia CA',
            'tax_id' => 'J-50123456-7',
            'phone' => '+58 212 0000000',
            'address' => 'Caracas, Venezuela',
            'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'empresa',
            'name' => 'Agroindustrial Oriente CA',
            'tax_id' => 'J-30998877-6',
            'phone' => '+58 414 2223344',
            'address' => 'Valencia',
            'is_active' => true,
        ]);

        $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'proforma',
            'pdf_format' => 'formato-2',
            'issue_date' => '2026-11-11',
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880,
            'show_bs_conversion' => false,
            'currency' => 'USD',
            'payment_method' => 'TRANSFERENCIA',
            'tax_percentage' => 0,
            'technical_specs' => [
                ['category' => 'Motor', 'name' => 'Potencia', 'value' => '138 HP'],
            ],
            'items' => [[
                'description' => 'Excavadora CAT 320C L',
                'details' => 'Año 2021',
                'quantity' => 1,
                'unit' => 'unid',
                'unit_price' => 45000,
                'is_tax_exempt' => true,
                'show_image' => true,
            ]],
        ])->assertRedirect();

        $invoice = Invoice::latest('id')->firstOrFail();
        $this->assertSame('formato-2', $invoice->technical_specs['pdf_format']);

        $classicPdf = $this->actingAs($user)->get("/invoices/{$invoice->id}/pdf?format=formato-1");
        $classicPdf->assertStatus(200);
        $this->assertStringContainsString('application/pdf', (string) $classicPdf->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $classicPdf->getContent());

        $modernPdf = $this->actingAs($user)->get("/invoices/{$invoice->id}/pdf?format=formato-2");
        $modernPdf->assertStatus(200);
        $this->assertStringContainsString('application/pdf', (string) $modernPdf->headers->get('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $modernPdf->getContent());
    }

    public function test_image_optimizer_resizes_and_stores_uploaded_and_base64_images(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();

        // Subir imagen sobredimensionada de producto (1800x1200) -> debe redimensionarse a <= 1000px
        $largePhoto = UploadedFile::fake()->image('excavadora.jpg', 1800, 1200);

        $this->actingAs($user)->post('/products', [
            'name' => 'Cargador Frontal 950H',
            'unit' => 'unid',
            'unit_price' => 38000,
            'image' => $largePhoto,
        ])->assertRedirect();

        $product = Product::where('name', 'Cargador Frontal 950H')->firstOrFail();
        $this->assertNotNull($product->image_url);
        $this->assertStringStartsWith('/storage/products/', $product->image_url);

        $relativePath = ltrim(str_replace('/storage/', '', $product->image_url), '/');
        Storage::disk('public')->assertExists($relativePath);

        $savedBytes = Storage::disk('public')->get($relativePath);
        $dims = @getimagesizefromstring($savedBytes);
        $this->assertIsArray($dims);
        $this->assertLessThanOrEqual(1000, $dims[0]);
        $this->assertLessThanOrEqual(1000, $dims[1]);

        @unlink(public_path(ltrim($product->image_url, '/')));
    }

    public function test_dashboard_provides_monthly_revenue_and_top_products_chart_data(): void
    {
        $user = User::factory()->create();
        $company = Company::create([
            'name' => 'Corpo Asia CA',
            'tax_id' => 'J-50123456-7',
            'phone' => '+58 212 0000000',
            'address' => 'Caracas',
            'is_active' => true,
        ]);
        $client = Client::create([
            'type' => 'empresa',
            'name' => 'Cliente Gráficas CA',
            'tax_id' => 'J-30111222-3',
            'phone' => '+58 412 0000000',
            'is_active' => true,
        ]);
        $product = Product::create([
            'name' => 'Generador Eléctrico 30KVA',
            'unit' => 'unid',
            'unit_price' => 5000,
            'is_active' => true,
        ]);

        $todayCaracas = now('America/Caracas')->format('Y-m-d');
        $currentYm = now('America/Caracas')->format('Y-m');

        $this->actingAs($user)->post('/invoices', [
            'company_id' => $company->id,
            'client_id' => $client->id,
            'document_type' => 'factura',
            'status' => 'pagada',
            'issue_date' => $todayCaracas,
            'sale_condition' => 'Contado',
            'bcv_exchange_rate' => 880,
            'currency' => 'USD',
            'payment_method' => 'ZELLE',
            'tax_percentage' => 0,
            'items' => [[
                'product_id' => $product->id,
                'description' => $product->name,
                'quantity' => 2,
                'unit' => 'unid',
                'unit_price' => 5000,
                'is_tax_exempt' => true,
            ]],
        ])->assertRedirect();

        $props = $this->actingAs($user)->get('/')->viewData('page')['props'];
        $chartData = $props['chartData'] ?? [];

        $this->assertCount(6, $chartData['monthly_revenue']);
        $currentMonthBucket = collect($chartData['monthly_revenue'])->firstWhere('key', $currentYm);
        $this->assertNotNull($currentMonthBucket);
        $this->assertEquals(10000.0, (float) $currentMonthBucket['facturado']);
        $this->assertEquals(10000.0, (float) $currentMonthBucket['cobrado']);

        $this->assertNotEmpty($chartData['top_products']);
        $topItem = collect($chartData['top_products'])->firstWhere('full_name', $product->name);
        $this->assertNotNull($topItem);
        $this->assertEquals(10000.0, (float) $topItem['vendido_usd']);
        $this->assertEquals(2.0, (float) $topItem['unidades']);
    }
}

