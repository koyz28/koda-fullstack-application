<?php

namespace App\Models;

use App\Enums\ProjectPriority;
use App\Enums\ProjectStatus;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'client_name',
    'project_name',
    'description',
    'status',
    'priority',
    'start_date',
    'due_date',
])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    /**
     * Columns the API is allowed to sort by.
     */
    public const SORTABLE = [
        'client_name',
        'project_name',
        'status',
        'priority',
        'start_date',
        'due_date',
        'created_at',
    ];

    public const DEFAULT_SORT = '-created_at';

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'priority' => ProjectPriority::class,
            'start_date' => 'date',
            'due_date' => 'date',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Case-insensitive match against client name, project name and description.
     */
    #[Scope]
    protected function search(Builder $query, ?string $term): void
    {
        $term = trim((string) $term);

        if ($term === '') {
            return;
        }

        $like = '%'.addcslashes($term, '%_\\').'%';

        $query->where(function (Builder $query) use ($like) {
            $query->where('client_name', 'like', $like)
                ->orWhere('project_name', 'like', $like)
                ->orWhere('description', 'like', $like);
        });
    }

    #[Scope]
    protected function withStatus(Builder $query, ?ProjectStatus $status): void
    {
        $query->when($status, fn (Builder $query) => $query->where('status', $status->value));
    }

    #[Scope]
    protected function withPriority(Builder $query, ?ProjectPriority $priority): void
    {
        $query->when($priority, fn (Builder $query) => $query->where('priority', $priority->value));
    }

    /**
     * Apply a sort expression such as "due_date" or "-priority" (leading "-" = descending).
     *
     * Status and priority are ordered by business meaning (enum declaration order)
     * rather than alphabetically, using a portable CASE expression.
     */
    #[Scope]
    protected function sortBy(Builder $query, ?string $sort): void
    {
        $sort = $sort ?: self::DEFAULT_SORT;
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');

        if (! in_array($column, self::SORTABLE, true)) {
            $column = ltrim(self::DEFAULT_SORT, '-');
            $direction = 'desc';
        }

        $enum = match ($column) {
            'status' => ProjectStatus::class,
            'priority' => ProjectPriority::class,
            default => null,
        };

        if ($enum !== null) {
            $cases = collect($enum::values())
                ->map(fn (string $value, int $index) => "WHEN '{$value}' THEN {$index}")
                ->implode(' ');

            $query->orderByRaw("CASE {$column} {$cases} END {$direction}");
        } else {
            $query->orderBy($column, $direction);
        }

        // Deterministic tie-breaker so pagination is stable.
        $query->orderBy('id', $direction);
    }
}
