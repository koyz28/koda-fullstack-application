<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use App\Models\Project;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates query parameters for listing projects (search, filters, sorting, pagination).
 */
class ListProjectsRequest extends FormRequest
{
    public const DEFAULT_PER_PAGE = 10;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $sortable = collect(Project::SORTABLE)
            ->flatMap(fn (string $column) => [$column, "-{$column}"])
            ->all();

        return [
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::enum(ProjectStatus::class)],
            'priority' => ['nullable', Rule::enum(ProjectPriority::class)],
            'sort' => ['nullable', Rule::in($sortable)],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'sort.in' => 'The sort field must be one of: '.implode(', ', Project::SORTABLE).' (prefix with "-" for descending).',
        ];
    }

    public function status(): ?ProjectStatus
    {
        return $this->enum('status', ProjectStatus::class);
    }

    public function priority(): ?ProjectPriority
    {
        return $this->enum('priority', ProjectPriority::class);
    }

    public function perPage(): int
    {
        return $this->integer('per_page', self::DEFAULT_PER_PAGE);
    }
}
