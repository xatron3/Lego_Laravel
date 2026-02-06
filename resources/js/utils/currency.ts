/**
 * Currency formatting utilities based on user settings.
 */

export interface CurrencySettings {
    currency_symbol: string;
    currency_placement: "left" | "right";
}

const defaultSettings: CurrencySettings = {
    currency_symbol: "$",
    currency_placement: "left",
};

/**
 * Format a number as currency based on user settings.
 */
export function formatCurrency(
    value: number,
    settings?: Partial<CurrencySettings>,
    options: { precise?: boolean } = {},
): string {
    const config = { ...defaultSettings, ...settings };
    const { precise = false } = options;

    const formatted = new Intl.NumberFormat("en-US", {
        minimumFractionDigits: precise ? 2 : 0,
        maximumFractionDigits: precise ? 2 : 0,
    }).format(Math.abs(value));

    const sign = value < 0 ? "-" : "";
    const formattedWithCurrency =
        config.currency_placement === "left"
            ? `${config.currency_symbol}${formatted}`
            : `${formatted}${config.currency_symbol}`;

    return `${sign}${formattedWithCurrency}`;
}

/**
 * Get currency settings from user object.
 */
export function getCurrencySettings(user: any): CurrencySettings {
    if (!user?.settings?.flipping) {
        return defaultSettings;
    }

    return {
        currency_symbol:
            user.settings.flipping.currency_symbol ??
            defaultSettings.currency_symbol,
        currency_placement:
            user.settings.flipping.currency_placement ??
            defaultSettings.currency_placement,
    };
}
