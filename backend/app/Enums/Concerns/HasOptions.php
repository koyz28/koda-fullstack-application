<?php

namespace App\Enums\Concerns;

/**
 * Shared helpers for string-backed enums exposed through the API.
 *
 * The declaration order of the cases is meaningful: it is used as the
 * natural (business) order when sorting, e.g. Low < Medium < High.
 */
trait HasOptions
{
    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Resolve a case from its human-readable label (e.g. "In Progress").
     *
     * @throws \ValueError when no case has the given label
     */
    public static function fromLabel(string $label): self
    {
        foreach (self::cases() as $case) {
            if (strcasecmp($case->label(), trim($label)) === 0) {
                return $case;
            }
        }

        throw new \ValueError(sprintf('"%s" is not a valid label for enum %s', $label, self::class));
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (self $case) => ['value' => $case->value, 'label' => $case->label()],
            self::cases(),
        );
    }
}
