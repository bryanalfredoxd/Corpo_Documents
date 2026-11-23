<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BcvExchangeRateService
{
    /**
     * Cache key para la tasa y metadata del BCV.
     */
    public const CACHE_KEY = 'bcv_official_rate_data';

    /**
     * Cache key permanente para la última tasa válida conocida (fallback offline).
     */
    public const FALLBACK_CACHE_KEY = 'bcv_last_valid_rate';

    /**
     * Tiempo de vida en caché normal (30 minutos).
     */
    public const CACHE_TTL_SECONDS = 1800;

    /**
     * URLs de consulta según la arquitectura del Job BCV referencial:
     * 1. DolarApi Oficial (ve.dolarapi.com/v1/dolares/oficial)
     * 2. PyDolarVenezuela (pydolarvenezuela-api.vercel.app / pydolarve.org)
     */
    private static array $apiUrls = [
        'https://ve.dolarapi.com/v1/dolares/oficial',
        'https://pydolarvenezuela-api.vercel.app/api/v1/dollar?page=bcv',
    ];

    /**
     * Obtiene la tasa oficial del Dólar BCV en tiempo real con caché y tolerancia a fallos.
     *
     * @param bool $forceRefresh Si es true, ignora la caché y consulta la API externa de inmediato.
     * @return array Metadata completa de la tasa oficial del BCV.
     */
    public static function getLiveRate(bool $forceRefresh = false): array
    {
        if (! $forceRefresh && Cache::has(self::CACHE_KEY)) {
            $cachedData = Cache::get(self::CACHE_KEY);
            if (is_array($cachedData) && ! empty($cachedData['rate']) && $cachedData['rate'] > 0) {
                $cachedData['cached'] = true;
                return $cachedData;
            }
        }

        try {
            $freshData = self::fetchFromExternalApis();
            $freshData['cached'] = false;

            // Almacenar en caché temporal (30 min) y en caché permanente como respaldo histórico
            Cache::put(self::CACHE_KEY, $freshData, self::CACHE_TTL_SECONDS);
            Cache::forever(self::FALLBACK_CACHE_KEY, $freshData);

            return $freshData;
        } catch (Exception $e) {
            Log::warning("BcvExchangeRateService: Falló la consulta externa de tasa BCV: " . $e->getMessage());

            // Si falla la consulta en vivo, intentar usar el último valor histórico conocido
            if (Cache::has(self::FALLBACK_CACHE_KEY)) {
                $fallback = Cache::get(self::FALLBACK_CACHE_KEY);
                if (is_array($fallback) && ! empty($fallback['rate'])) {
                    $fallback['cached'] = true;
                    $fallback['warning'] = 'No se pudo conectar con el servicio en vivo del BCV. Mostrando última tasa registrada.';
                    return $fallback;
                }
            }

            // Fallback base de contingencia si nunca ha habido internet
            return [
                'success' => false,
                'rate' => 918.77,
                'inverse_rate' => round(1 / 918.77, 8),
                'formatted_rate' => '918,77',
                'source' => 'Valor Base del Sistema (Offline)',
                'last_updated' => now('America/Caracas')->format('Y-m-d H:i:s'),
                'fetched_at' => now('America/Caracas')->format('Y-m-d H:i:s'),
                'cached' => true,
                'warning' => 'Sin conexión a la API oficial del BCV.',
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Consulta secuencialmente las APIs oficiales con cURL idéntico al job referencial.
     *
     * @throws Exception Si ninguna API responde favorablemente.
     */
    private static function fetchFromExternalApis(): array
    {
        $lastError = null;

        foreach (self::$apiUrls as $url) {
            try {
                $ch = curl_init();
                curl_setopt_array($ch, [
                    CURLOPT_URL => $url,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_TIMEOUT => 12,
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_SSL_VERIFYHOST => false,
                    CURLOPT_HTTPHEADER => [
                        'Accept: application/json',
                        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Cache-Control: no-cache',
                    ],
                ]);

                $responseBody = curl_exec($ch);

                if (curl_errno($ch)) {
                    $curlErr = curl_error($ch);
                    curl_close($ch);
                    throw new Exception("Error cURL conectando a {$url}: {$curlErr}");
                }

                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode !== 200 || empty($responseBody)) {
                    throw new Exception("HTTP {$httpCode} devuelto por {$url}");
                }

                $data = json_decode($responseBody, true);
                if (! is_array($data)) {
                    throw new Exception("Respuesta no es JSON válido en {$url}");
                }

                $rate = null;
                $sourceLabel = 'BCV Oficial';
                $updatedAt = null;

                // Formato 1: DolarApi ("promedio")
                if (isset($data['promedio']) && is_numeric($data['promedio']) && $data['promedio'] > 0) {
                    $rate = (float) $data['promedio'];
                    $sourceLabel = 'Banco Central de Venezuela (DolarApi)';
                    $updatedAt = $data['fechaActualizacion'] ?? null;
                }
                // Formato 2: PyDolarVenezuela ("monitors" -> "bcv" -> "price")
                elseif (isset($data['monitors']['bcv']['price']) && is_numeric($data['monitors']['bcv']['price']) && $data['monitors']['bcv']['price'] > 0) {
                    $rate = (float) $data['monitors']['bcv']['price'];
                    $sourceLabel = 'Banco Central de Venezuela (PyDolar)';
                    $updatedAt = $data['monitors']['bcv']['last_update'] ?? null;
                }

                if ($rate !== null && $rate > 0) {
                    $nowCaracas = now('America/Caracas');
                    return [
                        'success' => true,
                        'rate' => round($rate, 4),
                        'inverse_rate' => round(1 / $rate, 8),
                        'formatted_rate' => number_format($rate, 2, ',', '.'),
                        'source' => $sourceLabel,
                        'source_url' => $url,
                        'last_updated' => $updatedAt ? date('d/m/Y h:i A', strtotime($updatedAt)) : $nowCaracas->format('d/m/Y h:i A'),
                        'fetched_at' => $nowCaracas->format('d/m/Y h:i:s A'),
                    ];
                }

                throw new Exception("Estructura de respuesta no contiene tasa válida en {$url}");
            } catch (Exception $e) {
                $lastError = $e->getMessage();
            }
        }

        throw new Exception("No se pudo obtener la tasa oficial del BCV. Último error: " . $lastError);
    }
}
