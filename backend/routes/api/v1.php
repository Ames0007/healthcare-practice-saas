<?php

use App\Http\Controllers\Api\V1\HealthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 Routes
|--------------------------------------------------------------------------
|
| Loaded under the /api/v1 prefix by routes/api.php. Module route files
| will be required from here as they are implemented (e.g. Identity,
| Patients, Scheduling); no business module routes exist yet.
|
*/

Route::get('/health', HealthController::class);
