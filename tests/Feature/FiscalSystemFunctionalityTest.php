<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Company;
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
}

