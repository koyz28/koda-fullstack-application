<?php

namespace Tests\Feature\Projects;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = Sanctum::actingAs(User::factory()->create());
    }

    public function test_it_lists_the_authenticated_users_projects_with_pagination_meta(): void
    {
        Project::factory()->count(3)->for($this->user)->create();
        Project::factory()->count(2)->create(); // other users' projects

        $this->getJson('/api/projects')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonStructure([
                'data' => [['id', 'client_name', 'project_name', 'description', 'status', 'status_label', 'priority', 'priority_label', 'start_date', 'due_date', 'created_at', 'updated_at']],
                'links',
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ])
            ->assertJsonPath('meta.total', 3);
    }

    public function test_it_shows_a_single_project(): void
    {
        $project = Project::factory()->for($this->user)->create([
            'status' => ProjectStatus::InProgress,
            'start_date' => '2026-01-10',
        ]);

        $this->getJson("/api/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $project->id)
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.status_label', 'In Progress')
            ->assertJsonPath('data.start_date', '2026-01-10');
    }

    public function test_it_returns_a_meaningful_404_for_missing_projects(): void
    {
        $this->getJson('/api/projects/999')
            ->assertNotFound()
            ->assertExactJson(['message' => 'Project not found.']);
    }

    public function test_it_creates_a_project(): void
    {
        $payload = [
            'client_name' => 'Acme Corp',
            'project_name' => 'Website Redesign',
            'description' => 'Full redesign of the marketing site.',
            'status' => 'planning',
            'priority' => 'high',
            'start_date' => '2026-10-01',
            'due_date' => '2026-12-15',
        ];

        $this->postJson('/api/projects', $payload)
            ->assertCreated()
            ->assertJsonPath('data.client_name', 'Acme Corp')
            ->assertJsonPath('data.priority', 'high')
            ->assertJsonPath('data.due_date', '2026-12-15');

        $this->assertDatabaseHas('projects', [
            'user_id' => $this->user->id,
            'project_name' => 'Website Redesign',
            'status' => 'planning',
        ]);
    }

    public function test_it_trims_names_and_ignores_unknown_fields_on_create(): void
    {
        $other = User::factory()->create();

        $this->postJson('/api/projects', [
            'client_name' => '  Acme Corp  ',
            'project_name' => ' Website ',
            'status' => 'planning',
            'priority' => 'low',
            'start_date' => '2026-10-01',
            'user_id' => $other->id,
        ])->assertCreated()
            ->assertJsonPath('data.client_name', 'Acme Corp')
            ->assertJsonPath('data.project_name', 'Website')
            ->assertJsonPath('data.due_date', null);

        $this->assertSame($this->user->id, Project::sole()->user_id);
    }

    public function test_it_updates_a_project(): void
    {
        $project = Project::factory()->for($this->user)->create();

        $this->putJson("/api/projects/{$project->id}", [
            'client_name' => 'Globex',
            'project_name' => 'Mobile App',
            'description' => null,
            'status' => ProjectStatus::Completed->value,
            'priority' => ProjectPriority::Low->value,
            'start_date' => '2026-01-01',
            'due_date' => '2026-01-01',
        ])
            ->assertOk()
            ->assertJsonPath('data.client_name', 'Globex')
            ->assertJsonPath('data.status', 'completed');

        $this->assertSame(ProjectStatus::Completed, $project->refresh()->status);
    }

    public function test_it_deletes_a_project(): void
    {
        $project = Project::factory()->for($this->user)->create();

        $this->deleteJson("/api/projects/{$project->id}")->assertNoContent();

        $this->assertModelMissing($project);
    }
}
