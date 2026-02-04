const API_BASE = "/api";

// Get CSRF token from meta tag or cookie
function getCsrfToken(): string {
    // Try meta tag first
    const metaToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");
    if (metaToken) return metaToken;

    // Fallback to cookie (for Inertia)
    const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("XSRF-TOKEN="));
    if (cookie) {
        return decodeURIComponent(cookie.split("=")[1]);
    }

    return "";
}

// Ensure CSRF cookie is set before making authenticated requests
async function ensureCsrfCookie(): Promise<void> {
    await fetch("/sanctum/csrf-cookie", {
        credentials: "same-origin",
    });
}

export interface LegoModelData {
    id?: number;
    name: string;
    description?: string;
    ldr_content: string;
    file_name?: string;
    total_steps: number;
    total_parts: number;
    user_id?: number;
    is_public?: boolean;
    price?: number | null;
    thumbnail?: string | null;
    created_at?: string;
    set_num?: string;
    parts?: InventoryPartData[];
    parts_count?: number;
    user?: {
        id: number;
        name: string;
    };
}

export interface InventoryPartData {
    part_num: string;
    name: string;
    category: string;
    color_id: number;
    color_name: string;
    color_rgb: string;
    quantity: number;
    is_spare: boolean;
    image_url: string;
    photo_url?: string;
    bricklink_url: string;
}

