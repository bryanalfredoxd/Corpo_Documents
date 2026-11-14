<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\ClientCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ClientCategoryController extends Controller
{
    /**
     * Registrar una nueva sección o rubro de cliente configurable.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:client_categories,name'],
            'description' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:20'],
            'color' => ['nullable', 'string', 'max:30'],
        ]);

        $name = trim($validated['name']);

        ClientCategory::create([
            'name' => $name,
            'description' => $validated['description'] ?? null,
            'icon' => !empty(trim($validated['icon'] ?? '')) ? trim($validated['icon']) : '🏷️',
            'color' => !empty(trim($validated['color'] ?? '')) ? trim($validated['color']) : 'blue',
            'is_active' => true,
        ]);

        return redirect()->back()->with('success', "¡Sección \"{$name}\" creada exitosamente!");
    }

    /**
     * Actualizar una sección o rubro existente y sincronizar los clientes vinculados.
     */
    public function update(Request $request, ClientCategory $clientCategory): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:client_categories,name,' . $clientCategory->id],
            'description' => ['nullable', 'string', 'max:255'],
            'icon' => ['nullable', 'string', 'max:20'],
            'color' => ['nullable', 'string', 'max:30'],
        ]);

        $oldName = $clientCategory->name;
        $newName = trim($validated['name']);

        // Si se renombró la categoría, actualizar todos los clientes que la tenían
        if (strcasecmp($oldName, $newName) !== 0) {
            Client::where('category', $oldName)->update(['category' => $newName]);
        }

        $clientCategory->update([
            'name' => $newName,
            'description' => $validated['description'] ?? null,
            'icon' => !empty(trim($validated['icon'] ?? '')) ? trim($validated['icon']) : '🏷️',
            'color' => !empty(trim($validated['color'] ?? '')) ? trim($validated['color']) : 'blue',
        ]);

        return redirect()->back()->with('success', "¡Sección \"{$newName}\" actualizada exitosamente!");
    }

    /**
     * Eliminar una sección o rubro, reasignando sus clientes a Comercial General para proteger el historial.
     */
    public function destroy(ClientCategory $clientCategory): RedirectResponse
    {
        $name = $clientCategory->name;

        // Reasignar los clientes vinculados a Comercial General para no dejarlos huérfanos
        Client::where('category', $name)->update(['category' => 'Comercial General']);

        $clientCategory->delete();

        return redirect()->back()->with('success', "Sección \"{$name}\" eliminada. Los clientes asociados fueron reasignados a Comercial General.");
    }
}

