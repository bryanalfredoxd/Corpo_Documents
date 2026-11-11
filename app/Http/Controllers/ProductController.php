<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\ImageOptimizerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class ProductController extends Controller
{
    public function __construct(private readonly ImageOptimizerService $imageOptimizer) {}

    /**
     * Procesa y optimiza una imagen de producto (archivo o base64), garantizando sincronización para cPanel.
     */
    private function processProductImage(Request $request, ?string $currentImageUrl = null): ?string
    {
        if ($request->boolean('remove_image')) {
            return null;
        }

        if ($request->hasFile('image')) {
            return $this->imageOptimizer->optimizeUploadedFile($request->file('image'), 'products');
        }

        $imageUrl = $request->input('image_url');
        if (is_string($imageUrl) && str_starts_with($imageUrl, 'data:image/')) {
            $optimized = $this->imageOptimizer->optimizeBase64Image($imageUrl, 'products');
            if ($optimized !== null) {
                return $optimized;
            }
        }

        if ($request->has('image_url')) {
            return ! empty($imageUrl) ? $imageUrl : null;
        }

        return $currentImageUrl;
    }

    /**
     * Valida y prepara los atributos de un producto incluyendo stock y ficha técnica opcional.
     */
    private function prepareProductAttributes(Request $request, ?string $currentImageUrl = null): array
    {
        if (is_string($request->input('technical_specs'))) {
            $decoded = json_decode($request->input('technical_specs'), true);
            $request->merge([
                'technical_specs' => is_array($decoded) ? $decoded : null,
            ]);
        }

        $validated = $request->validate([
            'code' => ['nullable', 'string', 'max:100'],
            'name' => ['required', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
            'category' => ['nullable', 'string', 'max:100'],
            'unit' => ['required', 'string', 'max:50'],
            'unit_price' => ['required', 'numeric', 'min:0'],
            'is_tax_exempt' => ['nullable', 'boolean'],
            'image' => ['nullable', 'image', 'mimes:png,jpg,jpeg,webp,gif', 'max:5120'],
            'image_url' => ['nullable', 'string'],
            'remove_image' => ['nullable', 'boolean'],
            'track_inventory' => ['nullable', 'boolean'],
            'stock' => ['nullable', 'numeric'],
            'min_stock' => ['nullable', 'numeric', 'min:0'],
            'technical_specs' => ['nullable', 'array'],
        ]);

        $imageUrl = $this->processProductImage($request, $currentImageUrl);

        $data = [
            'code' => ! empty($validated['code']) ? strtoupper(trim($validated['code'])) : null,
            'name' => trim($validated['name']),
            'details' => $validated['details'] ?? null,
            'category' => ! empty($validated['category']) ? trim($validated['category']) : 'General',
            'unit' => trim($validated['unit']),
            'unit_price' => (float) $validated['unit_price'],
            'is_tax_exempt' => $request->boolean('is_tax_exempt', false),
            'image_url' => $imageUrl,
        ];

        if (Schema::hasColumn('products', 'track_inventory')) {
            $data['track_inventory'] = $request->boolean('track_inventory', false);
            $data['stock'] = isset($validated['stock']) ? (float) $validated['stock'] : 0;
            $data['min_stock'] = isset($validated['min_stock']) ? (float) $validated['min_stock'] : 0;
            $data['technical_specs'] = $validated['technical_specs'] ?? null;
        }

        return $data;
    }

    /**
     * Registrar un nuevo producto en el catálogo.
     */
    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $attributes = $this->prepareProductAttributes($request);
        $attributes['is_active'] = true;

        $product = Product::create($attributes);

        if ($request->wantsJson() && ! $request->header('X-Inertia')) {
            return response()->json([
                'product' => $product,
                'message' => '¡Producto guardado exitosamente en el catálogo!',
            ]);
        }

        return redirect()->back()->with('success', '¡Producto registrado exitosamente en el catálogo!');
    }

    /**
     * Actualizar un producto existente del catálogo.
     */
    public function update(Request $request, Product $product): RedirectResponse
    {
        $attributes = $this->prepareProductAttributes($request, $product->image_url);
        $product->update($attributes);

        return redirect()->back()->with('success', '¡Producto actualizado en el catálogo!');
    }

    /**
     * Desactivar / eliminar un producto del catálogo activo.
     */
    public function destroy(Product $product): RedirectResponse
    {
        $product->update(['is_active' => false]);

        return redirect()->back()->with('success', 'Producto eliminado del catálogo.');
    }
}

