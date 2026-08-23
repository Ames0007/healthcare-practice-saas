<?php

namespace Tests\Feature\Database;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Ramsey\Uuid\Uuid;
use Tests\Support\Models\UuidFoundationFixture;
use Tests\TestCase;

/**
 * Proves the TASK-005 PostgreSQL/UUID/money foundation against a real
 * PostgreSQL connection (see phpunit.xml — DB_DATABASE is the dedicated
 * healthcare_practice_test database, never the development database).
 *
 * The fixture table is test-only infrastructure (Spec 06 TASK-005 §35):
 * created in setUp(), dropped in tearDown(), never a production migration
 * — database/migrations/ stays deliberately empty.
 */
class DatabaseFoundationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('uuid_foundation_fixtures', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('label');
            $table->decimal('amount', 14, 2)->nullable();
            $table->timestampsTz();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('uuid_foundation_fixtures');

        parent::tearDown();
    }

    public function test_postgres_test_connection_works(): void
    {
        $this->assertSame('pgsql', DB::connection()->getDriverName());

        $version = DB::selectOne('select version() as version')->version;
        $this->assertStringContainsString('PostgreSQL', $version);

        $this->assertSame(1, DB::selectOne('select 1 as ok')->ok);
    }

    public function test_isolation_uses_dedicated_test_database(): void
    {
        $this->assertSame(
            'healthcare_practice_test',
            DB::connection()->getDatabaseName(),
            'Tests must never target the normal development database.',
        );
    }

    public function test_uuid_convention_produces_valid_uuids(): void
    {
        $fixture = UuidFoundationFixture::create(['label' => 'uuid check']);

        $this->assertTrue(Str::isUuid($fixture->id));
        $this->assertSame(7, Uuid::fromString($fixture->id)->getFields()->getVersion());
    }

    public function test_uuid_strategy_is_non_incrementing(): void
    {
        $fixture = new UuidFoundationFixture();

        $this->assertFalse($fixture->getIncrementing());
        $this->assertSame('string', $fixture->getKeyType());
    }

    public function test_uuid_round_trips_through_postgresql(): void
    {
        $fixture = UuidFoundationFixture::create(['label' => 'round trip']);
        $originalId = $fixture->id;

        $fresh = UuidFoundationFixture::query()->findOrFail($originalId);

        $this->assertSame($originalId, $fresh->id);
        $this->assertSame('round trip', $fresh->label);
    }

    public function test_money_convention_uses_fixed_precision_numeric(): void
    {
        $columnType = DB::selectOne(
            "select data_type, numeric_precision, numeric_scale
             from information_schema.columns
             where table_name = 'uuid_foundation_fixtures' and column_name = 'amount'",
        );

        $this->assertSame('numeric', $columnType->data_type);
        $this->assertSame(14, (int) $columnType->numeric_precision);
        $this->assertSame(2, (int) $columnType->numeric_scale);

        $fixture = UuidFoundationFixture::create([
            'label' => 'money check',
            'amount' => '1234567890.12',
        ]);

        $fresh = UuidFoundationFixture::query()->findOrFail($fixture->id);

        // Exact string comparison: a float would have silently lost
        // precision or introduced rounding error on a value this size.
        $this->assertSame('1234567890.12', $fresh->amount);
    }
}
