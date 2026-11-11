<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $docInfo['title'] }} {{ $correlative }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 11mm 13mm 13mm 13mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9pt;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.32;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .mono {
            font-family: 'DejaVu Sans Mono', monospace;
        }
        .watermark {
            position: fixed;
            top: 38%;
            left: 14%;
            width: 72%;
            text-align: center;
            font-size: 52pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 6px;
            opacity: 0.14;
            transform: rotate(-30deg);
            border: 6px solid {{ $invoice->status === 'anulada' ? '#b91c1c' : '#d97706' }};
            color: {{ $invoice->status === 'anulada' ? '#b91c1c' : '#d97706' }};
            padding: 10px 0;
            z-index: -1;
        }
        .gold-bar {
            height: 7px;
            background-color: #C9A227;
            margin: 8px 0 12px 0;
            border-radius: 2px;
        }
        .card {
            border: 1px solid #cbd5e1;
            margin-bottom: 10px;
        }
        .card-header {
            background-color: #0E1C33;
            color: #ffffff;
            font-weight: bold;
            font-size: 8.5pt;
            text-transform: uppercase;
            padding: 5px 9px;
            letter-spacing: 0.5px;
        }
        .card-body {
            padding: 7px 9px;
            background-color: #ffffff;
        }
        .dot-row td {
            padding: 3px 0;
            font-size: 8.5pt;
            vertical-align: bottom;
        }
        .dot-label {
            width: 34%;
            font-weight: bold;
            color: #1e293b;
        }
        .dot-value {
            width: 66%;
            border-bottom: 1px dotted #94a3b8;
            padding-bottom: 1px;
            color: #020617;
        }
        .spec-cat {
            background-color: #f1f5f9;
            padding: 4px 9px;
            font-weight: bold;
            font-size: 8pt;
            text-transform: uppercase;
            color: #0f172a;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
        }
        .spec-row td {
            padding: 4px 9px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 8.2pt;
        }
        .zebra {
            background-color: #F4F5F7;
        }
        .page-break {
            page-break-before: always;
        }
        .footer-page {
            text-align: right;
            font-size: 7.5pt;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 4px;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    @if($invoice->status === 'anulada' || $invoice->status === 'borrador')
        <div class="watermark">{{ $invoice->status === 'anulada' ? 'ANULADA' : 'BORRADOR' }}</div>
    @endif

    <!-- PÁGINA 1 -->
    <table>
        <tr>
            <td style="width: 60%; vertical-align: middle;">
                <table>
                    <tr>
                        @if($companyLogoUri)
                            <td style="width: 80px; vertical-align: middle; padding-right: 10px;">
                                <img src="{{ $companyLogoUri }}" alt="Logo" style="width: 74px; max-height: 74px; object-fit: contain;">
                            </td>
                        @endif
                        <td style="vertical-align: middle;">
                            <div style="font-size: 10pt; font-weight: bold; text-transform: uppercase; color: #0f172a;">{{ $invoice->company->name }}</div>
                            <div style="font-size: 8.2pt; font-weight: bold; color: #1e293b;">RIF: {{ $invoice->company->tax_id }}</div>
                            <div style="font-size: 8pt; color: #475569;">{{ $invoice->company->address }}</div>
                            <div style="font-size: 8pt; color: #475569;">Teléfono / WhatsApp: {{ $invoice->company->phone }}</div>
                            @if($invoice->company->email)
                                <div style="font-size: 8pt; color: #475569;">Email: {{ $invoice->company->email }}</div>
                            @endif
                            @if($companySocialHandle ?: $invoice->company->website)
                                <div style="font-size: 8pt; color: #475569;">Web / Red: {{ $companySocialHandle ?: $invoice->company->website }}</div>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 40%; text-align: right; vertical-align: top;">
                <div style="font-size: 20pt; font-weight: bold; color: #0E1C33; text-transform: uppercase; line-height: 1.05;">{{ $docInfo['title'] }}</div>
                <div style="font-size: 8pt; font-weight: bold; color: #C9A227; text-transform: uppercase; margin-top: 2px;">
                    {{ $invoice->document_subtitle ?: $docInfo['defaultSubtitle'] }}
                </div>
                <div style="font-size: 8.2pt; color: #1e293b; margin-top: 8px; line-height: 1.45;">
                    <div><span style="color: #475569;">{{ $docInfo['correlativeLabel'] }}:</span> <strong class="mono" style="color: #0E1C33;">{{ $correlative }}</strong></div>
                    <div><span style="color: #475569;">Fecha de emisión:</span> <strong class="mono">{{ $issueDate }}</strong></div>
                    <div><span style="color: #475569;">Validez de la oferta:</span> <strong>{{ $invoice->offer_validity_days ?: 8 }} días</strong></div>
                    <div><span style="color: #475569;">{{ $docInfo['controlLabel'] }}:</span> <strong class="mono">{{ $controlNumber }}</strong></div>
                </div>
            </td>
        </tr>
    </table>

    <div class="gold-bar"></div>

    <!-- DATOS DEL CLIENTE -->
    <div class="card">
        <div class="card-header">DATOS DEL CLIENTE</div>
        <div class="card-body">
            <table class="dot-row">
                <tr>
                    <td class="dot-label">Nombre / Razón social</td>
                    <td class="dot-value" style="font-weight: bold; text-transform: uppercase;">{{ $invoice->client?->name ?? '_____________________________________' }}</td>
                </tr>
                <tr>
                    <td class="dot-label">Cédula / RIF</td>
                    <td class="dot-value mono" style="font-weight: bold;">{{ $invoice->client?->tax_id ?? '_____________________________________' }}</td>
                </tr>
                <tr>
                    <td class="dot-label">Teléfono</td>
                    <td class="dot-value" style="font-weight: bold;">{{ $invoice->client?->phone ?: '_____________________________________' }}</td>
                </tr>
                @if($invoice->client?->email)
                    <tr>
                        <td class="dot-label">Correo electrónico</td>
                        <td class="dot-value">{{ $invoice->client->email }}</td>
                    </tr>
                @endif
                <tr>
                    <td class="dot-label">Dirección de entrega</td>
                    <td class="dot-value">{{ $invoice->delivery_address ?: ($invoice->client?->address ?: '_____________________________________') }}</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- FICHA TÉCNICA DEL EQUIPO -->
    <div class="card">
        <div class="card-header">FICHA TÉCNICA DEL EQUIPO</div>
        <div style="padding: 8px 9px; border-bottom: 1px solid #e2e8f0; background: #ffffff;">
            <table>
                <tr>
                    <td style="vertical-align: middle;">
                        <span style="font-size: 10pt; font-weight: bold; color: #0E1C33; text-transform: uppercase;">
                            {{ $items[0]['description'] ?? 'EQUIPO INDUSTRIAL' }}
                        </span>
                        @if(!empty($items[0]['details']))
                            <span style="font-size: 8.2pt; color: #475569; margin-left: 6px;">— {{ $items[0]['details'] }}</span>
                        @endif
                    </td>
                    @if(!empty($items[0]) && $items[0]['show_image'] && $items[0]['image_uri'])
                        <td style="width: 56px; text-align: right; vertical-align: middle;">
                            <img src="{{ $items[0]['image_uri'] }}" alt="" style="width: 48px; height: 48px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px;">
                        </td>
                    @endif
                </tr>
            </table>
        </div>

        @foreach($groupedSpecs as $catName => $catSpecs)
            <div class="spec-cat">{{ $catName }}</div>
            <table>
                @foreach($catSpecs as $sIdx => $spec)
                    <tr class="spec-row {{ $sIdx % 2 === 1 ? 'zebra' : '' }}">
                        <td style="width: 42%; color: #334155;">{{ $spec['name'] ?? '' }}</td>
                        <td style="width: 58%; font-weight: bold; color: #0f172a;">{{ $spec['value'] ?? '' }}</td>
                    </tr>
                @endforeach
            </table>
        @endforeach
    </div>

    <div class="footer-page">
        Página 1 de 2 • {{ $docInfo['title'] }} {{ $correlative }}
    </div>

    <!-- PÁGINA 2 -->
    <div class="page-break"></div>

    <!-- Identificadores del equipo -->
    <div class="card">
        <div class="card-body">
            <table class="dot-row">
                <tr>
                    <td class="dot-label">Año de fabricación</td>
                    <td class="dot-value mono" style="font-weight: bold;">{{ $equipmentYear ?: '2021 / Reciente (Inspeccionado)' }}</td>
                </tr>
                <tr>
                    <td class="dot-label">N° de serie / VIN</td>
                    <td class="dot-value mono" style="font-weight: bold;">{{ $equipmentVin ?: ($invoice->payment_reference ? 'CAT-' . $invoice->payment_reference : 'CAT0320CL089124') }}</td>
                </tr>
            </table>
        </div>
    </div>

    <!-- PRECIO — CONDICIÓN DDP -->
    <div class="card">
        <div class="card-header">PRECIO — CONDICIÓN DDP (ENTREGADO EN DESTINO)</div>
        <table>
            @foreach($items as $it)
                <tr>
                    <td style="padding: 6px 9px; border-bottom: 1px solid #e2e8f0; vertical-align: middle;">
                        <table>
                            <tr>
                                @if($it['show_image'] && $it['image_uri'])
                                    <td style="width: 34px; padding-right: 8px; vertical-align: middle;">
                                        <img src="{{ $it['image_uri'] }}" alt="" style="width: 28px; height: 28px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 3px;">
                                    </td>
                                @endif
                                <td style="vertical-align: middle; font-size: 8.5pt; color: #1e293b;">
                                    {{ $it['description'] }}
                                    @if($it['quantity'] > 1)
                                        ({{ rtrim(rtrim(number_format($it['quantity'], 2, '.', ''), '0'), '.') }} {{ $it['unit'] }})
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td class="mono" style="width: 28%; padding: 6px 9px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 8.5pt;">
                        USD {{ number_format($it['total'], 2, '.', ',') }}
                    </td>
                </tr>
            @endforeach

            @if((float) $invoice->shipping_cost > 0)
                <tr class="zebra">
                    <td style="padding: 6px 9px; border-bottom: 1px solid #e2e8f0; font-size: 8.5pt;">Flete y seguro internacional</td>
                    <td class="mono" style="padding: 6px 9px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 8.5pt;">
                        USD {{ number_format((float) $invoice->shipping_cost, 2, '.', ',') }}
                    </td>
                </tr>
            @endif

            <tr>
                <td style="padding: 6px 9px; border-bottom: 1px solid #e2e8f0; font-size: 8.5pt;">Nacionalización, aranceles y aduana en Venezuela</td>
                <td class="mono" style="padding: 6px 9px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 8.5pt;">
                    {{ $customsText ?: ((float) $invoice->tax_amount > 0 ? 'USD ' . number_format((float) $invoice->tax_amount, 2, '.', ',') : 'INCLUIDO') }}
                </td>
            </tr>

            @if((float) $invoice->discount > 0)
                <tr style="background-color: #ecfdf5; color: #065f46;">
                    <td style="padding: 6px 9px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 8.5pt;">Descuento comercial aplicado</td>
                    <td class="mono" style="padding: 6px 9px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; font-size: 8.5pt;">
                        -USD {{ number_format((float) $invoice->discount, 2, '.', ',') }}
                    </td>
                </tr>
            @endif

            <tr style="background-color: #0E1C33; color: #ffffff;">
                <td style="padding: 7px 9px; font-weight: bold; font-size: 8.5pt; text-transform: uppercase;">TOTAL DDP — Puesto en destino, Venezuela</td>
                <td class="mono" style="padding: 7px 9px; text-align: right; font-weight: bold; font-size: 11pt;">
                    USD {{ number_format((float) $invoice->total_usd, 2, '.', ',') }}
                </td>
            </tr>

            @if($showBsConversion)
                <tr style="background-color: #f1f5f9; color: #0E1C33; border-top: 1px solid #cbd5e1;">
                    <td style="padding: 5px 9px; font-weight: bold; font-size: 8pt;">
                        Equivalente en Bolívares (Tasa Bs. {{ number_format((float) $invoice->bcv_exchange_rate, 2, '.', '') }}):
                    </td>
                    <td class="mono" style="padding: 5px 9px; text-align: right; font-weight: bold; font-size: 8.5pt;">
                        TOTAL VES: Bs. {{ number_format((float) $invoice->total_ves, 2, ',', '.') }}
                    </td>
                </tr>
            @endif
        </table>
    </div>

    <!-- CONDICIONES DE PAGO -->
    <div class="card">
        <div class="card-header">CONDICIONES DE PAGO</div>
        <div style="background-color: #f8fafc; padding: 5px 9px; border-bottom: 1px solid #e2e8f0; font-size: 8pt; color: #334155;">
            <table>
                <tr>
                    <td>
                        Condición: <strong style="color: #020617;">{{ $invoice->sale_condition ?: 'Venta de Contado' }}</strong> •
                        Canal: <strong style="color: #020617;">{{ $invoice->sales_channel ?: 'Oficina / Presencial' }}</strong>
                    </td>
                    <td style="text-align: right;">
                        Medio: <strong style="color: #020617; text-transform: uppercase;">{{ $invoice->payment_method ?: 'TRANSFERENCIA' }}</strong>
                        @if($invoice->payment_reference)
                            (Ref: {{ $invoice->payment_reference }})
                        @endif
                    </td>
                </tr>
            </table>
        </div>
        <table>
            <tr>
                <td style="width: 14%; padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 10pt; color: #0E1C33;">
                    {{ $milestone1Pct }}%
                </td>
                <td style="width: 86%; padding: 7px 9px; border-bottom: 1px solid #e2e8f0; font-size: 8.2pt; color: #1e293b;">
                    <strong class="mono" style="color: #020617;">USD {{ number_format((float) $invoice->total_usd * ($milestone1Pct / 100), 2, '.', ',') }}</strong>
                    — {{ $milestone1Text }}
                </td>
            </tr>
            <tr class="zebra">
                <td style="width: 14%; padding: 7px 9px; font-weight: bold; font-size: 10pt; color: #0E1C33;">
                    {{ $milestone2Pct }}%
                </td>
                <td style="width: 86%; padding: 7px 9px; font-size: 8.2pt; color: #1e293b;">
                    <strong class="mono" style="color: #020617;">USD {{ number_format((float) $invoice->total_usd * ($milestone2Pct / 100), 2, '.', ',') }}</strong>
                    — {{ $milestone2Text }}
                </td>
            </tr>
        </table>
    </div>

    <!-- CONDICIONES DE ENVÍO -->
    <div class="card">
        <div class="card-header">CONDICIONES DE ENVÍO</div>
        <div class="card-body" style="font-size: 8pt; color: #334155;">
            {{ $shippingTermsNotes }}
        </div>
    </div>

    @if(!empty($termsText))
        <div style="border: 1px solid #e2e8f0; padding: 6px 9px; background-color: #f8fafc; font-size: 7.8pt; color: #334155; margin-bottom: 12px;">
            <strong style="color: #0E1C33; text-transform: uppercase; font-size: 7.5pt; display: block; margin-bottom: 2px;">Términos y Condiciones de Entrega:</strong>
            {{ $termsText }}
        </div>
    @endif

    <!-- Firmas -->
    <table style="margin-top: 18px; page-break-inside: avoid;">
        <tr>
            <td style="width: 46%; text-align: center; vertical-align: bottom; padding-right: 16px;">
                <div style="height: 68px; text-align: center;">
                    @if($stampUri)
                        <img src="{{ $stampUri }}" alt="Firma autorizada" style="max-height: 66px; max-width: 145px; object-fit: contain;">
                    @endif
                </div>
                <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: bold; font-size: 8pt;">
                    Firma autorizada — {{ $invoice->company->name }}
                </div>
            </td>
            <td style="width: 8%;"></td>
            <td style="width: 46%; text-align: center; vertical-align: bottom; padding-left: 16px;">
                <div style="height: 68px;"></div>
                <div style="border-top: 1px solid #0f172a; padding-top: 4px; font-weight: bold; font-size: 8pt;">
                    Firma / aceptación del cliente
                </div>
            </td>
        </tr>
    </table>

    <div class="footer-page">
        Página 2 de 2 • {{ $docInfo['title'] }} {{ $correlative }}
    </div>
</body>
</html>

