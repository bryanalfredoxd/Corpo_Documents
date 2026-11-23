<?php

namespace App\Http\Controllers;

use App\Services\BcvExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BcvController extends Controller
{
    /**
     * Consulta y devuelve la tasa de cambio oficial del Dólar BCV.
     */
    public function getRate(Request $request): JsonResponse
    {
        $force = $request->boolean('force', false);
        $data = BcvExchangeRateService::getLiveRate($force);

        return response()->json($data);
    }
}
