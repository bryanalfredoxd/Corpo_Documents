<?php

use App\Http\Controllers\BcvController;
use App\Http\Controllers\ClientCategoryController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\CompanyBankAccountController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ConsignmentController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\InvoicePaymentController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Models\Client;
use App\Models\ClientCategory;
use App\Models\Company;
use App\Models\Consignment;
use App\Models\Invoice;
use App\Models\Product;
use App\Services\BcvExchangeRateService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::get('/', function (Request $request) {
        $companies = Company::with('bankAccounts')->where('is_active', true)->get();
        $clients = Client::where('is_active', true)->orderBy('name')->get();
        $clientCategories = collect();
        if (Schema::hasTable('client_categories')) {
            $clientCategories = ClientCategory::where('is_active', true)->orderBy('name')->get();
        }

        $paginatedResult = InvoiceController::queryPaginatedInvoices($request);
        $auditResult = InvoiceController::queryAuditLogs(new Request());

        $products = collect();
        if (Schema::hasTable('products')) {
            $products = Product::where('is_active', true)->orderBy('name')->get();
            if (Schema::hasColumn('invoice_items', 'product_id')) {
                // Métricas de uso segmentadas por tipo de documento / modalidad PDF
                $usageStats = DB::table('invoice_items')
                    ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
                    ->whereNotNull('invoice_items.product_id')
                    ->whereNotIn('invoices.status', ['anulada'])
                    ->select(
                        'invoice_items.product_id',
                        // Facturas fiscales / comerciales (Ventas formales emitidas o pagadas)
                        DB::raw("SUM(CASE WHEN invoices.document_type = 'factura' AND invoices.status IN ('emitida', 'pagada') THEN invoice_items.quantity ELSE 0 END) as invoiced_units"),
                        DB::raw("SUM(CASE WHEN invoices.document_type = 'factura' AND invoices.status IN ('emitida', 'pagada') THEN invoice_items.total ELSE 0 END) as invoiced_revenue"),
                        
                        // Notas de Entrega a Consignación (despachadas bajo modalidad consignación)
                        DB::raw("SUM(CASE WHEN invoices.document_type = 'nota_entrega' AND (invoices.sale_condition = 'Consignación' OR LOWER(COALESCE(invoices.payment_terms_notes, '')) LIKE '%consignac%') AND invoices.status IN ('emitida', 'pagada', 'borrador') THEN invoice_items.quantity ELSE 0 END) as consigned_delivery_units"),
                        
                        // Notas de Entrega ordinarias (despacho / entrega simple)
                        DB::raw("SUM(CASE WHEN invoices.document_type = 'nota_entrega' AND invoices.sale_condition != 'Consignación' AND LOWER(COALESCE(invoices.payment_terms_notes, '')) NOT LIKE '%consignac%' AND invoices.status IN ('emitida', 'pagada') THEN invoice_items.quantity ELSE 0 END) as delivered_units"),
                        
                        // Cotizaciones
                        DB::raw("SUM(CASE WHEN invoices.document_type = 'cotizacion' AND invoices.status != 'borrador' THEN invoice_items.quantity ELSE 0 END) as quoted_units"),
                        
                        // Proformas
                        DB::raw("SUM(CASE WHEN invoices.document_type = 'proforma' AND invoices.status != 'borrador' THEN invoice_items.quantity ELSE 0 END) as proforma_units")
                    )
                    ->groupBy('invoice_items.product_id')
                    ->get()
                    ->keyBy('product_id');

                $custodyStats = collect();
                if (Schema::hasTable('consignments')) {
                    $custodyStats = DB::table('consignments')
                        ->whereNotNull('product_id')
                        ->whereNotIn('status', ['devuelta', 'liquidada_total'])
                        ->select('product_id', DB::raw('SUM(current_quantity) as active_custody_units'))
                        ->groupBy('product_id')
                        ->get()
                        ->keyBy('product_id');
                }

                $products->each(function ($prod) use ($usageStats, $custodyStats) {
                    $stats = $usageStats->get($prod->id);
                    $custody = $custodyStats->get($prod->id);

                    $invoicedUnits = (float) ($stats->invoiced_units ?? 0);
                    $invoicedRevenue = (float) ($stats->invoiced_revenue ?? 0);
                    $activeCustody = (float) ($custody->active_custody_units ?? 0);
                    $consignedDelivery = (float) ($stats->consigned_delivery_units ?? 0);
                    $consignedUnits = $activeCustody > 0 ? $activeCustody : $consignedDelivery;
                    $deliveredUnits = (float) ($stats->delivered_units ?? 0);
                    $quotedUnits = (float) ($stats->quoted_units ?? 0);
                    $proformaUnits = (float) ($stats->proforma_units ?? 0);

                    $prod->invoiced_units = $invoicedUnits;
                    $prod->invoiced_revenue = $invoicedRevenue;
                    $prod->consigned_units = $consignedUnits;
                    $prod->consigned_active_units = $activeCustody;
                    $prod->consigned_delivery_units = $consignedDelivery;
                    $prod->delivered_units = $deliveredUnits;
                    $prod->quoted_units = $quotedUnits;
                    $prod->proforma_units = $proformaUnits;

                    // Compatibilidad con código previo y pruebas
                    $prod->sold_units = $invoicedUnits;
                    $prod->sold_revenue = $invoicedRevenue;
                });
            }
        }

        // Métricas contables globales calculadas directamente en MySQL con SUM() / COUNT()
        if (Schema::hasTable('invoice_payments')) {
            $paymentsSub = DB::table('invoice_payments')
                ->select('invoice_id', DB::raw('SUM(amount_usd) as paid_sum'))
                ->groupBy('invoice_id');

            $fiscalAgg = Invoice::query()
                ->leftJoinSub($paymentsSub, 'ip', 'invoices.id', '=', 'ip.invoice_id')
                ->where('invoices.document_type', 'factura')
                ->whereNotIn('invoices.status', ['anulada', 'borrador'])
                ->selectRaw('
                    COUNT(*) as fiscal_count,
                    COALESCE(SUM(invoices.total_usd), 0) as total_usd,
                    COALESCE(SUM(
                        CASE
                            WHEN COALESCE(ip.paid_sum, 0) > 0 THEN ip.paid_sum
                            WHEN invoices.status = ? THEN invoices.total_usd
                            ELSE 0
                        END
                    ), 0) as total_collected_usd,
                    COALESCE(SUM(
                        CASE
                            WHEN invoices.status = ? THEN 0
                            WHEN invoices.total_usd - COALESCE(ip.paid_sum, 0) > 0
                                THEN invoices.total_usd - COALESCE(ip.paid_sum, 0)
                            ELSE 0
                        END
                    ), 0) as total_receivable_usd
                ', ['pagada', 'pagada'])
                ->first();

            $totalFacturadoUsd = round((float) ($fiscalAgg->total_usd ?? 0), 2);
            $totalCobradoUsd = round((float) ($fiscalAgg->total_collected_usd ?? 0), 2);
            $totalPorCobrarUsd = round((float) ($fiscalAgg->total_receivable_usd ?? 0), 2);
            $fiscalCount = (int) ($fiscalAgg->fiscal_count ?? 0);
        } else {
            $fiscalAgg = Invoice::where('document_type', 'factura')
                ->whereNotIn('status', ['anulada', 'borrador'])
                ->selectRaw('
                    COUNT(*) as fiscal_count,
                    COALESCE(SUM(total_usd), 0) as total_usd,
                    COALESCE(SUM(CASE WHEN status = ? THEN total_usd ELSE 0 END), 0) as total_collected_usd,
                    COALESCE(SUM(CASE WHEN status != ? THEN total_usd ELSE 0 END), 0) as total_receivable_usd
                ', ['pagada', 'pagada'])
                ->first();

            $totalFacturadoUsd = round((float) ($fiscalAgg->total_usd ?? 0), 2);
            $totalCobradoUsd = round((float) ($fiscalAgg->total_collected_usd ?? 0), 2);
            $totalPorCobrarUsd = round((float) ($fiscalAgg->total_receivable_usd ?? 0), 2);
            $fiscalCount = (int) ($fiscalAgg->fiscal_count ?? 0);
        }

        $quotesAgg = Invoice::whereIn('document_type', ['proforma', 'cotizacion'])
            ->whereNotIn('status', ['anulada', 'borrador'])
            ->selectRaw('COUNT(*) as quotes_count, COALESCE(SUM(total_usd), 0) as total_quoted_usd')
            ->first();

        $stats = [
            'total_usd' => $totalFacturadoUsd,
            'total_receivable_usd' => $totalPorCobrarUsd,
            'total_collected_usd' => $totalCobradoUsd,
            'total_quoted_usd' => round((float) ($quotesAgg->total_quoted_usd ?? 0), 2),
            'invoices_count' => Invoice::count(),
            'fiscal_invoices_count' => $fiscalCount,
            'quotes_count' => (int) ($quotesAgg->quotes_count ?? 0),
            'companies_count' => $companies->count(),
            'clients_count' => $clients->count(),
            'products_count' => $products->count(),
        ];

        $monthNamesEs = [
            1 => 'Ene', 2 => 'Feb', 3 => 'Mar', 4 => 'Abr', 5 => 'May', 6 => 'Jun',
            7 => 'Jul', 8 => 'Ago', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dic',
        ];
        $nowCaracas = now('America/Caracas');
        $monthlyBuckets = [];
        for ($i = 5; $i >= 0; $i--) {
            $dt = $nowCaracas->copy()->startOfMonth()->subMonths($i);
            $key = $dt->format('Y-m');
            $monthlyBuckets[$key] = [
                'key' => $key,
                'month' => $monthNamesEs[(int) $dt->format('n')] . ' ' . $dt->format('y'),
                'facturado' => 0.0,
                'cobrado' => 0.0,
                'por_cobrar' => 0.0,
            ];
        }

        $windowStart = $nowCaracas->copy()->startOfMonth()->subMonths(5)->format('Y-m-d');
        $chartInvoicesQuery = Invoice::query()
            ->where('invoices.document_type', 'factura')
            ->whereNotIn('invoices.status', ['anulada', 'borrador'])
            ->whereDate('invoices.issue_date', '>=', $windowStart);

        if (Schema::hasTable('invoice_payments')) {
            $chartPaymentsSub = DB::table('invoice_payments')
                ->select('invoice_id', DB::raw('SUM(amount_usd) as paid_sum'))
                ->groupBy('invoice_id');
            $chartRows = $chartInvoicesQuery
                ->leftJoinSub($chartPaymentsSub, 'ip', 'invoices.id', '=', 'ip.invoice_id')
                ->get(['invoices.issue_date', 'invoices.total_usd', 'invoices.status', DB::raw('COALESCE(ip.paid_sum, 0) as paid_sum')]);
        } else {
            $chartRows = $chartInvoicesQuery
                ->get(['invoices.issue_date', 'invoices.total_usd', 'invoices.status'])
                ->each(fn ($r) => $r->paid_sum = 0);
        }

        foreach ($chartRows as $row) {
            if (! $row->issue_date) {
                continue;
            }
            $ym = $row->issue_date->format('Y-m');
            if (! isset($monthlyBuckets[$ym])) {
                continue;
            }
            $total = (float) $row->total_usd;
            $paidSum = (float) ($row->paid_sum ?? 0);
            $collected = $paidSum > 0 ? $paidSum : ($row->status === 'pagada' ? $total : 0.0);
            $receivable = $row->status === 'pagada' ? 0.0 : max(0.0, $total - $paidSum);

            $monthlyBuckets[$ym]['facturado'] = round($monthlyBuckets[$ym]['facturado'] + $total, 2);
            $monthlyBuckets[$ym]['cobrado'] = round($monthlyBuckets[$ym]['cobrado'] + $collected, 2);
            $monthlyBuckets[$ym]['por_cobrar'] = round($monthlyBuckets[$ym]['por_cobrar'] + $receivable, 2);
        }

        $topProducts = $products
            ->filter(fn ($p) => ($p->sold_units ?? 0) > 0 || ($p->quoted_units ?? 0) > 0)
            ->sortByDesc(fn ($p) => (($p->sold_revenue ?? 0) * 1000) + ($p->quoted_units ?? 0))
            ->take(5)
            ->values()
            ->map(fn ($p) => [
                'name' => \Illuminate\Support\Str::limit($p->name, 22),
                'full_name' => $p->name,
                'vendido_usd' => round((float) ($p->sold_revenue ?? 0), 2),
                'unidades' => round((float) ($p->sold_units ?? 0), 2),
                'cotizadas' => round((float) ($p->quoted_units ?? 0), 2),
            ]);

        $chartData = [
            'monthly_revenue' => array_values($monthlyBuckets),
            'top_products' => $topProducts,
        ];

        $consignments = collect();
        $consignmentStats = [
            'total_items_in_custody' => 0,
            'active_consignments_count' => 0,
            'active_clients_count' => 0,
            'total_base_value' => 0,
            'total_suggested_value' => 0,
        ];
        if (Schema::hasTable('consignments')) {
            $consignments = Consignment::with([
                'client:id,name,tax_id,category,phone,email,address',
                'product:id,code,name,image_url,stock,unit',
                'company:id,name,tax_id',
                'initialDeliveryInvoice:id,correlative_number,issue_date',
                'movements.invoice:id,correlative_number,document_type',
                'movements.user:id,name',
            ])->latest('id')->get();

            $consignmentStats = [
                'total_items_in_custody' => (float) Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->sum('current_quantity'),
                'active_consignments_count' => Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->where('current_quantity', '>', 0)->count(),
                'active_clients_count' => Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->where('current_quantity', '>', 0)->distinct('client_id')->count('client_id'),
                'total_base_value' => (float) (Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->selectRaw('SUM(current_quantity * unit_price) as total')->value('total') ?? 0),
                'total_suggested_value' => (float) (Consignment::where('status', '!=', 'devuelta')->where('status', '!=', 'liquidada_total')->selectRaw('SUM(current_quantity * COALESCE(suggested_price, unit_price)) as total')->value('total') ?? 0),
            ];
        }

        $bcvData = BcvExchangeRateService::getLiveRate();

        return Inertia::render('Index', [
            'companies' => $companies,
            'clients' => $clients,
            'clientCategories' => $clientCategories,
            'invoices' => $paginatedResult['invoices'],
            'products' => $products,
            'consignments' => $consignments,
            'consignmentStats' => $consignmentStats,
            'bcvData' => $bcvData,
            'stats' => $stats,
            'chartData' => $chartData,
            'statusCounts' => $paginatedResult['statusCounts'],
            'filters' => $paginatedResult['filters'],
            'auditLogs' => $auditResult['logs'],
            'auditSummary' => $auditResult['summary'],
        ]);
    })->name('dashboard');

    Route::get('/dashboard', function () {
        return redirect()->route('dashboard');
    });

    // Consultas AJAX sin recarga de página
    Route::get('/invoices/query', [InvoiceController::class, 'query'])->name('invoices.query');
    Route::get('/audit-logs', [InvoiceController::class, 'auditLogs'])->name('audit-logs.index');

    // Rutas operativas del sistema
    Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
    Route::put('/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
    Route::delete('/companies/{company}', [CompanyController::class, 'destroy'])->name('companies.destroy');

    Route::post('/companies/{company}/bank-accounts', [CompanyBankAccountController::class, 'store'])->name('company-bank-accounts.store');
    Route::put('/bank-accounts/{bankAccount}', [CompanyBankAccountController::class, 'update'])->name('company-bank-accounts.update');
    Route::delete('/bank-accounts/{bankAccount}', [CompanyBankAccountController::class, 'destroy'])->name('company-bank-accounts.destroy');

    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::delete('/clients/{client}', [ClientController::class, 'destroy'])->name('clients.destroy');
    Route::post('/clients/consult-cne', [ClientController::class, 'consultCne'])->name('clients.consult-cne');

    // Secciones y Rubros de Clientes configurables por el usuario
    Route::post('/client-categories', [ClientCategoryController::class, 'store'])->name('client-categories.store');
    Route::put('/client-categories/{clientCategory}', [ClientCategoryController::class, 'update'])->name('client-categories.update');
    Route::delete('/client-categories/{clientCategory}', [ClientCategoryController::class, 'destroy'])->name('client-categories.destroy');

    Route::post('/products', [ProductController::class, 'store'])->name('products.store');
    Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::put('/invoices/{invoice}', [InvoiceController::class, 'update'])->name('invoices.update');
    Route::get('/invoices/{invoice}/pdf', [InvoiceController::class, 'downloadPdf'])->name('invoices.pdf');
    Route::patch('/invoices/{invoice}/status', [InvoiceController::class, 'updateStatus'])->name('invoices.update-status');
    Route::post('/invoices/{invoice}/convert-to-invoice', [InvoiceController::class, 'convertToInvoice'])->name('invoices.convert-to-invoice');
    Route::post('/invoices/{invoice}/payments', [InvoicePaymentController::class, 'store'])->name('invoice-payments.store');
    Route::delete('/invoice-payments/{payment}', [InvoicePaymentController::class, 'destroy'])->name('invoice-payments.destroy');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

    // Control de Mercancía en Consignación y Custodia de Clientes
    Route::get('/consignments', [ConsignmentController::class, 'index'])->name('consignments.index');
    Route::get('/consignments/clients/{client}/statement-pdf', [ConsignmentController::class, 'clientStatementPdf'])->name('consignments.client-statement-pdf');
    Route::post('/consignments/{consignment}/sell', [ConsignmentController::class, 'sell'])->name('consignments.sell');
    Route::post('/consignments/{consignment}/restock', [ConsignmentController::class, 'restock'])->name('consignments.restock');
    Route::post('/consignments/{consignment}/return', [ConsignmentController::class, 'returnStock'])->name('consignments.return');

    // Reportes Contables y Libro de Ventas
    Route::get('/reports/sales-book', [ReportController::class, 'salesBook'])->name('reports.sales-book');

    // Consulta en vivo de Tasa Oficial Dólar BCV (DolarApi / PyDolar)
    Route::get('/bcv/rate', [BcvController::class, 'getRate'])->name('bcv.rate');
    Route::get('/api/bcv-rate', [BcvController::class, 'getRate'])->name('api.bcv.rate');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Ruta de respaldo directo para servir logos e imágenes en cPanel sin necesidad de symlinks
Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (! file_exists($filePath)) {
        abort(404);
    }

    return response()->file($filePath);
})->where('path', '.*');

require __DIR__ . '/auth.php';
