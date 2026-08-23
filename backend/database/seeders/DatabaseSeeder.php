<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // No seed data yet. Identity/Tenancy (Phase 1) introduces the
        // first real domain entities per Specification #4 — this seeder
        // stays empty until then (TASK-005).
    }
}
