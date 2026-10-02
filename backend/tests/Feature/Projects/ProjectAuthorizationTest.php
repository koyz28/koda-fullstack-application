<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private Project $foreignProject;

    protected function setUp(): void
    {
        parent::setUp();

        $this->foreignProject = Project::factory()->create();

        Sanctum::actingAs(User::factory()->create());
    }

    public function test_user_cannot_view_another_users_project(): void
    {
        $this->getJson("/api/projects/{$this->foreignProject->id}")->assertForbidden();
    }

    public function test_user_cannot_update_another_users_project(): void
    {
        $this->putJson("/api/projects/{$this->foreignProject->id}", [
            'client_name' => 'Hijacked',
            'project_name' => 'Hijacked',
            'status' => 'planning',
            'priority' => 'low',
            'start_date' => '2026-01-01',
        ])->assertForbidden();

        $this->assertNotSame('Hijacked', $this->foreignProject->refresh()->client_name);
    }

    public function test_user_cannot_delete_another_users_project(): void
    {
        $this->deleteJson("/api/projects/{$this->foreignProject->id}")->assertForbidden();

        $this->assertModelExists($this->foreignProject);
    }
}
