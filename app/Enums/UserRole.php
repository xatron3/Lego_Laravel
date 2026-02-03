<?php

namespace App\Enums;

enum UserRole: string
{
    case NORMAL = 'normal';
    case SUBMITTER = 'submitter';
    case MOD = 'mod';
    case ADMIN = 'admin';

    /**
     * Get all role values.
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get the display name for the role.
     */
    public function label(): string
    {
        return match ($this) {
            self::NORMAL => 'Normal User',
            self::SUBMITTER => 'Submitter',
            self::MOD => 'Moderator',
            self::ADMIN => 'Administrator',
        };
    }

    /**
     * Get the hierarchy level (higher = more permissions).
     */
    public function level(): int
    {
        return match ($this) {
            self::NORMAL => 0,
            self::SUBMITTER => 1,
            self::MOD => 2,
            self::ADMIN => 3,
        };
    }

    /**
     * Check if this role has at least the given role's permissions.
     */
    public function hasAtLeast(UserRole $role): bool
    {
        return $this->level() >= $role->level();
    }
}
