<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Liveness check only: proves the application booted and can serve JSON.
 * Dependency readiness (database, cache, storage) is out of scope for this
 * endpoint until a later foundation task introduces it.
 */
class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'status' => 'ok',
        ]);
    }
}
