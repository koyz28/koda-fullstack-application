<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

/**
 * Projects are private to the user who created them.
 */
class ProjectPolicy
{
    public function view(User $user, Project $project): bool
    {
        return $this->owns($user, $project);
    }

    public function update(User $user, Project $project): bool
    {
        return $this->owns($user, $project);
    }

    public function delete(User $user, Project $project): bool
    {
        return $this->owns($user, $project);
    }

    private function owns(User $user, Project $project): bool
    {
        return $project->user_id === $user->id;
    }
}
