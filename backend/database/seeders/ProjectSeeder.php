<?php

namespace Database\Seeders;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\File;
use RuntimeException;

/**
 * Imports the assessment's sample projects (test_data.json at the repository root)
 * for a given user. Re-running updates existing rows instead of duplicating them.
 */
class ProjectSeeder extends Seeder
{
    public static function dataPath(): string
    {
        return base_path('../test_data.json');
    }

    public function run(User $user): void
    {
        foreach ($this->records() as $record) {
            $user->projects()->updateOrCreate(
                [
                    'client_name' => $record['clientName'],
                    'project_name' => $record['projectName'],
                ],
                [
                    'description' => $record['description'] ?? null,
                    'status' => ProjectStatus::fromLabel($record['status']),
                    'priority' => ProjectPriority::fromLabel($record['priority']),
                    'start_date' => $record['startDate'],
                    'due_date' => $record['dueDate'] ?? null,
                ],
            );
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function records(): array
    {
        $path = self::dataPath();

        if (! File::exists($path)) {
            throw new RuntimeException("Seed data not found at [{$path}].");
        }

        return File::json($path, JSON_THROW_ON_ERROR);
    }
}
