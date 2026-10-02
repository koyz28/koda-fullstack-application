<?php

namespace Tests\Feature\Seeders;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\ProjectSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_imports_every_project_from_the_sample_data_file(): void
    {
        $this->seed(DatabaseSeeder::class);

        $user = User::where('email', 'demo@example.com')->sole();
        $expected = File::json(ProjectSeeder::dataPath());

        $this->assertSame(count($expected), $user->projects()->count());

        $project = $user->projects()->where('project_name', 'Corporate Website Redesign')->sole();
        $this->assertSame('Acme Corporation', $project->client_name);
        $this->assertSame(ProjectStatus::InProgress, $project->status);
        $this->assertSame(ProjectPriority::High, $project->priority);
        $this->assertSame('2026-06-01', $project->start_date->toDateString());
        $this->assertSame('2026-07-15', $project->due_date->toDateString());
    }

    public function test_it_is_safe_to_run_repeatedly(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(1, User::count());
        $this->assertSame(count(File::json(ProjectSeeder::dataPath())), User::sole()->projects()->count());
    }
}
