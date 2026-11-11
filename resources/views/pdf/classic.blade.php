<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $docInfo['title'] }} {{ $correlative }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 14mm 14mm 14mm;
        }
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9.5pt;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.35;
        }
        table {
            width: 100%;
            border-collapse: collapse;
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
        .header-table td {
            vertical-align: middle;
        }
        .company-name {
            font-size: 10.5pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
            margin: 0 0 2px 0;
        }
        .company-meta {
            font-size: 8.5pt;
            color: #334155;
            margin: 1px 0;
        }
        .doc-title {
            font-size: 18pt;
            font-weight: bold;
            color: #020617;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.05;
        }
        .doc-subtitle {
            font-size: 8pt;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            margin: 3px 0 0 0;
            letter-spacing: 0.5px;
        }
        .doc-correlative {
            font-family: 'DejaVu Sans Mono', monospace;
            font-size: 11pt;
            font-weight: bold;
            color: #0f172a;
            margin: 6px 0 4px 0;
        }
        .doc-meta-line {
            font-size: 8.5pt;
            color: #1e293b;
            margin: 2px 0;
        }
        .divider-solid {
            border-bottom: 2px solid #020617;
            margin: 10px 0 12px 0;
        }
        .section-heading {
            font-size: 8.5pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #020617;
            letter-spacing: 0.4px;
            margin: 0 0 6px 0;
        }
        .info-grid-table td {
            vertical-align: top;
        }
        .kv-table td {
            padding: 1.5px 0;
            font-size: 8.5pt;
            vertical-align: top;
        }
        .kv-label {
            width: 34%;
            color: #475569;
            font-weight: bold;
        }
        .kv-value {
            width: 66%;
            color: #0f172a;
        }
        .items-table {
            margin-top: 10px;
            margin-bottom: 14px;
        }
        .items-table thead th {
            border-top: 2px solid #020617;
            border-bottom: 2px solid #020617;
            padding: 6px 6px;
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #020617;
            text-align: left;
        }
        .items-table tbody td {
            padding: 7px 6px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
            font-size: 8.5pt;
        }
        .item-thumb {
            width: 44px;
            height: 44px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 2px;
            object-fit: contain;
            background: #ffffff;
        }
        .totals-row td {
            padding: 4px 0;
            border-bottom: 1px solid #e2e8f0;
            font-size: 8.5pt;
        }
        .totals-iva td {
            border-bottom: 2px solid #020617;
        }
        .totals-final td {
            padding-top: 6px;
            font-size: 10.5pt;
            font-weight: bold;
            color: #020617;
            border-bottom: none;
        }
        .totals-ves td {
            padding-top: 2px;
            font-size: 9pt;
            font-weight: bold;
            color: #1e3a8a;
            border-bottom: none;
        }
        .mono {
            font-family: 'DejaVu Sans Mono', monospace;
        }
        .bs-note {
            border-left: 2px solid #94a3b8;
            padding: 2px 0 2px 8px;
            margin-top: 8px;
            font-size: 7.5pt;
            color: #475569;
            font-style: italic;
        }
        .footer-block {
            margin-top: 18px;
            padding-top: 10px;
            border-top: 1px solid #cbd5e1;
            page-break-inside: avoid;
        }
        .sig-line {
            border-top: 1px dashed #64748b;
            padding-top: 4px;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            text-align: center;
        }
    </style>
</head>
<body>
    @if($invoice->status === 'anulada' || $invoice->status === 'borrador')
        <div class="watermark">{{ $invoice->status === 'anulada' ? 'ANULADA' : 'BORRADOR' }}</div>
    @endif

    <!-- Cabecera -->
    <table class="header-table">
        <tr>
            <td style="width: 62%;">
                <table>
                    <tr>
                        @if($companyLogoUri)
                            <td style="width: 84px; vertical-align: middle; padding-right: 10px;">
                                <img src="{{ $companyLogoUri }}" alt="Logo" style="width: 78px; max-height: 78px; object-fit: contain;">
                            </td>
                        @endif
                        <td style="vertical-align: middle;">
                            <p class="company-name">{{ $invoice->company->name }}</p>
                            <p class="company-meta"><strong>RIF: {{ $invoice->company->tax_id }}</strong></p>
                            <p class="company-meta">{{ $invoice->company->address }}</p>
                            <p class="company-meta">Teléfono / WhatsApp: {{ $invoice->company->phone }}</p>
                            @if($invoice->company->email)
                                <p class="company-meta">Email: {{ $invoice->company->email }}</p>
                            @endif
                            @if($invoice->company->website)
                                <p class="company-meta">Web / Red: {{ $invoice->company->website }}</p>
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 38%; text-align: right; vertical-align: top;">
                <p class="doc-title">{{ $docInfo['title'] }}</p>
                @if($invoice->document_subtitle)
                    <p class="doc-subtitle">{{ $invoice->document_subtitle }}</p>
                @endif
                <p class="doc-correlative">N° {{ $correlative }}</p>
                <p class="doc-meta-line"><strong>Fecha:</strong> {{ $issueDate }}</p>
                <p class="doc-meta-line"><strong>{{ $docInfo['controlLabel'] }}:</strong> {{ $controlNumber }}</p>
            </td>
        </tr>
    </table>

    <div class="divider-solid"></div>

    <!-- Datos Cliente & Condiciones -->
    <table class="info-grid-table" style="border-bottom: 1px solid #cbd5e1; padding-bottom: 10px;">
        <tr>
            <td style="width: 50%; padding-right: 14px; padding-bottom: 10px;">
                <p class="section-heading">DATOS DEL ADQUIRIENTE / CLIENTE</p>
                <table class="kv-table">
                    <tr>
                        <td class="kv-label">Cliente:</td>
                        <td class="kv-value" style="font-weight: bold; text-transform: uppercase;">{{ $invoice->client?->name ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">Cédula / RIF:</td>
                        <td class="kv-value mono" style="font-weight: bold;">{{ $invoice->client?->tax_id ?? 'N/A' }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">Teléfono:</td>
                        <td class="kv-value">{{ $invoice->client?->phone ?: 'N/A' }}</td>
                    </tr>
                    @if($invoice->client?->email)
                        <tr>
                            <td class="kv-label">Email:</td>
                            <td class="kv-value">{{ $invoice->client->email }}</td>
                        </tr>
                    @endif
                    @if($invoice->client?->address)
                        <tr>
                            <td class="kv-label">Dirección:</td>
                            <td class="kv-value">{{ $invoice->client->address }}</td>
                        </tr>
                    @endif
                    @if($invoice->delivery_address && $invoice->delivery_address !== $invoice->client?->address)
                        <tr>
                            <td class="kv-label">Entrega:</td>
                            <td class="kv-value" style="font-weight: bold;">{{ $invoice->delivery_address }}</td>
                        </tr>
                    @endif
                </table>
            </td>
            <td style="width: 50%; padding-left: 14px; padding-bottom: 10px;">
                <p class="section-heading">CONDICIONES DE LA VENTA</p>
                <table class="kv-table">
                    <tr>
                        <td class="kv-label">Condición:</td>
                        <td class="kv-value" style="font-weight: bold;">{{ $invoice->sale_condition }}</td>
                    </tr>
                    <tr>
                        <td class="kv-label">Canal:</td>
                        <td class="kv-value" style="font-weight: bold;">{{ $invoice->sales_channel ?: 'Oficina / Presencial' }}</td>
                    </tr>
                    @if($showBsConversion)
                        <tr>
                            <td class="kv-label">Tasa BS:</td>
                            <td class="kv-value mono" style="font-weight: bold;">Bs. {{ number_format((float) $invoice->bcv_exchange_rate, 2, '.', '') }} / USD</td>
                        </tr>
                    @endif
                    @if(in_array($invoice->document_type, ['proforma', 'cotizacion'], true))
                        <tr>
                            <td class="kv-label">Validez:</td>
                            <td class="kv-value" style="font-weight: bold; color: #1e3a8a;">{{ $invoice->offer_validity_days ?: 8 }} días continuos</td>
                        </tr>
                    @elseif($dueDate)
                        <tr>
                            <td class="kv-label">Vencimiento:</td>
                            <td class="kv-value mono" style="font-weight: bold;">{{ $dueDate }}</td>
                        </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <!-- Tabla de Renglones -->
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%; text-align: center;">#</th>
                <th style="width: 47%;">DESCRIPCIÓN DEL PRODUCTO</th>
                <th style="width: 14%; text-align: center;">CANT.</th>
                <th style="width: 17%; text-align: right;">PRECIO UNIT. ($)</th>
                <th style="width: 17%; text-align: right;">TOTAL ($)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $idx => $item)
                <tr>
                    <td class="mono" style="text-align: center; font-weight: bold;">{{ $idx + 1 }}</td>
                    <td>
                        <table>
                            <tr>
                                @if($item['show_image'] && $item['image_uri'])
                                    <td style="width: 52px; vertical-align: top; padding-right: 8px; border-bottom: none; padding-top: 0;">
                                        <img src="{{ $item['image_uri'] }}" alt="" class="item-thumb">
                                    </td>
                                @endif
                                <td style="vertical-align: top; border-bottom: none; padding: 0;">
                                    <div style="font-weight: bold; color: #020617;">{{ $item['description'] }}</div>
                                    @if(!empty($item['details']))
                                        <div style="font-size: 7.8pt; color: #475569; margin-top: 2px;">{!! nl2br(e($item['details'])) !!}</div>
                                    @endif
                                </td>
                            </tr>
                        </table>
                    </td>
                    <td class="mono" style="text-align: center; font-weight: bold;">
                        {{ rtrim(rtrim(number_format($item['quantity'], 2, '.', ''), '0'), '.') }} {{ $item['unit'] }}
                    </td>
                    <td class="mono" style="text-align: right; font-weight: bold;">
                        ${{ number_format($item['unit_price'], 2, '.', '') }}
                        @if(!empty($item['unit']))
                            <span style="font-size: 7pt; color: #64748b; font-weight: normal;">/{{ $item['unit'] }}</span>
                        @endif
                    </td>
                    <td class="mono" style="text-align: right; font-weight: bold; color: #020617;">
                        ${{ number_format($item['total'], 2, '.', '') }}
                        @if($item['is_tax_exempt'])
                            <span style="font-size: 7pt; color: #1e3a8a; font-weight: bold;">(E)</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <!-- Forma de Pago & Totales -->
    <table>
        <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 16px;">
                <p class="section-heading">FORMA DE PAGO</p>
                <p style="font-size: 8.5pt; margin: 2px 0;">
                    <span style="color: #475569; font-weight: bold;">Medio:</span>
                    <strong style="text-transform: uppercase;">{{ $invoice->payment_method ?: 'PAGO MOVIL' }}</strong>
                </p>
                @if($invoice->payment_reference)
                    <p style="font-size: 8.5pt; margin: 2px 0;">
                        <span style="color: #475569; font-weight: bold;">Ref:</span>
                        <span class="mono" style="font-weight: bold;">{{ $invoice->payment_reference }}</span>
                    </p>
                @endif
                @if($showBsConversion)
                    <div class="bs-note">
                        Monto en Bolívares (VES) calculado según la Tasa BS indicada a la fecha de la transacción.
                    </div>
                @endif
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 16px;">
                <table>
                    <tr class="totals-row">
                        <td style="font-weight: bold; color: #334155;">Subtotal:</td>
                        <td class="mono" style="text-align: right; font-weight: bold;">${{ number_format((float) $invoice->subtotal, 2, '.', '') }}</td>
                    </tr>
                    @if((float) $invoice->shipping_cost > 0)
                        <tr class="totals-row">
                            <td style="font-weight: bold; color: #334155;">Flete / Delivery:</td>
                            <td class="mono" style="text-align: right; font-weight: bold;">${{ number_format((float) $invoice->shipping_cost, 2, '.', '') }}</td>
                        </tr>
                    @endif
                    @if((float) $invoice->discount > 0)
                        <tr class="totals-row" style="color: #065f46;">
                            <td style="font-weight: bold;">Descuento:</td>
                            <td class="mono" style="text-align: right; font-weight: bold;">-${{ number_format((float) $invoice->discount, 2, '.', '') }}</td>
                        </tr>
                    @endif
                    <tr class="totals-row totals-iva">
                        <td style="font-weight: bold; color: #334155;">
                            {{ (float) $invoice->tax_percentage === 0.0 ? 'IVA (0% Exento / Neto):' : 'IVA (' . number_format((float) $invoice->tax_percentage, 0) . '%):' }}
                        </td>
                        <td class="mono" style="text-align: right; font-weight: bold;">${{ number_format((float) $invoice->tax_amount, 2, '.', '') }}</td>
                    </tr>
                    <tr class="totals-final">
                        <td>TOTAL USD:</td>
                        <td class="mono" style="text-align: right;">${{ number_format((float) $invoice->total_usd, 2, '.', '') }}</td>
                    </tr>
                    @if($showBsConversion)
                        <tr class="totals-ves">
                            <td style="color: #334155;">TOTAL VES:</td>
                            <td class="mono" style="text-align: right;">Bs. {{ number_format((float) $invoice->total_ves, 2, ',', '.') }}</td>
                        </tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <!-- Términos y Firmas -->
    <div class="footer-block">
        <table>
            <tr>
                <td style="width: 48%; vertical-align: bottom; padding-right: 14px;">
                    <p class="section-heading">TÉRMINOS Y CONDICIONES DE ENTREGA</p>
                    <p style="font-size: 7.5pt; color: #475569; margin: 0;">
                        {{ $termsText }}
                    </p>
                </td>
                <td style="width: 26%; vertical-align: bottom; padding: 0 6px; text-align: center;">
                    <div style="height: 68px; text-align: center; vertical-align: bottom;">
                        @if($stampUri)
                            <img src="{{ $stampUri }}" alt="Firma y Sello Emisor" style="max-height: 66px; max-width: 135px; object-fit: contain;">
                        @endif
                    </div>
                    <div class="sig-line">FIRMA Y SELLO EMISOR</div>
                </td>
                <td style="width: 26%; vertical-align: bottom; padding-left: 6px; text-align: center;">
                    <div style="height: 68px;"></div>
                    <div class="sig-line">RECIBIDO CONFORME</div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>

