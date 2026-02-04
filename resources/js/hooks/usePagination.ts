import { useState, useEffect } from "react";

interface PaginationState {
    page: number;
    lastPage: number;
    total: number;
}

/**
 * Hook for managing pagination state
 * @param dependencies - Array of dependencies that should reset pagination
 * @returns Pagination state and setter functions
 */
export function usePagination(dependencies: any[] = []) {
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationState>({
        page: 1,
        lastPage: 1,
        total: 0,
    });

    // Reset to page 1 when dependencies change
    useEffect(() => {
        setPage(1);
    }, dependencies);

    return {
        page,
        setPage,
        pagination,
        setPagination: (data: Partial<PaginationState>) => {
            setPagination((prev) => ({ ...prev, ...data }));
        },
    };
}
