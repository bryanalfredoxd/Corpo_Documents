<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
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
            'email' => ['required', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],
            'invoice_prefix' => ['nullable', 'string', 'max:10'],
            'default_terms' => ['nullable', 'string'],
            'logo' => ['nullable', 'image', 'mimes:png,jpg,jpeg,svg,webp', 'max:4096'],
        ]);

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('companies/logos', 'public');
        }

        Company::create([
            'name' => $validated['name'],
            'trade_name' => $validated['trade_name'] ?? null,
            'tax_id' => strtoupper(trim($validated['tax_id'])),
            'logo_path' => $logoPath,
            'address' => $validated['address'],
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'phone' => $validated['phone'],
            'email' => $validated['email'],
            'website' => $validated['website'] ?? null,
            'invoice_prefix' => $validated['invoice_prefix'] ?: 'F-',
            'next_correlative' => 1,
            'next_control_number' => 1,
            'default_terms' => $validated['default_terms'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', '¡Empresa registrada exitosamente con su logo!');
    }
}