export const api = {
    async getModels(): Promise<LegoModelData[]> {
        const response = await fetch(`${API_BASE}/lego-models`, {
            headers: {
                Accept: "application/json",
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch models");
        return response.json();
    },

    async getMyModels(): Promise<LegoModelData[]> {
        const response = await fetch(`${API_BASE}/my-models`, {
            headers: {
                Accept: "application/json",
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch models");
        return response.json();
    },

    async getModel(id: number): Promise<LegoModelData> {
        const response = await fetch(`${API_BASE}/lego-models/${id}`, {
            headers: {
                Accept: "application/json",
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch model");
        return response.json();
    },

    async saveModel(
        data: Omit<LegoModelData, "id" | "created_at" | "user">,
    ): Promise<LegoModelData> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/lego-models`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to save model");
        return response.json();
    },

    async updateModel(
        id: number,
        data: Partial<Omit<LegoModelData, "id" | "created_at" | "user">>,
    ): Promise<LegoModelData> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/lego-models/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error("Failed to update model");
        return response.json();
    },

    async deleteModel(id: number): Promise<void> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/lego-models/${id}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to delete model");
    },

    // Stats endpoint for homepage
    async getStats(): Promise<{
        total_models: number;
        free_models: number;
        paid_models: number;
        total_users: number;
        total_parts: number;
    }> {
        const response = await fetch(`${API_BASE}/stats`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch stats");
        return response.json();
    },

    // Store listing with filters
    async getStoreModels(params?: {
        filter?: "all" | "free" | "paid";
        search?: string;
        sort?: string;
        featured?: boolean;
        limit?: number;
    }): Promise<LegoModelData[]> {
        const searchParams = new URLSearchParams();
        if (params?.filter) searchParams.append("filter", params.filter);
        if (params?.search) searchParams.append("search", params.search);
        if (params?.sort) searchParams.append("sort", params.sort);
        if (params?.featured) searchParams.append("featured", "true");
        if (params?.limit)
            searchParams.append("limit", params.limit.toString());

        const response = await fetch(
            `${API_BASE}/store?${searchParams.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch store models");
        return response.json();
    },

    // Dashboard models with ownership filter
    async getDashboardModels(
        filter?: "all" | "created" | "owned",
    ): Promise<(LegoModelData & { ownership_type?: string })[]> {
        const params = filter ? `?filter=${filter}` : "";
        const response = await fetch(`${API_BASE}/dashboard/models${params}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch dashboard models");
        return response.json();
    },

    // Check model ownership
    async checkOwnership(
        id: number,
    ): Promise<{ owns: boolean; type: string | null }> {
        const response = await fetch(
            `${API_BASE}/lego-models/${id}/ownership`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to check ownership");
        return response.json();
    },

    // Claim a free model
    async claimModel(
        id: number,
    ): Promise<{ message: string; owns: boolean; type: string }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/lego-models/${id}/claim`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to claim model");
        }
        return response.json();
    },

    // Unclaim a claimed model (remove from library)
    async unclaimModel(
        id: number,
    ): Promise<{ message: string; owns: boolean }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/lego-models/${id}/claim`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to unclaim model");
        }
        return response.json();
    },

    // Upload thumbnail for a model
    async uploadThumbnail(
        id: number,
        thumbnailBase64: string,
    ): Promise<{
        message: string;
        thumbnail: string;
        thumbnail_url: string;
    }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/lego-models/${id}/thumbnail`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify({ thumbnail: thumbnailBase64 }),
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to upload thumbnail");
        }
        return response.json();
    },

    // Update user settings
    async updateSettings(data: {
        name?: string;
        email?: string;
        current_password?: string;
        password?: string;
        password_confirmation?: string;
    }): Promise<{ message: string; user: any }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/user/settings`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update settings");
        }
        return response.json();
    },

    // ==================== Admin Rebrickable API ====================

    async getRebrickableStats(): Promise<Record<string, number>> {
        const response = await fetch(`${API_BASE}/admin/rebrickable/stats`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch Rebrickable stats");
        return response.json();
    },

    async getRebrickableTables(): Promise<
        Record<
            string,
            { has_file: boolean; columns: string[]; primary_key: string | null }
        >
    > {
        const response = await fetch(`${API_BASE}/admin/rebrickable/tables`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch tables");
        return response.json();
    },

    async importRebrickableTable(
        table: string,
    ): Promise<{ message: string; imported: number }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/rebrickable/${table}/import-server`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to import");
        }
        return response.json();
    },

    async importAllRebrickableTables(): Promise<{
        message: string;
        results: Record<string, number>;
        errors: Record<string, string>;
    }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/rebrickable/import-all`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to import all");
        }
        return response.json();
    },

    async clearRebrickableTable(table: string): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/rebrickable/${table}/clear`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to clear");
        }
        return response.json();
    },

    async clearAllRebrickableTables(): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/rebrickable/clear-all`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to clear all");
        }
        return response.json();
    },

    async getRebrickableRecords(
        table: string,
        params?: {
            search?: string;
            page?: number;
            per_page?: number;
            sort?: string;
            direction?: string;
        },
    ): Promise<{
        data: any[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.per_page)
            searchParams.append("per_page", params.per_page.toString());
        if (params?.sort) searchParams.append("sort", params.sort);
        if (params?.direction)
            searchParams.append("direction", params.direction);

        const response = await fetch(
            `${API_BASE}/admin/rebrickable/${table}?${searchParams.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch records");
        return response.json();
    },

    async deleteRebrickableRecord(
        table: string,
        id: string,
    ): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/rebrickable/${table}/${id}`,
            {
                method: "DELETE",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to delete");
        }
        return response.json();
    },

    async uploadRebrickableCsv(
        table: string,
        file: File,
    ): Promise<{ message: string; imported: number }> {
        await ensureCsrfCookie();
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(
            `${API_BASE}/admin/rebrickable/${table}/import`,
            {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: formData,
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to upload");
        }
        return response.json();
    },

    // ==================== Public Catalog API ====================

    async getCatalogStats(): Promise<{
        sets: number;
        parts: number;
        minifigs: number;
        colors: number;
        themes: number;
    }> {
        const response = await fetch(`${API_BASE}/catalog/stats`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch catalog stats");
        return response.json();
    },

    async getCatalogSets(params?: {
        search?: string;
        theme_id?: number;
        year_from?: number;
        year_to?: number;
        min_parts?: number;
        sort?: string;
        direction?: string;
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<CatalogSet>> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.theme_id)
            searchParams.append("theme_id", params.theme_id.toString());
        if (params?.year_from)
            searchParams.append("year_from", params.year_from.toString());
        if (params?.year_to)
            searchParams.append("year_to", params.year_to.toString());
        if (params?.min_parts)
            searchParams.append("min_parts", params.min_parts.toString());
        if (params?.sort) searchParams.append("sort", params.sort);
        if (params?.direction)
            searchParams.append("direction", params.direction);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.per_page)
            searchParams.append("per_page", params.per_page.toString());

        const response = await fetch(
            `${API_BASE}/catalog/sets?${searchParams.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch sets");
        return response.json();
    },

    async getCatalogSet(setNum: string): Promise<CatalogSet> {
        const response = await fetch(`${API_BASE}/catalog/sets/${setNum}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch set");
        return response.json();
    },

    async getCatalogParts(params?: {
        search?: string;
        category_id?: number;
        color_id?: number;
        sort?: string;
        direction?: string;
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<CatalogPart>> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.category_id)
            searchParams.append("category_id", params.category_id.toString());
        if (params?.color_id)
            searchParams.append("color_id", params.color_id.toString());
        if (params?.sort) searchParams.append("sort", params.sort);
        if (params?.direction)
            searchParams.append("direction", params.direction);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.per_page)
            searchParams.append("per_page", params.per_page.toString());

        const response = await fetch(
            `${API_BASE}/catalog/parts?${searchParams.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch parts");
        return response.json();
    },

    async getCatalogPart(partNum: string): Promise<CatalogPart> {
        const response = await fetch(`${API_BASE}/catalog/parts/${partNum}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch part");
        return response.json();
    },

    async getCatalogMinifigs(params?: {
        search?: string;
        min_parts?: number;
        sort?: string;
        direction?: string;
        page?: number;
        per_page?: number;
    }): Promise<PaginatedResponse<CatalogMinifig>> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.min_parts)
            searchParams.append("min_parts", params.min_parts.toString());
        if (params?.sort) searchParams.append("sort", params.sort);
        if (params?.direction)
            searchParams.append("direction", params.direction);
        if (params?.page) searchParams.append("page", params.page.toString());
        if (params?.per_page)
            searchParams.append("per_page", params.per_page.toString());

        const response = await fetch(
            `${API_BASE}/catalog/minifigs?${searchParams.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch minifigs");
        return response.json();
    },

    async getCatalogMinifig(figNum: string): Promise<CatalogMinifig> {
        const response = await fetch(`${API_BASE}/catalog/minifigs/${figNum}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch minifig");
        return response.json();
    },

    async getCatalogColors(params?: {
        search?: string;
        is_trans?: boolean;
    }): Promise<CatalogColor[]> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.is_trans !== undefined)
            searchParams.append("is_trans", params.is_trans.toString());

        const response = await fetch(
            `${API_BASE}/catalog/colors?${searchParams.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch colors");
        return response.json();
    },

    async getCatalogColor(colorId: number): Promise<CatalogColor> {
        const response = await fetch(`${API_BASE}/catalog/colors/${colorId}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch color");
        return response.json();
    },

    async getCatalogThemes(params?: {
        search?: string;
        hierarchical?: boolean;
    }): Promise<CatalogTheme[]> {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.append("search", params.search);
        if (params?.hierarchical !== undefined)
            searchParams.append("hierarchical", params.hierarchical.toString());

        const response = await fetch(
            `${API_BASE}/catalog/themes?${searchParams.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch themes");
        return response.json();
    },

    async getCatalogTheme(themeId: number): Promise<CatalogTheme> {
        const response = await fetch(`${API_BASE}/catalog/themes/${themeId}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch theme");
        return response.json();
    },

    async getCatalogCategories(): Promise<CatalogCategory[]> {
        const response = await fetch(`${API_BASE}/catalog/categories`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch categories");
        return response.json();
    },

    async getCatalogCategory(categoryId: number): Promise<CatalogCategory> {
        const response = await fetch(
            `${API_BASE}/catalog/categories/${categoryId}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch category");
        return response.json();
    },

    async getCatalogYearRange(): Promise<{ min: number; max: number }> {
        const response = await fetch(`${API_BASE}/catalog/year-range`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch year range");
        return response.json();
    },
};

// ==================== Catalog Types ====================

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface CatalogSet {
    set_num: string;
    name: string;
    year: number;
    theme_id: number;
    num_parts: number;
    image_url: string;
    bricklink_url?: string;
    theme?: CatalogTheme;
    // Detail view fields
    parts?: CatalogSetPart[];
    parts_count?: number;
    total_pieces?: number;
    minifigs_list?: CatalogSetMinifig[];
    minifigs_count?: number;
}

export interface CatalogMoc {
    set_num: string;
    name: string;
    description?: string;
    year: number;
    theme_id: number;
    num_parts: number;
    total_steps: number;
    price?: number;
    is_public: boolean;
    thumbnail?: string;
    ldr_content?: string;
    file_name?: string;
    image_url: string;
    bricklink_url?: string;
    theme?: CatalogTheme;
    user_id?: number;
    user?: {
        id: number;
        name: string;
    };
    // Detail view fields
    parts?: CatalogSetPart[];
    parts_count?: number;
    total_pieces?: number;
    minifigs_list?: CatalogSetMinifig[];
    minifigs_count?: number;
}

export interface CatalogSetPart {
    part_num: string;
    name: string;
    category: string;
    color_id: number;
    color_name: string;
    color_rgb: string;
    quantity: number;
    is_spare: boolean;
    image_url: string;
    photo_url?: string;
    bricklink_url: string;
}

export interface CatalogSetMinifig {
    fig_num: string;
    name: string;
    num_parts: number;
    quantity: number;
    image_url: string;
    bricklink_url: string;
}

export interface CatalogPart {
    part_num: string;
    name: string;
    part_cat_id: number;
    image_url: string;
    photo_url?: string;
    bricklink_url?: string;
    category?: CatalogCategory;
    available_colors?: CatalogPartColor[];
    // Detail view fields
    in_sets?: CatalogPartSet[];
    in_sets_count?: number;
}

export interface CatalogPartColor {
    id: number;
    name: string;
    rgb: string;
    is_trans: boolean;
    image_url: string;
    photo_url?: string;
    bricklink_url: string;
}

export interface CatalogPartSet {
    set_num: string;
    name: string;
    year: number;
    theme: string;
    num_parts: number;
    quantity: number;
    colors: string[];
    image_url: string;
    bricklink_url: string;
}

export interface CatalogMinifig {
    fig_num: string;
    name: string;
    num_parts: number;
    image_url: string;
    bricklink_url?: string;
    // Detail view fields
    in_sets?: CatalogMinifigSet[];
    in_sets_count?: number;
}

export interface CatalogMinifigSet {
    set_num: string;
    name: string;
    year: number;
    theme: string;
    num_parts: number;
    quantity: number;
    image_url: string;
    bricklink_url: string;
}

export interface CatalogColor {
    id: number;
    name: string;
    rgb: string;
    is_trans: boolean;
    image_url?: string;
    // Detail view fields
    parts?: CatalogColorPart[];
    parts_count?: number;
}

export interface CatalogColorPart {
    part_num: string;
    name: string;
    category: string;
    image_url: string;
    photo_url?: string;
    bricklink_url: string;
}

export interface CatalogTheme {
    id: number;
    name: string;
    parent_id: number | null;
    sets_count?: number;
    children?: CatalogTheme[];
    parent?: CatalogTheme;
    // Detail view fields
    sets_list?: CatalogThemeSet[];
}

export interface CatalogThemeSet {
    set_num: string;
    name: string;
    year: number;
    num_parts: number;
    image_url: string;
    bricklink_url: string;
}

export interface CatalogCategory {
    id: number;
    name: string;
    parts_count?: number;
    // Detail view fields
    parts_list?: CatalogCategoryPart[];
}

export interface CatalogCategoryPart {
    part_num: string;
    name: string;
    image_url: string;
    photo_url?: string;
    bricklink_url: string;
}
