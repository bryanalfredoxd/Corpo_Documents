<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Writer\XLSX\Options as XlsxOptions;
use OpenSpout\Writer\XLSX\Writer as XlsxWriter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * Columnas oficiales del Libro de Ventas contable / SENIAT.
     */
    private const HEADERS = [
        'Fecha Emisión',
        'Empresa Emisora',
        'RIF Emisora',
        'Tipo Documento',
        'Nro. Documento / Correlativo',
        'Nro. Control Fiscal',
        'Estado',
        'Cliente / Razón Social',
        'RIF / Cédula Cliente',
        'Base Imponible (USD)',
        'Monto Exento (USD)',
        'Alícuota IVA %',
        'IVA (USD)',
        'Flete (USD)',
        'Descuento (USD)',
        'Total Facturado (USD)',
        'Tasa BS',
        'Base Imponible (VES)',
        'Monto Exento (VES)',
        'IVA (VES)',
        'Total (VES)',
        'Abonado (USD)',
        'Saldo Pendiente (USD)',
        'Forma de Pago',
        'Emitido Por',
        'Observaciones',
    ];

    /**
     * Índices base 0 de columnas monetarias numéricas (para formato Excel y CSV).
     */
    private const CURRENCY_COLUMNS = [9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22];

    /**
     * Exporta el Libro de Ventas contable / SENIAT en Excel real (.xlsx) o CSV UTF-8.
     */
    public function salesBook(Request $request): BinaryFileResponse|StreamedResponse
    {
        $validated = $request->validate([
            'company_id' => ['nullable', 'string'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'scope' => ['nullable', 'in:fiscal,all'],
            'include_annulled' => ['nullable', 'boolean'],
            'format' => ['nullable', 'in:xlsx,csv'],
        ]);

        $scope = $validated['scope'] ?? 'fiscal';
        $format = $validated['format'] ?? 'xlsx';
        $includeAnnulled = $request->has('include_annulled')
            ? $request->boolean('include_annulled')
            : true;

        $query = Invoice::with([
            'company:id,name,tax_id',
            'client:id,name,tax_id',
            'items',
            'payments',
            'user:id,name',
        ])->where('status', '!=', 'borrador');

        if ($scope === 'fiscal') {
            $query->where('document_type', 'factura');
        }

        if (! empty($validated['company_id']) && $validated['company_id'] !== 'all') {
            $query->where('company_id', (int) $validated['company_id']);
        }

        if (! empty($validated['start_date'])) {
            $query->whereDate('issue_date', '>=', $validated['start_date']);
        }

        if (! empty($validated['end_date'])) {
            $query->whereDate('issue_date', '<=', $validated['end_date']);
        }

        if (! $includeAnnulled) {
            $query->where('status', '!=', 'anulada');
        }

        $invoices = $query->orderBy('issue_date')->orderBy('id')->get();
        $report = $this->buildReportRows($invoices);

        $fileSuffix = now('America/Caracas')->format('Y-m-d_His');
        $baseName = ($scope === 'fiscal' ? 'libro-ventas-seniat-' : 'libro-documentos-') . $fileSuffix;

        if ($format === 'csv') {
            return $this->streamCsv($baseName . '.csv', $report);
        }

        return $this->downloadXlsx($baseName . '.xlsx', $scope, $report);
    }

    /**
     * Prepara las filas normalizadas y totales consolidados para cualquier formato de exportación.
     */
    private function buildReportRows(Collection $invoices): array
    {
        $typeLabels = [
            'factura' => 'FACTURA',
            'proforma' => 'PROFORMA',
            'cotizacion' => 'COTIZACION',
            'nota_entrega' => 'NOTA DE ENTREGA',
        ];

        $rows = [];
        $totals = [
            'base_usd' => 0.0,
            'exempt_usd' => 0.0,
            'iva_usd' => 0.0,
            'shipping_usd' => 0.0,
            'discount_usd' => 0.0,
            'total_usd' => 0.0,
            'base_ves' => 0.0,
            'exempt_ves' => 0.0,
            'iva_ves' => 0.0,
            'total_ves' => 0.0,
            'paid_usd' => 0.0,
            'due_usd' => 0.0,
        ];

        foreach ($invoices as $inv) {
            $isAnnulled = $inv->status === 'anulada';
            $showBs = (bool) $inv->show_bs_conversion;
            $rate = (float) $inv->bcv_exchange_rate;

            if ($isAnnulled) {
                $baseUsd = 0.0;
                $exemptUsd = 0.0;
                $ivaUsd = 0.0;
                $shippingUsd = 0.0;
                $discountUsd = 0.0;
                $totalUsd = 0.0;
                $paidUsd = 0.0;
                $dueUsd = 0.0;
                $notes = 'DOCUMENTO ANULADO (Monto original: $' . number_format((float) $inv->total_usd, 2, '.', '') . ')';
            } else {
                $baseUsd = 0.0;
                $exemptUsd = 0.0;

                if ($inv->items && $inv->items->count() > 0) {
                    foreach ($inv->items as $item) {
                        if ($item->is_tax_exempt) {
                            $exemptUsd += (float) $item->total;
                        } else {
                            $baseUsd += (float) $item->total;
                        }
                    }
                } else {
                    $taxPct = (float) $inv->tax_percentage;
                    $ivaCalc = (float) $inv->tax_amount;
                    if ($taxPct > 0 && $ivaCalc > 0) {
                        $baseUsd = round($ivaCalc / ($taxPct / 100), 2);
                        $exemptUsd = max(0, round((float) $inv->total_usd - $ivaCalc - $baseUsd, 2));
                    } else {
                        $exemptUsd = (float) $inv->total_usd;
                    }
                }

                $baseUsd = round($baseUsd, 2);
                $exemptUsd = round($exemptUsd, 2);
                $ivaUsd = round((float) $inv->tax_amount, 2);
                $shippingUsd = round((float) $inv->shipping_cost, 2);
                $discountUsd = round((float) $inv->discount, 2);
                $totalUsd = round((float) $inv->total_usd, 2);
                $paidUsd = round((float) $inv->paid_amount_usd, 2);
                $dueUsd = round((float) $inv->balance_due_usd, 2);
                $notes = $showBs ? '' : 'Operacion en divisas (Solo USD)';
            }

            $baseVes = (! $isAnnulled && $showBs) ? round($baseUsd * $rate, 2) : 0.0;
            $exemptVes = (! $isAnnulled && $showBs) ? round($exemptUsd * $rate, 2) : 0.0;
            $ivaVes = (! $isAnnulled && $showBs) ? round($ivaUsd * $rate, 2) : 0.0;
            $totalVes = (! $isAnnulled && $showBs) ? round((float) $inv->total_ves, 2) : 0.0;

            $totals['base_usd'] += $baseUsd;
            $totals['exempt_usd'] += $exemptUsd;
            $totals['iva_usd'] += $ivaUsd;
            $totals['shipping_usd'] += $shippingUsd;
            $totals['discount_usd'] += $discountUsd;
            $totals['total_usd'] += $totalUsd;
            $totals['base_ves'] += $baseVes;
            $totals['exempt_ves'] += $exemptVes;
            $totals['iva_ves'] += $ivaVes;
            $totals['total_ves'] += $totalVes;
            $totals['paid_usd'] += $paidUsd;
            $totals['due_usd'] += $dueUsd;

            $rows[] = [
                'is_annulled' => $isAnnulled,
                'values' => [
                    $inv->issue_date ? $inv->issue_date->format('Y-m-d') : '',
                    $inv->company?->name ?? '',
                    $inv->company?->tax_id ?? '',
                    $typeLabels[$inv->document_type] ?? strtoupper((string) $inv->document_type),
                    $inv->correlative_number ?? '',
                    $inv->control_number ?? '',
                    strtoupper((string) $inv->status),
                    $inv->client?->name ?? '',
                    $inv->client?->tax_id ?? '',
                    $baseUsd,
                    $exemptUsd,
                    round((float) $inv->tax_percentage, 2),
                    $ivaUsd,
                    $shippingUsd,
                    $discountUsd,
                    $totalUsd,
                    $showBs ? round($rate, 2) : 'SOLO USD',
                    $baseVes,
                    $exemptVes,
                    $ivaVes,
                    $totalVes,
                    $paidUsd,
                    $dueUsd,
                    trim(($inv->payment_method ?? '') . ($inv->payment_reference ? ' / ' . $inv->payment_reference : '')),
                    $inv->user?->name ?? 'Sistema',
                    $notes,
                ],
            ];
        }

        $totalRow = [
            'TOTALES',
            '',
            '',
            '',
            $invoices->count() . ' docs',
            '',
            '',
            '',
            '',
            round($totals['base_usd'], 2),
            round($totals['exempt_usd'], 2),
            '',
            round($totals['iva_usd'], 2),
            round($totals['shipping_usd'], 2),
            round($totals['discount_usd'], 2),
            round($totals['total_usd'], 2),
            '',
            round($totals['base_ves'], 2),
            round($totals['exempt_ves'], 2),
            round($totals['iva_ves'], 2),
            round($totals['total_ves'], 2),
            round($totals['paid_usd'], 2),
            round($totals['due_usd'], 2),
            '',
            '',
            '',
        ];

        return [
            'rows' => $rows,
            'totals' => $totalRow,
        ];
    }

    /**
     * Genera libro Excel nativo (.xlsx) con estilos, formatos numéricos y anchos de columna vía OpenSpout.
     */
    private function downloadXlsx(string $filename, string $scope, array $report): BinaryFileResponse
    {
        $tempPath = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'libro_' . Str::random(16) . '.xlsx';

        $options = new XlsxOptions(
            FALLBACK_STYLE: new Style(fontSize: 10, fontName: 'Calibri'),
            DEFAULT_COLUMN_WIDTH: 15.0,
        );

        $writer = new XlsxWriter($options);
        $writer->openToFile($tempPath);

        $sheet = $writer->getCurrentSheet();
        $sheet->setName($scope === 'fiscal' ? 'Libro de Ventas' : 'Documentos');
        $sheet->setColumnWidth(13, 1, 3, 5, 6, 7);
        $sheet->setColumnWidth(28, 2, 8);
        $sheet->setColumnWidth(20, 4, 24, 26);

        $headerStyle = new Style(
            fontBold: true,
            fontSize: 10,
            fontColor: Color::WHITE,
            cellAlignment: CellAlignment::CENTER,
            backgroundColor: '0E1C33',
        );

        $writer->addRow(Row::fromValuesWithStyle(self::HEADERS, $headerStyle, 24));

        $regularCurrencyStyle = new Style(fontSize: 10, cellAlignment: CellAlignment::RIGHT, format: '#,##0.00');
        $regularTextStyle = new Style(fontSize: 10);
        $annulledCurrencyStyle = new Style(fontSize: 10, fontColor: '991B1B', cellAlignment: CellAlignment::RIGHT, backgroundColor: 'FEF2F2', format: '#,##0.00');
        $annulledTextStyle = new Style(fontSize: 10, fontColor: '991B1B', backgroundColor: 'FEF2F2');

        $regularStyles = [];
        $annulledStyles = [];
        foreach (array_keys(self::HEADERS) as $colIdx) {
            $isCurrency = in_array($colIdx, self::CURRENCY_COLUMNS, true) || $colIdx === 11;
            $regularStyles[$colIdx] = $isCurrency ? $regularCurrencyStyle : $regularTextStyle;
            $annulledStyles[$colIdx] = $isCurrency ? $annulledCurrencyStyle : $annulledTextStyle;
        }

        foreach ($report['rows'] as $row) {
            $styles = $row['is_annulled'] ? $annulledStyles : $regularStyles;
            if (! $row['is_annulled'] && is_float($row['values'][16])) {
                $styles[16] = $regularCurrencyStyle;
            }
            $writer->addRow(Row::fromValuesWithStyles($row['values'], $styles, 19));
        }

        $totalTextStyle = new Style(fontBold: true, fontSize: 10, backgroundColor: 'E2E8F0');
        $totalCurrencyStyle = new Style(fontBold: true, fontSize: 10, cellAlignment: CellAlignment::RIGHT, backgroundColor: 'E2E8F0', format: '#,##0.00');
        $totalStyles = [];
        foreach (array_keys(self::HEADERS) as $colIdx) {
            $totalStyles[$colIdx] = in_array($colIdx, self::CURRENCY_COLUMNS, true) ? $totalCurrencyStyle : $totalTextStyle;
        }

        $writer->addRow(Row::fromValuesWithStyles($report['totals'], $totalStyles, 22));
        $writer->close();

        return response()->download($tempPath, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Genera archivo CSV UTF-8 con BOM cuando el usuario elige explícitamente formato CSV.
     */
    private function streamCsv(string $filename, array $report): StreamedResponse
    {
        $formatRow = static function (array $values): array {
            return array_map(static function ($val, int $colIdx) {
                if (is_float($val) || is_int($val)) {
                    if (in_array($colIdx, self::CURRENCY_COLUMNS, true) || $colIdx === 11 || $colIdx === 16) {
                        return number_format((float) $val, 2, '.', '');
                    }
                }

                return $val;
            }, $values, array_keys($values));
        };

        return response()->streamDownload(function () use ($report, $formatRow) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, self::HEADERS);

            foreach ($report['rows'] as $row) {
                fputcsv($out, $formatRow($row['values']));
            }

            fputcsv($out, $formatRow($report['totals']));
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
