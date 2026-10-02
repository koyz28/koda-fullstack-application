<?php

namespace Tests\Unit\Enums;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use PHPUnit\Framework\TestCase;

class ProjectEnumsTest extends TestCase
{
    public function test_status_values_match_the_specification(): void
    {
        $this->assertSame(['planning', 'in_progress', 'on_hold', 'completed'], ProjectStatus::values());
    }

    public function test_priority_values_are_declared_in_ascending_order(): void
    {
        $this->assertSame(['low', 'medium', 'high'], ProjectPriority::values());
    }

    public function test_options_expose_human_readable_labels(): void
    {
        $this->assertContains(['value' => 'in_progress', 'label' => 'In Progress'], ProjectStatus::options());
        $this->assertContains(['value' => 'on_hold', 'label' => 'On Hold'], ProjectStatus::options());
        $this->assertSame('High', ProjectPriority::High->label());
    }

    public function test_cases_can_be_resolved_from_their_labels(): void
    {
        $this->assertSame(ProjectStatus::InProgress, ProjectStatus::fromLabel('In Progress'));
        $this->assertSame(ProjectStatus::OnHold, ProjectStatus::fromLabel(' on hold '));
        $this->assertSame(ProjectPriority::Low, ProjectPriority::fromLabel('Low'));
    }

    public function test_unknown_labels_are_rejected(): void
    {
        $this->expectException(\ValueError::class);

        ProjectStatus::fromLabel('Cancelled');
    }
}
