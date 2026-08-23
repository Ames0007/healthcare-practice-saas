<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthEndpointTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'application/json')
            ->assertExactJson(['status' => 'ok']);
    }

    public function test_unknown_api_route_does_not_expose_debug_information(): void
    {
        $response = $this->getJson('/api/v1/this-route-does-not-exist');

        $response->assertStatus(404);

        $response->assertJsonMissingPath('exception');
        $response->assertJsonMissingPath('file');
        $response->assertJsonMissingPath('line');
        $response->assertJsonMissingPath('trace');

        $this->assertStringNotContainsString(base_path(), $response->getContent());
    }
}
