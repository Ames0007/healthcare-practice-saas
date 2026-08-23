<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * Project-wide primary-key convention (TASK-005, Specification #4 §2.4):
 * application-generated UUIDv7 (RFC 9562, via Str::uuid7()), stored as a
 * native PostgreSQL `uuid` column (migrations must use $table->uuid('id')
 * ->primary(), never varchar), non-incrementing, string key type.
 *
 * Laravel's built-in HasUuids trait already generates UUIDv7 by default
 * and configures non-incrementing/string-key behavior via
 * HasUniqueStringIds — this trait exists so future domain models depend
 * on one project-owned name rather than composing HasUuids directly,
 * keeping the strategy in one place if it's ever revisited.
 */
trait HasUuidPrimaryKey
{
    use HasUuids;
}
