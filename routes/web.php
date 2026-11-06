<?php

use App\Http\Controllers\ClientController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\ProfileController;
use App\Models\Client;
use App\Models\Company;
use App\Models\Invoice;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::get('/', function () {
        $companies = Company::with('bankAccounts')->where('is_active', true)->get();
        $clients = Client::where('is_active', true)->get();
        $invoices = Invoice::with(['company', 'client', 'items'])
            ->latest('issue_date')
            ->get();

        $stats = [
            'total_usd' => $invoices->sum('total_usd'),
            'invoices_count' => $invoices->count(),
            'companies_count' => $companies->count(),
            'clients_count' => $clients->count(),
        ];

        return Inertia::render('Index', [
            'companies' => $companies,
            'clients' => $clients,
            'invoices' => $invoices,
            'stats' => $stats,
        ]);
    })->name('dashboard');

    Route::get('/dashboard', function () {
        return redirect()->route('dashboard');
    });

    // Rutas operativas del sistema
    Route::post('/companies', [CompanyController::class, 'store'])->name('companies.store');
    Route::put('/companies/{company}', [CompanyController::class, 'update'])->name('companies.update');
    Route::post('/clients', [ClientController::class, 'store'])->name('clients.store');
    Route::put('/clients/{client}', [ClientController::class, 'update'])->name('clients.update');
    Route::post('/clients/consult-cne', [ClientController::class, 'consultCne'])->name('clients.consult-cne');
    Route::post('/invoices', [InvoiceController::class, 'store'])->name('invoices.store');
    Route::delete('/invoices/{invoice}', [InvoiceController::class, 'destroy'])->name('invoices.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Ruta de respaldo directo para servir logos e imágenes en cPanel sin necesidad de symlinks
Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    if (! file_exists($filePath)) {
        abort(404);
    }
    return response()->file($filePath);
})->where('path', '.*');

require __DIR__.'/auth.php';
