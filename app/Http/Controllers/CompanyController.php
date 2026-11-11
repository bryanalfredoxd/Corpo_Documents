<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Services\ImageOptimizerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CompanyController extends Controller
{
    public function __construct(private readonly ImageOptimizerService $imageOptimizer) {}
    /**
     * Añade campos de numeración independiente por tipo de documento si las columnas existen en BD.
     */
    private function mergeDocumentSequenceAttributes(array $baseData, array $validated, ?Company $company = null): array
    {
        if (Schema::hasColumn('companies', 'proforma_prefix')) {
            $baseData['proforma_prefix'] = ! empty($validated['proforma_prefix']) ? $validated['proforma_prefix'] : ($company?->proforma_prefix ?: 'PROF-');
            $baseData['next_proforma_correlative'] = ! empty($validated['next_proforma_correlative']) ? (int) $validated['next_proforma_correlative'] : ($company?->next_proforma_correlative ?: 1);
            $baseData['quote_prefix'] = ! empty($validated['quote_prefix']) ? $validated['quote_prefix'] : ($company?->quote_prefix ?: 'COT-');
            $baseData['next_quote_correlative'] = ! empty($validated['next_quote_correlative']) ? (int) $validated['next_quote_correlative'] : ($company?->next_quote_correlative ?: 1);
            $baseData['delivery_note_prefix'] = ! empty($validated['delivery_note_prefix']) ? $validated['delivery_note_prefix'] : ($company?->delivery_note_prefix ?: 'NE-');
            $baseData['next_delivery_note_correlative'] = ! empty($validated['next_delivery_note_correlative']) ? (int) $validated['next_delivery_note_correlative'] : ($company?->next_delivery_note_correlative ?: 1);
        }

        return $baseData;
    }

    /**
     * Almacenar una nueva empresa emisora con su logo.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['required', 'string', 'max:50', 'unique:companies,tax_id'],
            'address' => ['required', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'invoice_prefix' => ['nullable', 'string', 'max:10'],
            'next_correlative' => ['nullable', 'integer', 'min:1'],
            'next_control_number' => ['nullable', 'integer', 'min:1'],
            'proforma_prefix' => ['nullable', 'string', 'max:15'],
            'next_proforma_correlative' => ['nullable', 'integer', 'min:1'],
            'quote_prefix' => ['nullable', 'string', 'max:15'],
            'next_quote_correlative' => ['nullable', 'integer', 'min:1'],
            'delivery_note_prefix' => ['nullable', 'string', 'max:15'],
            'next_delivery_note_correlative' => ['nullable', 'integer', 'min:1'],
            'default_terms' => ['nullable', 'string'],
            'default_payment_terms' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:4096'],
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $publicUrl = $this->imageOptimizer->optimizeUploadedFile($request->file('logo'), 'companies/logos');
            $logoPath = ltrim(preg_replace('#^/storage/#', '', $publicUrl), '/');
        }

        $companyData = $this->mergeDocumentSequenceAttributes([
            'name' => $validated['name'],
            'trade_name' => $validated['trade_name'] ?? null,
            'tax_id' => strtoupper(trim($validated['tax_id'])),
            'logo_path' => $logoPath,
            'address' => $validated['address'],
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'phone' => $validated['phone'],
            'email' => !empty($validated['email']) ? trim($validated['email']) : null,
            'website' => $validated['website'] ?? null,
            'invoice_prefix' => !empty($validated['invoice_prefix']) ? $validated['invoice_prefix'] : 'F-',
            'next_correlative' => !empty($validated['next_correlative']) ? (int) $validated['next_correlative'] : 1,
            'next_control_number' => !empty($validated['next_control_number']) ? (int) $validated['next_control_number'] : 1,
            'default_terms' => $validated['default_terms'] ?? null,
            'default_payment_terms' => $validated['default_payment_terms'] ?? null,
            'is_active' => true,
        ], $validated);

        Company::create($companyData);

        return redirect()->back()->with('success', '¡Empresa emisora registrada exitosamente!');
    }

    /**
     * Actualizar los datos de una empresa emisora existente.
     */
    public function update(Request $request, Company $company): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trade_name' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['required', 'string', 'max:50', 'unique:companies,tax_id,' . $company->id],
            'address' => ['required', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'invoice_prefix' => ['nullable', 'string', 'max:10'],
            'next_correlative' => ['nullable', 'integer', 'min:1'],
            'next_control_number' => ['nullable', 'integer', 'min:1'],
            'proforma_prefix' => ['nullable', 'string', 'max:15'],
            'next_proforma_correlative' => ['nullable', 'integer', 'min:1'],
            'quote_prefix' => ['nullable', 'string', 'max:15'],
            'next_quote_correlative' => ['nullable', 'integer', 'min:1'],
            'delivery_note_prefix' => ['nullable', 'string', 'max:15'],
            'next_delivery_note_correlative' => ['nullable', 'integer', 'min:1'],
            'default_terms' => ['nullable', 'string'],
            'default_payment_terms' => ['nullable', 'string'],
        ]);

        $updateData = $this->mergeDocumentSequenceAttributes([
            'name' => $validated['name'],
            'trade_name' => $validated['trade_name'] ?? null,
            'tax_id' => strtoupper(trim($validated['tax_id'])),
            'address' => $validated['address'],
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'phone' => $validated['phone'],
            'email' => !empty($validated['email']) ? trim($validated['email']) : null,
            'website' => $validated['website'] ?? null,
            'invoice_prefix' => !empty($validated['invoice_prefix']) ? $validated['invoice_prefix'] : ($company->invoice_prefix ?: 'F-'),
            'next_correlative' => !empty($validated['next_correlative']) ? (int) $validated['next_correlative'] : $company->next_correlative,
            'next_control_number' => !empty($validated['next_control_number']) ? (int) $validated['next_control_number'] : $company->next_control_number,
            'default_terms' => $validated['default_terms'] ?? null,
            'default_payment_terms' => $validated['default_payment_terms'] ?? null,
        ], $validated, $company);

        $company->update($updateData);

        return redirect()->back()->with('success', '¡Información de la empresa actualizada exitosamente!');
    }

    /**
     * Desactivar lógicamente una empresa emisora sin perder el historial de sus facturas.
     */
    public function destroy(Company $company): RedirectResponse
    {
        if ($company->is_active && Company::where('is_active', true)->count() <= 1) {
            return redirect()->back()->withErrors([
                'company' => 'Debe existir al menos una empresa emisora activa en el sistema.',
            ]);
        }

        $company->update(['is_active' => false]);

        return redirect()->back()->with('success', "Empresa \"{$company->name}\" archivada de forma segura. Su historial fiscal se conserva intacto.");
    }
}
