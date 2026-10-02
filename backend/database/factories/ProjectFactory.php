<?php

namespace Database\Factories;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-3 months', '+1 month');

        return [
            'user_id' => User::factory(),
            'client_name' => fake()->company(),
            'project_name' => trim(fake()->randomElement([
                'Website Redesign', 'Brand Refresh', 'Mobile App MVP', 'E-commerce Launch',
                'SEO Audit', 'Marketing Campaign', 'CRM Integration', 'Analytics Dashboard',
                'Customer Portal', 'Content Strategy', 'Accessibility Review', 'Email Automation',
            ]).' '.fake()->randomElement(['', 'Phase 2', '2027', 'v2', 'Pilot'])),
            'description' => fake()->optional(0.8)->sentence(12),
            'status' => fake()->randomElement(ProjectStatus::cases()),
            'priority' => fake()->randomElement(ProjectPriority::cases()),
            'start_date' => $start,
            'due_date' => fake()->optional(0.9)->dateTimeBetween($start, (clone $start)->modify('+6 months')),
        ];
    }

    public function status(ProjectStatus $status): static
    {
        return $this->state(['status' => $status]);
    }

    public function priority(ProjectPriority $priority): static
    {
        return $this->state(['priority' => $priority]);
    }
}
