<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| All API routes are versioned. Each version's routes live in their own
| file under routes/api/ and are loaded here under a version prefix, so
| module route files can be added later without touching this file.
|
*/

Route::prefix('v1')->group(base_path('routes/api/v1.php'));
