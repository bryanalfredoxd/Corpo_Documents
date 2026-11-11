<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\Encoders\PngEncoder;
use Intervention\Image\Laravel\Facades\Image;

class ImageOptimizerService
{
    private const MAX_DIMENSION = 1000;
    private const JPEG_QUALITY = 82;

    /**
     * Optimiza y guarda un archivo subido en Storage público + espejo en public/storage (compatible con cPanel).
     */
    public function optimizeUploadedFile(UploadedFile $file, string $directory): string
    {
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg');
        $directory = trim($directory, '/');

        if (in_array($ext, ['svg', 'gif'], true)) {
            $filename = Str::random(40) . '.' . $ext;
            $bytes = file_get_contents($file->getRealPath());

            return $this->storeDualCopy($directory, $filename, $bytes);
        }

        try {
            $targetExt = $ext === 'png' ? 'png' : 'jpg';
            $filename = Str::random(40) . '.' . $targetExt;
            $bytes = $this->encodeRasterBytes(file_get_contents($file->getRealPath()), $targetExt);

            return $this->storeDualCopy($directory, $filename, $bytes);
        } catch (\Throwable) {
            $filename = $file->hashName();
            $bytes = file_get_contents($file->getRealPath());

            return $this->storeDualCopy($directory, $filename, $bytes);
        }
    }

    /**
     * Optimiza y guarda una imagen Data URI Base64 retornando la ruta pública '/storage/...'.
     */
    public function optimizeBase64Image(string $dataUri, string $directory): ?string
    {
        if (! preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,/', $dataUri, $matches)) {
            return null;
        }

        $rawExt = strtolower($matches[1]);
        $ext = match ($rawExt) {
            'jpeg' => 'jpg',
            'svg+xml' => 'svg',
            default => $rawExt,
        };

        $base64Data = substr($dataUri, strpos($dataUri, ',') + 1);
        $decoded = base64_decode($base64Data, true);
        if ($decoded === false) {
            return null;
        }

        $directory = trim($directory, '/');

        if (in_array($ext, ['svg', 'gif'], true)) {
            $filename = Str::random(40) . '.' . $ext;

            return $this->storeDualCopy($directory, $filename, $decoded);
        }

        try {
            $targetExt = $ext === 'png' ? 'png' : 'jpg';
            $filename = Str::random(40) . '.' . $targetExt;
            $bytes = $this->encodeRasterBytes($decoded, $targetExt);

            return $this->storeDualCopy($directory, $filename, $bytes);
        } catch (\Throwable) {
            $filename = Str::random(40) . '.' . ($ext ?: 'jpg');

            return $this->storeDualCopy($directory, $filename, $decoded);
        }
    }

    /**
     * Genera un Data URI Base64 compacto y cacheado para incrustación ultrarrápida en DomPDF.
     */
    public function toPdfDataUri(string $filePath, int $maxDim = 500): ?string
    {
        if (! is_file($filePath) || ! is_readable($filePath)) {
            return null;
        }

        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mime = match ($ext) {
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'svg' => 'image/svg+xml',
            default => null,
        };
        if (! $mime) {
            return null;
        }

        $size = @filesize($filePath) ?: 0;
        if ($size <= 80 * 1024 || in_array($ext, ['svg', 'gif'], true)) {
            $bytes = @file_get_contents($filePath);

            return $bytes !== false ? 'data:' . $mime . ';base64,' . base64_encode($bytes) : null;
        }

        $cacheDir = storage_path('app/pdf-cache');
        $cacheFile = $cacheDir . DIRECTORY_SEPARATOR . md5($filePath . '|' . (@filemtime($filePath) ?: 0) . '|' . $maxDim) . '.datauri';
        if (is_file($cacheFile)) {
            $cached = @file_get_contents($cacheFile);
            if ($cached !== false && $cached !== '') {
                return $cached;
            }
        }

        $rawBytes = @file_get_contents($filePath);
        if ($rawBytes === false) {
            return null;
        }

        try {
            $targetExt = $ext === 'png' ? 'png' : 'jpg';
            $targetMime = $targetExt === 'png' ? 'image/png' : 'image/jpeg';
            $optimizedBytes = $this->encodeRasterBytes($rawBytes, $targetExt, $maxDim);
            $dataUri = 'data:' . $targetMime . ';base64,' . base64_encode($optimizedBytes);

            if (! is_dir($cacheDir)) {
                @mkdir($cacheDir, 0755, true);
            }
            @file_put_contents($cacheFile, $dataUri);

            return $dataUri;
        } catch (\Throwable) {
            return 'data:' . $mime . ';base64,' . base64_encode($rawBytes);
        }
    }

    /**
     * Redimensiona proporcionalmente (sin ampliar imágenes pequeñas), corrige rotación EXIF y comprime bytes.
     */
    private function encodeRasterBytes(string $rawBytes, string $targetExt, int $maxDim = self::MAX_DIMENSION): string
    {
        $image = Image::decodeBinary($rawBytes)
            ->orient()
            ->scaleDown(width: $maxDim, height: $maxDim);

        $encoder = $targetExt === 'png'
            ? new PngEncoder(strip: true)
            : new JpegEncoder(quality: self::JPEG_QUALITY, progressive: true, strip: true);

        return (string) $image->encode($encoder);
    }

    /**
     * Persiste la copia en disk('public') y copia directa en public/storage para hosting compartido sin symlink.
     */
    private function storeDualCopy(string $directory, string $filename, string $bytes): string
    {
        $relativePath = $directory . '/' . $filename;
        Storage::disk('public')->put($relativePath, $bytes);

        $publicFolder = public_path('storage/' . $directory);
        if (! file_exists($publicFolder)) {
            @mkdir($publicFolder, 0755, true);
        }
        @file_put_contents($publicFolder . DIRECTORY_SEPARATOR . $filename, $bytes);

        return '/storage/' . $relativePath;
    }
}

