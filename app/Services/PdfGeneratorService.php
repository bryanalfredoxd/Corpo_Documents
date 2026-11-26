<?php

namespace App\Services;

use Illuminate\Support\Facades\View;
use Mpdf\HTMLParserMode;
use Mpdf\Mpdf;
use Mpdf\Output\Destination;
use Symfony\Component\HttpFoundation\Response;

/**
 * Servicio centralizado para renderizar y descargar documentos PDF oficiales mediante mPDF.
 */
class PdfGeneratorService
{
    /**
     * Compila una vista Blade y su HTML/CSS a bytes PDF binarios usando mPDF.
     *
     * @param  array<string, mixed>  $data
     * @param  array{
     *     paper?: string,
     *     orientation?: 'P'|'L',
     *     margins?: array{top?: float|int, right?: float|int, bottom?: float|int, left?: float|int},
     *     title?: string,
     *     watermark?: string|null,
     *     default_font_size?: float|int,
     * }  $options
     */
    public function renderViewToPdfBytes(string $viewName, array $data, array $options = []): string
    {
        $tempDir = storage_path('app/mpdf-tmp');
        if (! is_dir($tempDir)) {
            @mkdir($tempDir, 0755, true);
        }

        $margins = array_merge([
            'top' => 12,
            'right' => 14,
            'bottom' => 14,
            'left' => 14,
        ], $options['margins'] ?? []);

        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => $options['paper'] ?? 'A4',
            'orientation' => $options['orientation'] ?? 'P',
            'margin_left' => (float) $margins['left'],
            'margin_right' => (float) $margins['right'],
            'margin_top' => (float) $margins['top'],
            'margin_bottom' => (float) $margins['bottom'],
            'margin_header' => 0,
            'margin_footer' => 0,
            'default_font' => 'dejavusans',
            'default_font_size' => (float) ($options['default_font_size'] ?? 9.5),
            'tempDir' => $tempDir,
            'autoScriptToLang' => false,
            'autoLangToFont' => false,
            'shrink_tables_to_fit' => 1,
        ]);

        if (! empty($options['title'])) {
            $mpdf->SetTitle((string) $options['title']);
        }
        $mpdf->SetAuthor((string) config('app.name', 'Corpo Documents'));

        $watermark = $options['watermark'] ?? null;
        if (is_string($watermark) && trim($watermark) !== '') {
            $mpdf->SetWatermarkText(trim($watermark), 0.14);
            $mpdf->showWatermarkText = true;
            $mpdf->watermark_font = 'dejavusans';
            $mpdf->watermarkTextAlpha = 0.14;
        }

        // Indicamos a las plantillas Blade que mPDF renderiza la marca de agua de forma vectorial nativa
        $html = View::make($viewName, array_merge($data, [
            'useMpdfEngine' => true,
        ]))->render();

        $this->writeHtmlSafely($mpdf, $html);

        return (string) $mpdf->Output('', Destination::STRING_RETURN);
    }

    /**
     * Genera una respuesta HTTP descargable o inline con cabeceras PDF estándar.
     */
    public function makePdfResponse(
        string $viewName,
        array $data,
        string $filename,
        array $options = [],
        string $disposition = 'attachment'
    ): Response {
        $bytes = $this->renderViewToPdfBytes($viewName, $data, $options);
        $safeFilename = str_replace(['"', "\r", "\n"], '', $filename);
        $dispType = $disposition === 'inline' ? 'inline' : 'attachment';

        return response($bytes, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "{$dispType}; filename=\"{$safeFilename}\"; filename*=UTF-8''" . rawurlencode($safeFilename),
            'Content-Length' => (string) strlen($bytes),
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    /**
     * Separa el bloque <style> del cuerpo HTML y envía exclusivamente el contenido dentro de <body>
     * para evitar que etiquetas como <title> o <head> se impriman como texto visible en la página.
     */
    private function writeHtmlSafely(Mpdf $mpdf, string $html): void
    {
        // Las directivas @page de CSS causan bucles de paginación en mPDF
        $cleanHtml = preg_replace('/@page\s*\{[^}]*\}\s*/is', '', $html);

        // Extraer y procesar CSS de <style>
        if (preg_match('/<style[^>]*>(.*?)<\/style>/is', $cleanHtml, $styleMatch)) {
            $css = $styleMatch[1];
            $mpdf->WriteHTML($css, HTMLParserMode::HEADER_CSS);
        }

        // Extraer exclusivamente el contenido dentro de <body>...</body> para HTML_BODY
        if (preg_match('/<body[^>]*>(.*?)<\/body>/is', $cleanHtml, $bodyMatch)) {
            $bodyContent = $bodyMatch[1];
            $mpdf->WriteHTML($bodyContent, HTMLParserMode::HTML_BODY);
            return;
        }

        // Si no hay <body> explícito, limpiar <head>, <title> y doctype para evitar fuga de texto
        $cleanBody = preg_replace('/<head[^>]*>.*?<\/head>/is', '', $cleanHtml);
        $cleanBody = preg_replace('/<title[^>]*>.*?<\/title>/is', '', $cleanBody);
        $cleanBody = preg_replace('/<!DOCTYPE[^>]*>/i', '', $cleanBody);
        $cleanBody = preg_replace('/<\/?html[^>]*>/i', '', $cleanBody);

        $mpdf->WriteHTML($cleanBody, HTMLParserMode::HTML_BODY);
    }
}
