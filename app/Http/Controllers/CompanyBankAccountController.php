<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyBankAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CompanyBankAccountController extends Controller
{
    /**
     * Registrar una nueva cuenta bancaria o dato de pago para una empresa emisora.
     */
    public function store(Request $request, Company $company): RedirectResponse
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'account_type' => ['required', 'string', 'max:100'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'holder_name' => ['required', 'string', 'max:255'],
            'holder_tax_id' => ['required', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $company->bankAccounts()->create([
            'bank_name' => trim($validated['bank_name']),
            'account_type' => trim($validated['account_type']),
            'account_number' => ! empty($validated['account_number']) ? trim($validated['account_number']) : null,
            'holder_name' => trim($validated['holder_name']),
            'holder_tax_id' => strtoupper(trim($validated['holder_tax_id'])),
            'phone' => ! empty($validated['phone']) ? trim($validated['phone']) : null,
            'email' => ! empty($validated['email']) ? trim($validated['email']) : null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', '¡Cuenta bancaria registrada exitosamente!');
    }

    /**
     * Actualizar los datos de una cuenta bancaria existente.
     */
    public function update(Request $request, CompanyBankAccount $bankAccount): RedirectResponse
    {
        $validated = $request->validate([
            'bank_name' => ['required', 'string', 'max:255'],
            'account_type' => ['required', 'string', 'max:100'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'holder_name' => ['required', 'string', 'max:255'],
            'holder_tax_id' => ['required', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $bankAccount->update([
            'bank_name' => trim($validated['bank_name']),
            'account_type' => trim($validated['account_type']),
            'account_number' => ! empty($validated['account_number']) ? trim($validated['account_number']) : null,
            'holder_name' => trim($validated['holder_name']),
            'holder_tax_id' => strtoupper(trim($validated['holder_tax_id'])),
            'phone' => ! empty($validated['phone']) ? trim($validated['phone']) : null,
            'email' => ! empty($validated['email']) ? trim($validated['email']) : null,
        ]);

        return redirect()->back()->with('success', '¡Cuenta bancaria actualizada exitosamente!');
    }

    /**
     * Eliminar una cuenta bancaria.
     */
    public function destroy(CompanyBankAccount $bankAccount): RedirectResponse
    {
        $bankAccount->delete();

        return redirect()->back()->with('success', 'Cuenta bancaria eliminada.');
    }
}

