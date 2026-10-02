<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the full project payload for both create (POST) and replace (PUT).
 */
class SaveProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Ownership of an existing project is enforced by ProjectPolicy in the controller.
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'client_name' => is_string($this->client_name) ? trim($this->client_name) : $this->client_name,
            'project_name' => is_string($this->project_name) ? trim($this->project_name) : $this->project_name,
            'description' => is_string($this->description) && trim($this->description) === '' ? null : $this->description,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'client_name' => ['required', 'string', 'max:255'],
            'project_name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
            'priority' => ['required', Rule::enum(ProjectPriority::class)],
            'start_date' => ['required', 'date_format:Y-m-d'],
            'due_date' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.enum' => 'The status must be one of: '.implode(', ', ProjectStatus::values()).'.',
            'priority.enum' => 'The priority must be one of: '.implode(', ', ProjectPriority::values()).'.',
            'due_date.after_or_equal' => 'The due date cannot be earlier than the start date.',
            'start_date.date_format' => 'The start date must be a valid date in YYYY-MM-DD format.',
            'due_date.date_format' => 'The due date must be a valid date in YYYY-MM-DD format.',
        ];
    }
}
