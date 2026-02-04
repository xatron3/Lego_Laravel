import { useState } from "react";

/**
 * Hook for handling image loading with fallback options
 * @param primaryUrl - Primary image URL to load
 * @param fallbackUrl - Optional fallback URL if primary fails
 * @returns Object with current image URL and error handler
 */
export function useImageFallback(primaryUrl: string, fallbackUrl?: string) {
    const [imgError, setImgError] = useState(false);
    const [fallbackError, setFallbackError] = useState(false);

    const handleError = () => {
        if (!imgError) {
            setImgError(true);
        } else if (fallbackUrl && !fallbackError) {
            setFallbackError(true);
        }
    };

    const imageUrl = !imgError
        ? primaryUrl
        : !fallbackError && fallbackUrl
          ? fallbackUrl
          : null;

    return {
        imageUrl,
        hasError: !imageUrl,
        handleError,
    };
}
