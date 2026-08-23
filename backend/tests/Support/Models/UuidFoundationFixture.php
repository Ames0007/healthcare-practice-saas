<?php

namespace Tests\Support\Models;

use App\Models\Concerns\HasUuidPrimaryKey;
use Illuminate\Database\Eloquent\Model;

/**
 * Test-only model (TASK-005 §35): exists solely to prove the UUID/money
 * conventions against a real table, backed by a table created/dropped by
 * the test itself (see Tests\Feature\Database\DatabaseFoundationTest) —
 * never a production migration.
 */
class UuidFoundationFixture extends Model
{
    use HasUuidPrimaryKey;

    protected $table = 'uuid_foundation_fixtures';

    protected $guarded = [];
}
