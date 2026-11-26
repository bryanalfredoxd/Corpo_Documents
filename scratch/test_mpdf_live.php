<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\ConsignmentController;
use App\Http\Controllers\InvoiceController;
use App\Models\Client;
use App\Models\Invoice;
use App\Services\PdfGeneratorService;
use Illuminate\Http\Request;

$pdfService = app(PdfGeneratorService::class);
$invoiceController = app(InvoiceController::class);
$consignmentController = app(ConsignmentController::class);

$invoices = Invoice::with(['company', 'client', 'items'])->get();
echo "Testing mPDF on {$invoices->count()} real invoices in MySQL:\n";

foreach ($invoices as $inv) {
    foreach (['formato-1', 'formato-2'] as $fmt) {
        $t0 = microtime(true);
        $req = Request::create("/invoices/{$inv->id}/pdf", 'GET', ['format' => $fmt]);
        $res = $invoiceController->downloadPdf($req, $inv, $pdfService);
        $elapsed = round(microtime(true) - $t0, 3);
        $content = $res->getContent();
        $startsPdf = str_starts_with($content, '%PDF-');
        echo " - Invoice #{$inv->id} ({$inv->correlative_number}) [{$fmt}]: status={$res->getStatusCode()} size=" . strlen($content) . "B pdfHeader=" . ($startsPdf ? 'YES' : 'NO') . " time={$elapsed}s\n";
        if ($inv->id === 9 && $fmt === 'formato-1') {
            file_put_contents(__DIR__ . '/sample_classic.pdf', $content);
        }
        if ($inv->id === 15 && $fmt === 'formato-2') {
            file_put_contents(__DIR__ . '/sample_modern.pdf', $content);
        }
    }
}

// Test draft preview without saving to DB
$previewReq = Request::create('/invoices/preview-pdf', 'POST', [
    'document_type' => 'cotizacion',
    'correlative_number' => 'COT-000099',
    'control_number' => 'BORRADOR',
    'sale_condition' => 'Consignación',
    'show_suggested_price' => true,
    'show_totals' => false,
    'bcv_exchange_rate' => 920.50,
    'tax_percentage' => 0,
    'pdf_format' => 'formato-1',
    'items' => [
        [
            'description' => 'Peletizadora KL-160 (Borrador Preview)',
            'quantity' => 2,
            'unit' => 'unid',
            'unit_price' => 900,
            'suggested_price' => 1150,
            'is_tax_exempt' => true,
            'show_image' => true,
        ],
    ],
]);
$previewRes = $invoiceController->previewPdf($previewReq, $pdfService);
echo " - Unsaved Draft Preview PDF: status={$previewRes->getStatusCode()} size=" . strlen($previewRes->getContent()) . "B pdfHeader=" . (str_starts_with($previewRes->getContent(), '%PDF-') ? 'YES' : 'NO') . "\n";

$client = Client::whereHas('consignments')->first() ?: Client::first();
if ($client) {
    $stmtReq = Request::create("/consignments/clients/{$client->id}/statement-pdf", 'GET');
    $stmtRes = $consignmentController->clientStatementPdf($stmtReq, $client, $pdfService);
    file_put_contents(__DIR__ . '/sample_statement.pdf', $stmtRes->getContent());
    echo " - Consignment Statement PDF (Client #{$client->id}): status={$stmtRes->getStatusCode()} size=" . strlen($stmtRes->getContent()) . "B pdfHeader=" . (str_starts_with($stmtRes->getContent(), '%PDF-') ? 'YES' : 'NO') . "\n";
}
