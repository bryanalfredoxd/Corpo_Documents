<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ClientController extends Controller
{
    /**
     * Almacenar un nuevo cliente o empresa adquirente.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:persona,empresa'],
            'name' => ['required', 'string', 'max:255'],
            'tax_id' => ['required', 'string', 'max:50', 'unique:clients,tax_id'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'phone_secondary' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        Client::create([
            'type' => $validated['type'],
            'name' => $validated['name'],
            'tax_id' => strtoupper(trim($validated['tax_id'])),
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'],
            'phone_secondary' => $validated['phone_secondary'] ?? null,
            'address' => $validated['address'] ?? null,
            'contact_person' => $validated['contact_person'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', '¡Cliente registrado exitosamente en el directorio!');
    }

    /**
     * Actualizar los datos de un cliente o empresa adquirente existente.
     */
    public function update(Request $request, Client $client): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:persona,empresa'],
            'name' => ['required', 'string', 'max:255'],
            'tax_id' => ['required', 'string', 'max:50', 'unique:clients,tax_id,' . $client->id],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'phone_secondary' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $client->update([
            'type' => $validated['type'],
            'name' => $validated['name'],
            'tax_id' => strtoupper(trim($validated['tax_id'])),
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'],
            'phone_secondary' => $validated['phone_secondary'] ?? null,
            'address' => $validated['address'] ?? null,
            'contact_person' => $validated['contact_person'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', '¡Información del cliente actualizada exitosamente!');
    }

    /**
     * Consultar datos de identidad al API CNE / Cédula y autocompletar.
     */
    public function consultCne(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nacionalidad' => ['required', 'string', 'in:V,E,J,G'],
            'cedula' => ['required', 'numeric'],
        ]);

        $appId = '2118';
        $token = 'ad3e6e46e42e96adba76c92c23755b54';

        try {
            $response = Http::timeout(10)->get('https://api.cedula.com.ve/api/v1', [
                'app_id' => $appId,
                'token' => $token,
                'nacionalidad' => strtoupper($validated['nacionalidad']),
                'cedula' => $validated['cedula'],
            ]);

            if ($response->successful()) {
                $body = $response->json();

                if (! empty($body['error'])) {
                    return response()->json([
                        'success' => false,
                        'message' => $body['error_str'] ?: 'Cédula no encontrada en el registro electoral.',
                    ], 404);
                }

                $data = $body['data'] ?? [];

                // Armar Nombre Completo
                $nameParts = array_filter([
                    $data['primer_nombre'] ?? '',
                    $data['segundo_nombre'] ?? '',
                    $data['primer_apellido'] ?? '',
                    $data['segundo_apellido'] ?? '',
                ]);
                $fullName = trim(preg_replace('/\s+/', ' ', implode(' ', $nameParts)));

                // Armar Dirección si viene con CNE
                $address = null;
                if (! empty($data['cne']) && is_array($data['cne'])) {
                    $addressParts = array_filter([
                        $data['cne']['estado'] ?? '',
                        $data['cne']['municipio'] ?? '',
                        $data['cne']['parroquia'] ?? '',
                        $data['cne']['centro_electoral'] ?? '',
                    ]);
                    $address = implode(', ', $addressParts);
                }

                // Formatear RIF
                $formattedRif = $data['rif'] ?? ($validated['nacionalidad'] . '-' . $validated['cedula']);

                return response()->json([
                    'success' => true,
                    'full_name' => $fullName,
                    'rif' => $formattedRif,
                    'address' => $address,
                    'nacionalidad' => $data['nacionalidad'] ?? $validated['nacionalidad'],
                    'cedula' => $data['cedula'] ?? $validated['cedula'],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No se pudo obtener respuesta del servicio CNE.',
            ], 502);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error de conexión con la API CNE: ' . $e->getMessage(),
            ], 500);
        }
    }
}
