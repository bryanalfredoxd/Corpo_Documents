import React, { useState } from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from 'recharts';
import { BarChart3, ChevronDown, ChevronUp, PackageCheck } from 'lucide-react';

const formatCurrencyTooltip = (value) =>
    `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExecutiveCharts({ chartData = {} }) {
    const [isExpanded, setIsExpanded] = useState(true);

    const monthlyRevenue = Array.isArray(chartData?.monthly_revenue) ? chartData.monthly_revenue : [];
    const topProducts = Array.isArray(chartData?.top_products) ? chartData.top_products : [];

    const hasRevenue = monthlyRevenue.some((m) => Number(m.facturado) > 0 || Number(m.cobrado) > 0);

    return (
        <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-300 shadow-xs overflow-hidden no-print">
            {/* Cabecera con botón colapsable */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 text-blue-800 rounded-lg border border-blue-200">
                        <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                        <h3 className="text-xs sm:text-sm font-black text-black uppercase tracking-tight">
                            Resumen Gráfico Gerencial (Últimos 6 Meses)
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500 hidden sm:block">
                            Comparativa mensual de facturación real vs cobranza y productos más movidos
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="h-8 px-3 rounded-lg bg-white border-2 border-slate-300 hover:bg-slate-100 text-xs font-black text-black flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                >
                    <span>{isExpanded ? 'Ocultar' : 'Ver Gráficas'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
            </div>

            {isExpanded && (
                <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Gráfica 1: Facturado vs Cobrado (Últimos 6 meses) */}
                    <div className="lg:col-span-7 bg-slate-50/70 rounded-xl border border-slate-200 p-3.5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                                Facturación vs Cobranza Mensual (USD)
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                Solo Facturas Fiscales Activas
                            </span>
                        </div>

                        {hasRevenue ? (
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={monthlyRevenue} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} />
                                        <YAxis
                                            tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                                            tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => [formatCurrencyTooltip(value), name]}
                                            contentStyle={{
                                                borderRadius: '0.75rem',
                                                border: '2px solid #0f172a',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                            }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                                        <Bar dataKey="facturado" name="Facturado USD" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="cobrado" name="Cobrado USD" fill="#059669" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-xs font-bold text-slate-400 text-center px-4">
                                Emite facturas fiscales para visualizar la tendencia de ingresos de los últimos 6 meses.
                            </div>
                        )}
                    </div>

                    {/* Gráfica 2: Top 5 Productos Más Vendidos / Cotizados */}
                    <div className="lg:col-span-5 bg-slate-50/70 rounded-xl border border-slate-200 p-3.5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                                <PackageCheck className="w-3.5 h-3.5 text-indigo-700" />
                                <span>Top Productos del Catálogo</span>
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                Hasta 5 ítems
                            </span>
                        </div>

                        {topProducts.length > 0 ? (
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={topProducts}
                                        layout="vertical"
                                        margin={{ top: 4, right: 16, left: 6, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#475569' }}
                                            tickFormatter={(v) => `$${v}`}
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={110}
                                            tick={{ fontSize: 10, fontWeight: 700, fill: '#0f172a' }}
                                        />
                                        <Tooltip
                                            formatter={(value, name, item) => [
                                                name === 'Vendido USD'
                                                    ? `${formatCurrencyTooltip(value)} (${item?.payload?.unidades || 0} unds)`
                                                    : `${value} unds`,
                                                item?.payload?.full_name || name,
                                            ]}
                                            contentStyle={{
                                                borderRadius: '0.75rem',
                                                border: '2px solid #0f172a',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                            }}
                                        />
                                        <Bar dataKey="vendido_usd" name="Vendido USD" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-56 flex items-center justify-center text-xs font-bold text-slate-400 text-center px-4">
                                Selecciona productos desde el Catálogo al facturar para ver el ranking de demanda aquí.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

