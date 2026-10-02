<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ProjectValidationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Sanctum::actingAs(User::factory()->create());
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'client_name' => 'Acme Corp',
            'project_name' => 'Website Redesign',
            'description' => null,
            'status' => 'planning',
            'priority' => 'medium',
            'start_date' => '2026-10-01',
            'due_date' => '2026-10-31',
        ], $overrides);
    }

    /**
     * @return array<string, array{0: array<string, mixed>, 1: string}>
     */
    public static function invalidPayloads(): array
    {
        return [
            'missing client name' => [['client_name' => null], 'client_name'],
            'blank client name' => [['client_name' => '   '], 'client_name'],
            'missing project name' => [['project_name' => ''], 'project_name'],
            'too long project name' => [['project_name' => str_repeat('a', 256)], 'project_name'],
            'invalid status' => [['status' => 'archived'], 'status'],
            'missing status' => [['status' => null], 'status'],
            'invalid priority' => [['priority' => 'urgent'], 'priority'],
            'missing start date' => [['start_date' => null], 'start_date'],
            'malformed start date' => [['start_date' => '01/10/2026'], 'start_date'],
            'malformed due date' => [['due_date' => 'tomorrow'], 'due_date'],
            'due date before start date' => [['due_date' => '2026-09-30'], 'due_date'],
        ];
    }

    #[DataProvider('invalidPayloads')]
    public function test_create_rejects_invalid_payloads(array $overrides, string $field): void
    {
        $this->postJson('/api/projects', $this->validPayload($overrides))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field]);

        $this->assertDatabaseCount('projects', 0);
    }

    #[DataProvider('invalidPayloads')]
    public function test_update_rejects_invalid_payloads(array $overrides, string $field): void
    {
        $project = Project::factory()->for(auth()->user())->create();

        $this->putJson("/api/projects/{$project->id}", $this->validPayload($overrides))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field]);
    }

    public function test_error_messages_are_human_readable(): void
    {
        $this->postJson('/api/projects', $this->validPayload([
            'client_name' => '',
            'status' => 'archived',
            'priority' => 'urgent',
            'due_date' => '2026-01-01',
        ]))
            ->assertUnprocessable()
            ->assertJsonPath('errors.client_name.0', 'The client name field is required.')
            ->assertJsonPath('errors.status.0', 'The status must be one of: planning, in_progress, on_hold, completed.')
            ->assertJsonPath('errors.priority.0', 'The priority must be one of: low, medium, high.')
            ->assertJsonPath('errors.due_date.0', 'The due date cannot be earlier than the start date.');
    }

    public function test_due_date_may_equal_start_date_or_be_omitted(): void
    {
        $this->postJson('/api/projects', $this->validPayload(['due_date' => '2026-10-01']))->assertCreated();
        $this->postJson('/api/projects', $this->validPayload(['due_date' => null]))->assertCreated();
    }
}
