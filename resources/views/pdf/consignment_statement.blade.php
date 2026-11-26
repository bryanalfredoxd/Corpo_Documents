<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9pt;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.35;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        .header-table td {
            vertical-align: middle;
        }
        .company-name {
            font-size: 11pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #0f172a;
            margin: 0 0 2px 0;
        }
        .company-meta {
            font-size: 8pt;
            color: #334155;
            margin: 1px 0;
        }
        .doc-badge {
            display: inline-block;
            background-color: #6b21a8;
            color: #ffffff;
            font-size: 7.5pt;
            font-weight: bold;
            padding: 2px 7px;
            border-radius: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .doc-title {
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #581c87;
            margin: 4px 0 2px 0;
            letter-spacing: 0.5px;
        }
        .doc-date {
            font-size: 8pt;
            color: #64748b;
            font-weight: bold;
        }
        .client-box {
            border: 1px solid #cbd5e1;
            background-color: #f8fafc;
            border-radius: 4px;
            margin-top: 10px;
            margin-bottom: 12px;
            padding: 8px 10px;
        }
        .client-title {
            font-size: 8pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #475569;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 5px;
        }
        .client-table td {
            font-size: 8.5pt;
            vertical-align: top;
            padding: 1px 0;
        }
        .section-header {
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            color: #1e293b;
            border-bottom: 2px solid #581c87;
            padding-bottom: 3px;
            margin-top: 12px;
            margin-bottom: 6px;
        }
        .items-table {
            width: 100%;
            border: 1px solid #94a3b8;
            margin-bottom: 12px;
        }
        .items-table th {
            background-color: #f1f5f9;
            color: #0f172a;
            font-size: 7.5pt;
            font-weight: bold;
            text-transform: uppercase;
            padding: 5px 6px;
            border: 1px solid #cbd5e1;
            text-align: left;
        }
        .items-table td {
            font-size: 8pt;
            padding: 5px 6px;
            border: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; }
        .font-bold { font-weight: bold; }
        .highlight-row { background-color: #faf5ff; }
        .badge-status {
            display: inline-block;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 7pt;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-active { background-color: #dbeafe; color: #1e40af; }
        .badge-partial { background-color: #fef3c7; color: #92400e; }
        .badge-total { background-color: #d1fae5; color: #065f46; }
        .badge-return { background-color: #fee2e2; color: #991b1b; }
        .summary-box {
            width: 50%;
            margin-left: auto;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            padding: 6px 8px;
            background-color: #f8fafc;
            margin-bottom: 12px;
        }
        .summary-table td {
            font-size: 8.5pt;
            padding: 2px 4px;
        }
        .legal-notice {
            border: 1px solid #cbd5e1;
            background-color: #fafafa;
            border-radius: 4px;
            padding: 6px 8px;
            font-size: 7.5pt;
            color: #475569;
            line-height: 1.3;
            margin-top: 10px;
            margin-bottom: 25px;
        }
        .signature-table {
            margin-top: 25px;
            width: 100%;
        }
        .signature-table td {
            width: 50%;
            vertical-align: top;
            text-align: center;
            padding: 0 15px;
        }
        .signature-line {
            border-top: 1px solid #475569;
            padding-top: 5px;
            font-size: 8pt;
            font-weight: bold;
            color: #1e293b;
            text-transform: uppercase;
        }
        .signature-sub {
            font-size: 7pt;
            color: #64748b;
        }
    </style>
</head>
<body>

    <!-- 1. ENCABEZADO -->
    <table class="header-table">
        <tr>
            <td style="width: 55%;">
                @if(!empty($companyLogoUri))
                    <img src="{{ $companyLogoUri }}" style="max-height: 48px; max-width: 190px; margin-bottom: 4px;" alt="Logo Empresa">
                @endif
                <div class="company-name">{{ $company->name ?? 'EMPRESA EMISORA' }}</div>
                @if(!empty($company->tax_id))
                    <div class="company-meta"><strong>RIF:</strong> {{ $company->tax_id }}</div>
                @endif
                @if(!empty($company->phone))
                    <div class="company-meta"><strong>Teléfono:</strong> {{ $company->phone }}</div>
                @endif
                @if(!empty($company->address))
                    <div class="company-meta"><strong>Dirección:</strong> {{ $company->address }}</div>
                @endif
            </td>
            <td style="width: 45%; text-align: right;">
                <span class="doc-badge">CONTROL DE MERCANCÍA & CUSTODIA</span>
                <div class="doc-title">ACTA DE ARQUEO</div>
                <div style="font-size: 10pt; font-weight: bold; color: #334155;">MERCANCÍA EN CONSIGNACIÓN</div>
                <div class="doc-date">Fecha de Emisión: {{ $generatedAt->format('d/m/Y h:i A') }}</div>
                <div class="doc-date">Caracas, Venezuela</div>
            </td>
        </tr>
    </table>

    <!-- 2. DATOS DEL CLIENTE / RECEPTOR -->
    <div class="client-box">
        <div class="client-title">Datos del Aliado Comercial / Consignatario</div>
        <table class="client-table">
            <tr>
                <td style="width: 55%;">
                    <strong>Razón Social / Nombre:</strong> {{ $client->name }}<br>
                    <strong>C.I. / RIF:</strong> {{ $client->tax_id ?? 'No especificado' }}<br>
                    <strong>Clasificación / Categoría:</strong> {{ $client->category ?? 'Aliado Comercial' }}
                </td>
                <td style="width: 45%;">
                    <strong>Teléfono de Contacto:</strong> {{ $client->phone ?? 'Sin teléfono' }}<br>
                    <strong>Correo Electrónico:</strong> {{ $client->email ?? 'Sin correo' }}<br>
                    <strong>Ubicación de Custodia:</strong> {{ $client->address ?? 'Dirección del establecimiento' }}
                </td>
            </tr>
        </table>
    </div>

    <!-- 3. INVENTARIO FÍSICO ACTUAL EN TIENDA / CUSTODIA -->
    <div class="section-header">1. Inventario en Custodia Física Actual (En Vitrina / Tienda)</div>
    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 37%;">Descripción del Producto / Máquina</th>
                <th style="width: 10%;" class="text-center">Entregados</th>
                <th style="width: 10%;" class="text-center">Vendidos</th>
                <th style="width: 10%;" class="text-center">En Tienda</th>
                <th style="width: 14%;" class="text-right">Precio Base ($)</th>
                <th style="width: 14%;" class="text-right">PVP Sugerido ($)</th>
            </tr>
        </thead>
        <tbody>
            @php
                $grandTotalQty = 0;
                $grandTotalBase = 0;
                $grandTotalPvp = 0;
            @endphp
            @forelse($consignments as $idx => $c)
                @php
                    $currentQty = (float) $c->current_quantity;
                    $soldQty = (float) $c->movements->where('movement_type', 'venta_facturada')->sum('quantity');
                    $baseTotal = $currentQty * (float) $c->unit_price;
                    $pvpTotal = $currentQty * (float) ($c->suggested_price ?: $c->unit_price);
                    $grandTotalQty += $currentQty;
                    $grandTotalBase += $baseTotal;
                    $grandTotalPvp += $pvpTotal;
                @endphp
                <tr class="{{ $currentQty > 0 ? 'highlight-row' : '' }}">
                    <td class="text-center font-bold">{{ $idx + 1 }}</td>
                    <td>
                        <strong>{{ $c->description }}</strong>
                        @if($c->product && !empty($c->product->code))
                            <br><span style="font-size: 7pt; color: #64748b;">Cód: {{ $c->product->code }}</span>
                        @endif
                    </td>
                    <td class="text-center font-mono">{{ number_format($c->initial_quantity, 0) }} {{ $c->unit }}</td>
                    <td class="text-center font-mono text-emerald-700 font-bold">{{ number_format($soldQty, 0) }}</td>
                    <td class="text-center font-mono font-bold" style="font-size: 9pt; color: #581c87;">
                        {{ number_format($currentQty, 0) }} {{ $c->unit }}
                    </td>
                    <td class="text-right font-mono font-bold">${{ number_format($c->unit_price, 2) }}</td>
                    <td class="text-right font-mono font-bold" style="color: #b91c1c;">
                        {{ $c->suggested_price ? '$' . number_format($c->suggested_price, 2) : 'N/A' }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="7" class="text-center" style="padding: 12px; color: #64748b;">
                        No hay mercancías activas en custodia registradas para este cliente.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- TOTALES RESUMEN -->
    <div class="summary-box">
        <table class="summary-table">
            <tr>
                <td style="width: 60%; color: #475569;"><strong>Total Equipos en Poder del Cliente:</strong></td>
                <td style="width: 40%; text-align: right; font-size: 10pt; color: #581c87;" class="font-mono font-bold">
                    {{ number_format($grandTotalQty, 0) }} unidades
                </td>
            </tr>
            <tr>
                <td style="color: #475569;">Valor Total Base (Costo/Distribuidor):</td>
                <td style="text-align: right;" class="font-mono font-bold">${{ number_format($grandTotalBase, 2) }}</td>
            </tr>
            @if($grandTotalPvp > 0)
                <tr>
                    <td style="color: #b91c1c;">Valor Total PVP Sugerido (Público):</td>
                    <td style="text-align: right; color: #b91c1c;" class="font-mono font-bold">${{ number_format($grandTotalPvp, 2) }}</td>
                </tr>
            @endif
        </table>
    </div>

    <!-- 4. CRONOLOGÍA DE DOCUMENTOS VINCULADOS -->
    <div class="section-header">2. Trazabilidad de Documentos Cruzados (Notas y Facturas Oficiales)</div>
    <table class="items-table" style="font-size: 7.5pt;">
        <thead>
            <tr>
                <th style="width: 15%;">Fecha</th>
                <th style="width: 22%;">Tipo de Operación</th>
                <th style="width: 18%;">N° Documento</th>
                <th style="width: 10%;" class="text-center">Cant.</th>
                <th style="width: 12%;" class="text-center">Saldo Tienda</th>
                <th style="width: 23%;">Detalles / Observaciones</th>
            </tr>
        </thead>
        <tbody>
            @php
                $allMovements = collect();
                foreach($consignments as $c) {
                    foreach($c->movements as $m) {
                        $m->product_name = $c->description;
                        $allMovements->push($m);
                    }
                }
                $sortedMovements = $allMovements->sortByDesc('created_at')->take(12);
            @endphp
            @forelse($sortedMovements as $mov)
                @php
                    $badgeClass = match($mov->movement_type) {
                        'entrega_inicial' => 'badge-active',
                        'venta_facturada' => 'badge-total',
                        'reposicion' => 'badge-partial',
                        'devolucion' => 'badge-return',
                        default => 'badge-active'
                    };
                    $typeLabel = match($mov->movement_type) {
                        'entrega_inicial' => 'Entrega Inicial',
                        'venta_facturada' => 'Venta Facturada',
                        'reposicion' => 'Reposición Entregada',
                        'devolucion' => 'Devolución al Almacén',
                        default => $mov->movement_type
                    };
                @endphp
                <tr>
                    <td>{{ $mov->created_at ? $mov->created_at->timezone('America/Caracas')->format('d/m/Y h:i A') : 'S/F' }}</td>
                    <td>
                        <span class="badge-status {{ $badgeClass }}">{{ $typeLabel }}</span>
                    </td>
                    <td class="font-mono font-bold">
                        @if($mov->invoice)
                            {{ $mov->invoice->correlative_number }}
                        @else
                            Ajuste de Saldo
                        @endif
                    </td>
                    <td class="text-center font-mono">
                        {{ $mov->movement_type === 'venta_facturada' || $mov->movement_type === 'devolucion' ? '-' : '+' }}{{ number_format($mov->quantity, 0) }}
                    </td>
                    <td class="text-center font-mono font-bold">
                        {{ number_format($mov->new_quantity, 0) }} unid
                    </td>
                    <td style="color: #475569;">
                        {{ $mov->notes ?: $mov->product_name }}
                    </td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" class="text-center" style="padding: 8px; color: #64748b;">
                        Sin movimientos registrados.
                    </td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <!-- 5. CLÁUSULA DE CONFORMIDAD Y CUSTODIA -->
    <div class="legal-notice">
        <strong>DECLARACIÓN DE CUSTODIA Y CONCILIACIÓN:</strong> El Consignatario certifica haber verificado y recibido a entera conformidad las cantidades físicas detalladas en este informe. Se deja constancia de que los equipos y productos no vendidos continúan siendo propiedad de <strong>{{ $company->name ?? 'LA EMPRESA' }}</strong>. Las ventas realizadas son liquidadas mediante la correspondiente Factura Fiscal oficial, garantizando que los documentos de entrega previos conservan su validez sin alteraciones.
    </div>

    <!-- 6. SECCIÓN DE FIRMAS CRUZADAS -->
    <table class="signature-table">
        <tr>
            <td>
                <table style="width: 100%;">
                    <tr><td style="height: 45px;"></td></tr>
                    <tr>
                        <td class="signature-line">
                            Por la Empresa Consignante<br>
                            <span class="signature-sub" style="font-weight: normal; text-transform: none;">{{ $company->name ?? 'Corpo Asia' }}</span><br>
                            <span class="signature-sub" style="font-weight: normal; text-transform: none;">Despacho / Auditoría Central</span>
                        </td>
                    </tr>
                </table>
            </td>
            <td>
                <table style="width: 100%;">
                    <tr><td style="height: 45px;"></td></tr>
                    <tr>
                        <td class="signature-line">
                            Por el Consignatario / Cliente<br>
                            <span class="signature-sub" style="font-weight: normal; text-transform: none;">{{ $client->name }}</span><br>
                            <span class="signature-sub" style="font-weight: normal; text-transform: none;">Recibido Conforme / Responsable del Local</span>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

</body>
</html>
