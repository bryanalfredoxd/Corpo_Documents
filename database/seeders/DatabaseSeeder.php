<?php

namespace Database\Seeders;

use App\Models\Client;
use App\Models\Company;
use App\Models\CompanyBankAccount;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with sample data based on real PDFs.
     */
    public function run(): void
    {
        // 1. Usuario Administrador
        $user = User::firstOrCreate(
            ['email' => 'admin@corpoasia.com'],
            [
                'name' => 'Administrador Fiscal',
                'password' => Hash::make('password123'),
            ]
        );

        // 2. Empresa 1: AGROSUMINISTROS RODRÍGUEZ C.A. (Extraída de Factura F-0000003.pdf)
        $agroCompany = Company::create([
            'name' => 'AGROSUMINISTROS RODRÍGUEZ C.A.',
            'trade_name' => 'Agrosuministros Rodríguez',
            'tax_id' => 'J-50493821-4',
            'logo_path' => 'companies/logos/agrosuministros.svg',
            'address' => 'Barinitas, Estado Barinas, Venezuela',
            'city' => 'Barinitas',
            'state' => 'Barinas',
            'country' => 'Venezuela',
            'phone' => '+58 412-9614615',
            'phone_secondary' => '+58 412-9614615',
            'email' => 'fitnessbigworld@gmail.com',
            'website' => null,
            'invoice_prefix' => 'F-',
            'next_correlative' => 4,
            'next_control_number' => 4,
            'default_terms' => 'Comprobante generado por el sistema de Agrosuministros Rodríguez C.A. Para devoluciones o reclamos de insumos agrícolas o pecuarios, conserve este documento. Plazo máximo de reclamación: 3 días hábiles desde la fecha de emisión.',
            'default_payment_terms' => 'Venta de Contado mediante Pago Móvil o Transferencia bancaria inmediata.',
            'is_active' => true,
        ]);

        CompanyBankAccount::create([
            'company_id' => $agroCompany->id,
            'bank_name' => 'Banco de Venezuela',
            'account_number' => '0102-0451-22-0001928374',
            'account_type' => 'Pago Móvil / Corriente',
            'holder_name' => 'Agrosuministros Rodríguez C.A.',
            'holder_tax_id' => 'J-50493821-4',
            'phone' => '+58 412-9614615',
            'email' => 'fitnessbigworld@gmail.com',
        ]);

        // 3. Empresa 2: MOAIVEN GROUP C.A. (Extraída de Proforma CAT 320CL Moaiven.pdf)
        $moaivenCompany = Company::create([
            'name' => 'MOAIVEN GROUP C.A. · IMPORT & LOGISTICS',
            'trade_name' => 'Moaiven Logística Internacional China - Vzla',
            'tax_id' => 'J-507874141',
            'logo_path' => 'companies/logos/moaiven.svg',
            'address' => 'Santa Mónica, Calle Teresa Carreño, Quinta Felc, 8-A, Caracas, Venezuela',
            'city' => 'Caracas',
            'state' => 'Distrito Capital',
            'country' => 'Venezuela',
            'phone' => '+58 412-0838732',
            'phone_secondary' => '+58 414-7579116',
            'email' => 'Moaiven.logistic@gmail.com',
            'website' => 'TikTok: @moaiven.logistic',
            'invoice_prefix' => 'PROF-',
            'next_correlative' => 2,
            'next_control_number' => 2,
            'default_terms' => 'Condiciones de envío: Tiempo de carga: una vez confirmada la compra del equipo en China, el mismo cuenta con un plazo de hasta veinte (20) días hábiles para ser cargado en puerto, sujeto a disponibilidad de espacio naviero.',
            'default_payment_terms' => "70% al momento de firmar el contrato, para iniciar verificación, compra y proceso de envío.\n30% 15 días antes de la llegada del equipo al puerto de destino en Venezuela.",
            'is_active' => true,
        ]);

        CompanyBankAccount::create([
            'company_id' => $moaivenCompany->id,
            'bank_name' => 'Banesco Banco Universal',
            'account_number' => '0134-0012-91-0003849102',
            'account_type' => 'Cuenta Corriente Moneda Nacional / USD',
            'holder_name' => 'Moaiven Group C.A.',
            'holder_tax_id' => 'J-507874141',
            'phone' => '+58 412-0838732',
            'email' => 'Moaiven.logistic@gmail.com',
        ]);

        // 4. Empresa 3: CORPO ASIA SYSTEMS, C.A.
        $corpoCompany = Company::create([
            'name' => 'CORPO ASIA SYSTEMS, C.A.',
            'trade_name' => 'Corpo Asia Logistics',
            'tax_id' => 'J-50123998-0',
            'logo_path' => 'companies/logos/corpoasia.svg',
            'address' => 'Av. Francisco de Miranda, Torre Empresarial, Piso 12, Ofic. 12-A, Caracas',
            'city' => 'Caracas',
            'state' => 'Miranda',
            'country' => 'Venezuela',
            'phone' => '+58 212 999 8888',
            'phone_secondary' => '+58 414 123 4567',
            'email' => 'facturacion@corpoasia.com',
            'website' => 'www.corpoasia.com',
            'invoice_prefix' => 'F-',
            'next_correlative' => 3892,
            'next_control_number' => 89124,
            'default_terms' => 'Documento con validez tributaria y legal según providencias del SENIAT.',
            'default_payment_terms' => 'Crédito 15 días a partir de la fecha de recepción de la factura.',
            'is_active' => true,
        ]);

        // 5. Clientes / Adquirientes
        $clientBryan = Client::create([
            'type' => 'persona',
            'name' => 'Bryan Moreno',
            'tax_id' => 'V-29923421',
            'email' => 'bryan.moreno@gmail.com',
            'phone' => '+584242438916',
            'address' => 'Barinitas, Estado Barinas, Venezuela',
            'contact_person' => 'Bryan Moreno',
            'notes' => 'Cliente frecuente de insumos agrícolas.',
            'is_active' => true,
        ]);

        $clientInversiones = Client::create([
            'type' => 'empresa',
            'name' => 'Inversiones & Logística Corpo Asia, C.A.',
            'tax_id' => 'J-50192834-1',
            'email' => 'administracion@corpoasia.com',
            'phone' => '+58 (212) 740-9100',
            'address' => 'Av. Libertador, Edif. Torre Financiera, Piso 14, Chacao, Miranda',
            'contact_person' => 'Carlos Eduardo Mendoza',
            'notes' => 'Contribuyente Especial. Facturación de maquinaria y servicios.',
            'is_active' => true,
        ]);

        $clientAgro = Client::create([
            'type' => 'empresa',
            'name' => 'Distribuidora Agroindustrial El Roble, S.A.',
            'tax_id' => 'J-31294819-0',
            'email' => 'pagos@elrobleagro.com',
            'phone' => '+58 (241) 823-4411',
            'address' => 'Zona Industrial Sur II, Parcela 45, Valencia, Carabobo',
            'contact_person' => 'Ing. Roberto Gómez',
            'notes' => 'Sector agropecuario y fertilizantes.',
            'is_active' => true,
        ]);

        // 6. Factura F-0000003 (Clon exacto de Agrosuministros Rodríguez C.A.)
        $invoiceAgro = Invoice::create([
            'company_id' => $agroCompany->id,
            'client_id' => $clientBryan->id,
            'user_id' => $user->id,
            'document_type' => 'factura',
            'correlative_number' => 'F-0000003',
            'control_number' => '00-000003',
            'order_number' => '#3',
            'issue_date' => '2026-10-10 10:17:00',
            'due_date' => '2026-10-10',
            'offer_validity_days' => null,
            'sale_condition' => 'Venta de Contado',
            'sales_channel' => 'Tienda en Línea',
            'bcv_exchange_rate' => 876.8000,
            'currency' => 'USD',
            'payment_method' => 'PAGO MOVIL',
            'payment_reference' => 'Ref: 161773827',
            'subtotal' => 75.00,
            'shipping_cost' => 10.00,
            'discount' => 0.00,
            'tax_percentage' => 16.00,
            'tax_amount' => 22.00,
            'total_usd' => 97.00,
            'total_ves' => 85049.37,
            'terms_conditions' => $agroCompany->default_terms,
            'status' => 'emitida',
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoiceAgro->id,
            'item_order' => 1,
            'description' => 'alimento agrícola',
            'details' => 'Saco de alimento de alta calidad para producción pecuaria',
            'quantity' => 5.00,
            'unit' => 'saco',
            'unit_price' => 15.00,
            'total' => 75.00,
            'is_tax_exempt' => false,
        ]);

        // 7. Proforma (Clon exacto de Moaiven Group C.A. - Maquinaria Caterpillar)
        $invoiceMoaiven = Invoice::create([
            'company_id' => $moaivenCompany->id,
            'client_id' => $clientInversiones->id,
            'user_id' => $user->id,
            'document_type' => 'proforma',
            'document_subtitle' => 'LÍNEA MÁQUINAS',
            'correlative_number' => 'PROF-0000001',
            'control_number' => '00-000001',
            'order_number' => 'COT-2026-99',
            'issue_date' => '2026-11-04 09:30:00',
            'due_date' => '2026-11-19',
            'offer_validity_days' => 15,
            'sale_condition' => 'Condición DDP (Entregado en Destino, Venezuela)',
            'sales_channel' => 'Importación Directa China',
            'bcv_exchange_rate' => 876.8000,
            'currency' => 'USD',
            'payment_method' => 'TRANSFERENCIA INTERNACIONAL / DIVISAS',
            'payment_reference' => 'Hitos 70% / 30%',
            'subtotal' => 54000.00,
            'shipping_cost' => 0.00,
            'discount' => 0.00,
            'tax_percentage' => 0.00,
            'tax_amount' => 0.00,
            'total_usd' => 54000.00,
            'total_ves' => 47347200.00,
            'delivery_address' => 'Patio Industrial Puerto Cabello / Destino Cliente',
            'payment_terms_notes' => "70% (USD 37,800) — Al momento de firmar el contrato, para iniciar la verificación, compra del equipo y proceso de envío.\n30% (USD 16,200) — 15 días antes de la llegada del equipo al puerto de destino en Venezuela.",
            'shipping_terms_notes' => 'Tiempo de carga: una vez confirmada la compra del equipo en China, el mismo cuenta con un plazo de hasta veinte (20) días hábiles para ser cargado en puerto, sujeto a disponibilidad de espacio naviero.',
            'terms_conditions' => 'Validez de la oferta: 15 días calendario.',
            'technical_specs' => [
                'equipo' => 'CATERPILLAR 320C L — Excavadora sobre orugas',
                'motor' => 'Mitsubishi 3066 TAA, diésel turboalimentado',
                'potencia' => '103 kW (138 HP)',
                'peso_operativo' => '20,800 kg (20.8 toneladas)',
                'capacidad_cucharon' => '1.2 m³',
                'profundidad_maxima' => '6.11 m',
                'motor_giro' => 'Kawasaki M5X130CHB-11A (N° parte CAT 158-8986)',
                'bomba_hidraulica' => 'Kawasaki AP12S (N° parte CAT 173-3381)',
                'dimensiones' => '9.42 × 2.98 × 3.01 m',
                'ancho_oruga' => '600 mm',
                'emisiones' => 'Cumple Tier 1 a nivel mundial',
                'origen' => 'Made in Japan (Shin Caterpillar Mitsubishi)',
            ],
            'status' => 'emitida',
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoiceMoaiven->id,
            'item_order' => 1,
            'description' => 'Equipo (FOB China)',
            'details' => 'CATERPILLAR 320C L — Excavadora sobre orugas',
            'quantity' => 1.00,
            'unit' => 'unid',
            'unit_price' => 29000.00,
            'total' => 29000.00,
            'is_tax_exempt' => true,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoiceMoaiven->id,
            'item_order' => 2,
            'description' => 'Flete y seguro internacional marítimo',
            'details' => 'Transporte multimodal marítimo desde puerto en China hasta Venezuela',
            'quantity' => 1.00,
            'unit' => 'servicio',
            'unit_price' => 10000.00,
            'total' => 10000.00,
            'is_tax_exempt' => true,
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoiceMoaiven->id,
            'item_order' => 3,
            'description' => 'Nacionalización y aduana en Venezuela',
            'details' => 'Gestión de desaduanamiento, aranceles y nacionalización en puerto',
            'quantity' => 1.00,
            'unit' => 'servicio',
            'unit_price' => 15000.00,
            'total' => 15000.00,
            'is_tax_exempt' => true,
        ]);
    }
}
