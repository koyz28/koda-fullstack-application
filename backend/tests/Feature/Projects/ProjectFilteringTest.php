<?php

namespace Tests\Feature\Projects;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectFilteringTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = Sanctum::actingAs(User::factory()->create());
    }

    public function test_it_searches_by_client_project_name_and_description(): void
    {
        $factory = Project::factory()->for($this->user);
        $factory->create(['client_name' => 'Acme Corp', 'project_name' => 'Alpha', 'description' => null]);
        $factory->create(['client_name' => 'Globex', 'project_name' => 'Acme integration', 'description' => null]);
        $factory->create(['client_name' => 'Initech', 'project_name' => 'Beta', 'description' => 'Migrate ACME data']);
        $factory->create(['client_name' => 'Umbrella', 'project_name' => 'Gamma', 'description' => 'Unrelated']);

        $this->getJson('/api/projects?search=acme')
            ->assertOk()
            ->assertJsonCount(3, 'data');
    }

    public function test_search_treats_wildcards_literally(): void
    {
        Project::factory()->for($this->user)->create(['client_name' => 'Acme', 'project_name' => 'Plain', 'description' => null]);

        $this->getJson('/api/projects?search=%25')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_it_filters_by_status_and_priority(): void
    {
        $factory = Project::factory()->for($this->user);
        $factory->status(ProjectStatus::OnHold)->priority(ProjectPriority::High)->create();
        $factory->status(ProjectStatus::OnHold)->priority(ProjectPriority::Low)->create();
        $factory->status(ProjectStatus::Completed)->priority(ProjectPriority::High)->create();

        $this->getJson('/api/projects?status=on_hold')->assertJsonCount(2, 'data');
        $this->getJson('/api/projects?priority=high')->assertJsonCount(2, 'data');
        $this->getJson('/api/projects?status=on_hold&priority=high')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'on_hold')
            ->assertJsonPath('data.0.priority', 'high');
    }

    public function test_it_sorts_by_priority_in_business_order(): void
    {
        $factory = Project::factory()->for($this->user);
        $factory->priority(ProjectPriority::Medium)->create();
        $factory->priority(ProjectPriority::High)->create();
        $factory->priority(ProjectPriority::Low)->create();

        $this->getJson('/api/projects?sort=-priority')
            ->assertOk()
            ->assertJsonPath('data.*.priority', ['high', 'medium', 'low']);

        $this->getJson('/api/projects?sort=priority')
            ->assertJsonPath('data.*.priority', ['low', 'medium', 'high']);
    }

    public function test_it_sorts_by_date_columns(): void
    {
        $factory = Project::factory()->for($this->user);
        $factory->create(['start_date' => '2026-01-01', 'due_date' => '2026-03-01']);
        $factory->create(['start_date' => '2026-01-01', 'due_date' => '2026-02-01']);

        $this->getJson('/api/projects?sort=due_date')
            ->assertJsonPath('data.*.due_date', ['2026-02-01', '2026-03-01']);
    }

    public function test_it_paginates_results(): void
    {
        Project::factory()->count(15)->for($this->user)->create();

        $this->getJson('/api/projects?per_page=5&page=2')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 15);
    }

    public function test_it_rejects_invalid_query_parameters(): void
    {
        $this->getJson('/api/projects?status=unknown&priority=urgent&sort=password&per_page=1000')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['status', 'priority', 'sort', 'per_page']);
    }
}
