const API_BASE = "/api";

// Get CSRF token from meta tag or cookie
export function getCsrfToken(): string {
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
export async function ensureCsrfCookie(): Promise<void> {
    await fetch("/sanctum/csrf-cookie", {
        credentials: "same-origin",
    });
}

// MOC Image data
export interface MocImageData {
    id: number;
    moc_id: number;
    path: string;
    filename: string | null;
    sort_order: number;
    is_primary: boolean;
    url: string;
    created_at?: string;
}

export interface LegoModelData {
    id?: number;
    name: string;
    description?: string;
    ldr_content: string;
    file_name?: string;
    instructions_pdf?: string | File;
    total_steps: number;
    total_parts: number;
    user_id?: number;
    is_public?: boolean;
    price?: number | string | null;
    thumbnail?: string | null;
    display_thumbnail?: string | null;
    created_at?: string;
    set_num?: string;
    parts?: InventoryPartData[];
    parts_count?: number;
    images?: MocImageData[];
    user?: {
        id: number;
        name: string;
        is_pro?: boolean;
    };
    can_access_viewer?: boolean;
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

// Cart & Checkout Types
export interface CartItemModel {
    id: number;
    name: string;
    description?: string;
    price: number | string;
    thumbnail?: string | null;
    total_parts: number;
    total_steps: number;
    user?: {
        id: number;
        name: string;
    } | null;
}

export interface CartItemData {
    id: number;
    moc_id: number;
    moc: CartItemModel | null;
    created_at: string;
}

export interface CartData {
    items: CartItemData[];
    subtotal: number;
    platform_fee: number;
    total: number;
    count: number;
}

export interface OrderItemData {
    id: number;
    moc_id: number;
    seller_id: number;
    price: string;
    seller_amount: string;
    platform_amount: string;
    moc?: {
        id: number;
        set_num: string;
        name: string;
        thumbnail?: string | null;
        price?: number;
        description?: string;
    };
    seller?: {
        id: number;
        name: string;
    };
}

export interface OrderData {
    id: number;
    user_id: number;
    stripe_checkout_session_id?: string;
    stripe_payment_intent_id?: string;
    status: "pending" | "completed" | "failed" | "refunded";
    subtotal: string;
    platform_fee: string;
    total: string;
    created_at: string;
    updated_at: string;
    items?: OrderItemData[];
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

        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else if (typeof value === "boolean") {
                    formData.append(key, value ? "1" : "0");
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        const response = await fetch(`${API_BASE}/mocs`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: formData,
        });
        if (!response.ok) throw new Error("Failed to save model");
        return response.json();
    },

    async updateModel(
        id: number,
        data: Partial<Omit<LegoModelData, "id" | "created_at" | "user">>,
    ): Promise<LegoModelData> {
        await ensureCsrfCookie();

        const formData = new FormData();
        formData.append("_method", "PATCH");
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else if (typeof value === "boolean") {
                    formData.append(key, value ? "1" : "0");
                } else {
                    formData.append(key, String(value));
                }
            }
        });

        const response = await fetch(`${API_BASE}/mocs/${id}`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: formData,
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
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.message || "Failed to delete model");
        }
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

    // Download MOC instructions PDF
    downloadInstructions(id: number): void {
        window.location.href = `${API_BASE}/mocs/${id}/download-instructions`;
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

    // ==================== MOC Image Management ====================

    // Upload images for a MOC
    async uploadMocImages(
        mocId: number,
        files: File[],
    ): Promise<{ message: string; images: MocImageData[] }> {
        await ensureCsrfCookie();
        const formData = new FormData();
        files.forEach((file) => {
            formData.append("images[]", file);
        });

        const response = await fetch(`${API_BASE}/mocs/${mocId}/images`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to upload images");
        }
        return response.json();
    },

    // Delete an image from a MOC
    async deleteMocImage(
        mocId: number,
        imageId: number,
    ): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/mocs/${mocId}/images/${imageId}`,
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
            throw new Error(error.message || "Failed to delete image");
        }
        return response.json();
    },

    // Set primary image for a MOC
    async setPrimaryMocImage(
        mocId: number,
        imageId: number,
    ): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/mocs/${mocId}/images/${imageId}/primary`,
            {
                method: "PATCH",
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
            throw new Error(error.message || "Failed to set primary image");
        }
        return response.json();
    },

    // Reorder images for a MOC
    async reorderMocImages(
        mocId: number,
        imageIds: number[],
    ): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/mocs/${mocId}/images/reorder`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify({ image_ids: imageIds }),
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to reorder images");
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
        settings?: {
            flipping?: {
                currency_symbol?: string;
                currency_placement?: "left" | "right";
            };
            [key: string]: any;
        };
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

    // ==================== Admin Catalog API ====================

    async getAdminCatalogStats(): Promise<{
        sets: number;
        parts: number;
        minifigs: number;
        themes: number;
        sets_with_custom_image: number;
        parts_with_custom_image: number;
        minifigs_with_custom_image: number;
        themes_with_custom_image: number;
    }> {
        const response = await fetch(`${API_BASE}/admin/catalog/stats`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch catalog stats");
        return response.json();
    },

    async getAdminCatalogRecords(
        type: string,
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
            `${API_BASE}/admin/catalog/${type}?${searchParams.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch records");
        return response.json();
    },

    async getAdminCatalogRecord(type: string, id: string): Promise<any> {
        const response = await fetch(
            `${API_BASE}/admin/catalog/${type}/${id}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch record");
        return response.json();
    },

    async createAdminCatalogRecord(
        type: string,
        data: Record<string, any>,
    ): Promise<{ message: string; data: any }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/admin/catalog/${type}`, {
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
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create record");
        }
        return response.json();
    },

    async updateAdminCatalogRecord(
        type: string,
        id: string,
        data: Record<string, any>,
    ): Promise<{ message: string; data: any }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/catalog/${type}/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": getCsrfToken(),
                    "X-XSRF-TOKEN": getCsrfToken(),
                },
                credentials: "same-origin",
                body: JSON.stringify(data),
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update record");
        }
        return response.json();
    },

    async deleteAdminCatalogRecord(
        type: string,
        id: string,
    ): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/catalog/${type}/${id}`,
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

    async uploadAdminCatalogImage(
        type: string,
        id: string,
        file: File,
    ): Promise<{ message: string; image_url: string; custom_image: string }> {
        await ensureCsrfCookie();
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(
            `${API_BASE}/admin/catalog/${type}/${id}/image`,
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
            throw new Error(error.message || "Failed to upload image");
        }
        return response.json();
    },

    async deleteAdminCatalogImage(
        type: string,
        id: string,
    ): Promise<{ message: string; image_url: string }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/catalog/${type}/${id}/image`,
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
            throw new Error(error.message || "Failed to delete image");
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

    async importRebrickableTable(table: string): Promise<{
        message: string;
        imported?: number;
        job_id?: string;
        table?: string;
    }> {
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
        results?: Record<string, number>;
        errors?: Record<string, string>;
        job_id?: string;
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

    async getRebrickableJobProgress(jobId: string): Promise<{
        status: string;
        progress: number | null;
        message: string;
        table?: string;
        stats?: {
            total: number;
            processed: number;
            imported: number;
            skipped: number;
        };
        updated_at: string;
    }> {
        const response = await fetch(
            `${API_BASE}/admin/rebrickable/progress/${jobId}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch progress");
        }
        return response.json();
    },

    async getRebrickableJobs(): Promise<
        Array<{
            job_id: string;
            status: string;
            progress: number | null;
            message: string;
            table?: string;
            stats?: {
                total: number;
                processed: number;
                imported: number;
                skipped: number;
            };
            updated_at: string;
        }>
    > {
        const response = await fetch(`${API_BASE}/admin/rebrickable/jobs`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) {
            throw new Error("Failed to fetch jobs");
        }
        return response.json();
    },

    async retryRebrickableJob(jobId: string): Promise<{
        message: string;
        job_id: string;
        table?: string;
    }> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/admin/rebrickable/retry/${jobId}`,
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
            throw new Error(error.message || "Failed to retry job");
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

    async searchCatalog(
        query: string,
        scope:
            | "all"
            | "sets"
            | "mocs"
            | "parts"
            | "minifigs"
            | "themes" = "all",
    ): Promise<SearchResult[]> {
        if (query.length < 2) return [];
        const params = new URLSearchParams({ q: query, scope });
        const response = await fetch(
            `${API_BASE}/catalog/search?${params.toString()}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) return [];
        return response.json();
    },

    async getCatalogStats(): Promise<{
        sets: number;
        mocs: number;
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

    async getCatalogMocs(params?: {
        search?: string;
        theme_id?: number;
        year?: number;
        sort?: string;
        direction?: string;
        page?: number;
        per_page?: number;
    }): Promise<{
        data: LegoModelData[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    }> {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.set("search", params.search);
        if (params?.theme_id)
            queryParams.set("theme_id", params.theme_id.toString());
        if (params?.year) queryParams.set("year", params.year.toString());
        if (params?.sort) queryParams.set("sort", params.sort);
        if (params?.direction) queryParams.set("direction", params.direction);
        if (params?.page) queryParams.set("page", params.page.toString());
        if (params?.per_page)
            queryParams.set("per_page", params.per_page.toString());

        const response = await fetch(
            `${API_BASE}/catalog/mocs?${queryParams}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch MOCs");
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

    // ==================== Cart API ====================

    async getCart(): Promise<CartData> {
        const response = await fetch(`${API_BASE}/cart`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch cart");
        return response.json();
    },

    async addToCart(
        modelId: number,
    ): Promise<{ message: string; cart_item_id: number }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/cart`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: JSON.stringify({ moc_id: modelId }),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to add to cart");
        }
        return response.json();
    },

    async removeFromCart(modelId: number): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/cart/${modelId}`, {
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
            throw new Error(error.message || "Failed to remove from cart");
        }
        return response.json();
    },

    async clearCart(): Promise<{ message: string }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/cart`, {
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
            throw new Error(error.message || "Failed to clear cart");
        }
        return response.json();
    },

    async getCartCount(): Promise<{ count: number }> {
        const response = await fetch(`${API_BASE}/cart/count`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch cart count");
        return response.json();
    },

    async checkInCart(modelId: number): Promise<{ in_cart: boolean }> {
        const response = await fetch(`${API_BASE}/cart/check/${modelId}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to check cart");
        return response.json();
    },

    // ==================== Checkout API ====================

    async createCheckoutSession(): Promise<{
        checkout_url: string;
        session_id: string;
    }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/checkout/session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                error.message || "Failed to create checkout session",
            );
        }
        return response.json();
    },

    async verifyCheckout(
        sessionId: string,
    ): Promise<{ message: string; order_id: number; status: string }> {
        const response = await fetch(
            `${API_BASE}/checkout/success?session_id=${sessionId}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to verify checkout");
        }
        return response.json();
    },

    async getOrders(): Promise<OrderData[]> {
        const response = await fetch(`${API_BASE}/checkout/orders`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch orders");
        return response.json();
    },

    async getOrder(orderId: number): Promise<OrderData> {
        const response = await fetch(`${API_BASE}/checkout/orders/${orderId}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch order");
        return response.json();
    },

    // Seller Analytics
    async getSellerAnalytics(): Promise<{
        summary: {
            total_earnings: number;
            pending_earnings: number;
            paid_earnings: number;
            total_sales: number;
        };
        top_mocs: Array<{
            moc_id: number;
            moc_name: string;
            moc_thumbnail?: string;
            moc_price: number;
            sales_count: number;
            revenue: number;
        }>;
        recent_sales: Array<{
            id: number;
            moc_name: string;
            moc_thumbnail?: string;
            buyer_name: string;
            amount: string;
            date: string;
        }>;
        sales_chart: Array<{
            date: string;
            count: number;
            revenue: string;
        }>;
    }> {
        const response = await fetch(`${API_BASE}/seller/analytics`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch seller analytics");
        return response.json();
    },

    async getSellerEarnings(): Promise<any> {
        const response = await fetch(`${API_BASE}/seller/earnings`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch seller earnings");
        return response.json();
    },

    // Admin APIs
    async getAdminSales(): Promise<{
        total_sales: number;
        total_revenue: number;
        platform_revenue: number;
        recent_sales: Array<{
            id: number;
            buyer_name: string;
            seller_name: string;
            model_name: string;
            total: string;
            platform_fee: string;
            created_at: string;
        }>;
    }> {
        const response = await fetch(`${API_BASE}/admin/sales`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch admin sales");
        return response.json();
    },

    // ==================== Pro Subscription ====================

    async getProStatus(): Promise<{
        is_pro: boolean;
        pro_expires_at: string | null;
        has_subscription: boolean;
        price: string;
    }> {
        const response = await fetch(`${API_BASE}/pro/status`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch Pro status");
        return response.json();
    },

    async subscribePro(): Promise<{
        checkout_url: string;
        session_id: string;
    }> {
        const response = await fetch(`${API_BASE}/pro/subscribe`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Failed to subscribe");
        }
        return response.json();
    },

    async cancelPro(): Promise<{ message: string; pro_expires_at?: string }> {
        const response = await fetch(`${API_BASE}/pro/cancel`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Failed to cancel subscription");
        }
        return response.json();
    },

    async resumePro(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE}/pro/resume`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || "Failed to resume subscription");
        }
        return response.json();
    },

    // ==================== Admin Site Settings ====================

    async getAdminSettings(): Promise<
        Array<{
            id: number;
            key: string;
            content: any;
            description: string | null;
        }>
    > {
        const response = await fetch(`${API_BASE}/admin/settings`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch site settings");
        return response.json();
    },

    async updateAdminSetting(
        key: string,
        content: any,
    ): Promise<{
        id: number;
        key: string;
        content: any;
        description: string | null;
    }> {
        const response = await fetch(`${API_BASE}/admin/settings/${key}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error("Failed to update setting");
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

export interface SearchResult {
    type: "set" | "moc" | "part" | "minifig" | "theme";
    id: string;
    name: string;
    subtitle: string;
    image_url: string;
    url: string;
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
    filtered_color?: {
        id: number;
        name: string;
        rgb: string;
        is_trans: boolean;
    };
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

// ========================================
// Social / Community Types
// ========================================

export interface PostImageData {
    id: number;
    post_id: number;
    path: string;
    filename: string | null;
    sort_order: number;
    url: string;
}

export interface PostUser {
    id: number;
    name: string;
    username: string | null;
    avatar: string | null;
}

export interface CommentData {
    id: number;
    user_id: number;
    body: string;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
    user: PostUser;
    likes_count: number;
    is_liked: boolean;
    replies?: CommentData[];
}

export interface MocMetadata {
    moc_id: number;
    set_num: string;
    price: number;
    total_parts: number;
    total_steps: number;
}

export interface PostData {
    id: number;
    user_id: number;
    type: string;
    title: string | null;
    body: string | null;
    metadata: MocMetadata | Record<string, any> | null;
    created_at: string;
    updated_at: string;
    user: PostUser;
    images: PostImageData[];
    likes_count: number;
    comments_count: number;
    is_liked: boolean;
    is_following?: boolean;
    is_from_feed?: boolean;
    top_level_comments?: CommentData[];
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

export type NotificationType =
    | "new_follower"
    | "post_like"
    | "post_comment"
    | "moc_sale";

export interface NotificationData {
    id: number;
    user_id: number;
    type: NotificationType;
    actor_id: number | null;
    notifiable_type: string | null;
    notifiable_id: number | null;
    data: {
        message: string;
        comment_preview?: string;
        amount?: string;
    } | null;
    created_at: string;
    updated_at: string;
    actor: {
        id: number;
        name: string;
        username: string | null;
        avatar: string | null;
    } | null;
}

export interface ProfileUser {
    id: number;
    name: string;
    username: string;
    avatar: string | null;
    bio: string | null;
    created_at: string;
}

export interface ProfileStats {
    followers_count: number;
    following_count: number;
    posts_count: number;
    mocs_count: number;
}

export interface FollowUser {
    id: number;
    name: string;
    username: string | null;
    avatar: string | null;
    is_following: boolean;
    is_self: boolean;
}

// ========================================
// Social / Community API Methods
// ========================================

export const socialApi = {
    // Posts
    async createPost(formData: FormData): Promise<PostData> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/posts`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: formData,
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Failed to create post");
        }
        return response.json();
    },

    async deletePost(id: number): Promise<void> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/posts/${id}`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to delete post");
    },

    async getPost(id: number): Promise<PostData> {
        const response = await fetch(`${API_BASE}/posts/${id}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch post");
        return response.json();
    },

    async getFeed(page = 1): Promise<PaginatedResponse<PostData>> {
        const response = await fetch(`${API_BASE}/feed?page=${page}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch feed");
        return response.json();
    },

    async getUserPosts(
        userId: number,
        page = 1,
    ): Promise<PaginatedResponse<PostData>> {
        const response = await fetch(
            `${API_BASE}/users/${userId}/posts?page=${page}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch user posts");
        return response.json();
    },

    // Likes
    async likePost(
        id: number,
    ): Promise<{ likes_count: number; is_liked: boolean }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/posts/${id}/like`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to like post");
        return response.json();
    },

    async unlikePost(
        id: number,
    ): Promise<{ likes_count: number; is_liked: boolean }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/posts/${id}/like`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to unlike post");
        return response.json();
    },

    // Comments
    async addComment(
        postId: number,
        body: string,
        parentId?: number,
    ): Promise<CommentData> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
            body: JSON.stringify({ body, parent_id: parentId }),
        });
        if (!response.ok) throw new Error("Failed to add comment");
        return response.json();
    },

    async deleteComment(postId: number, commentId: number): Promise<void> {
        await ensureCsrfCookie();
        const response = await fetch(
            `${API_BASE}/posts/${postId}/comments/${commentId}`,
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
        if (!response.ok) throw new Error("Failed to delete comment");
    },

    async likeComment(
        id: number,
    ): Promise<{ likes_count: number; is_liked: boolean }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/comments/${id}/like`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to like comment");
        return response.json();
    },

    async unlikeComment(
        id: number,
    ): Promise<{ likes_count: number; is_liked: boolean }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/comments/${id}/like`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to unlike comment");
        return response.json();
    },

    // Follow
    async followUser(
        id: number,
    ): Promise<{ followers_count: number; is_following: boolean }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/users/${id}/follow`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to follow user");
        return response.json();
    },

    async unfollowUser(
        id: number,
    ): Promise<{ followers_count: number; is_following: boolean }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/users/${id}/follow`, {
            method: "DELETE",
            headers: {
                Accept: "application/json",
                "X-CSRF-TOKEN": getCsrfToken(),
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to unfollow user");
        return response.json();
    },

    // Profile
    async updateProfile(data: {
        username?: string;
        bio?: string;
    }): Promise<{ user: ProfileUser }> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/user/profile`, {
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
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "Failed to update profile");
        }
        return response.json();
    },

    async getFollowers(
        userId: number,
        page = 1,
    ): Promise<PaginatedResponse<FollowUser>> {
        const response = await fetch(
            `${API_BASE}/users/${userId}/followers?page=${page}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch followers");
        return response.json();
    },

    async getFollowing(
        userId: number,
        page = 1,
    ): Promise<PaginatedResponse<FollowUser>> {
        const response = await fetch(
            `${API_BASE}/users/${userId}/following?page=${page}`,
            {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            },
        );
        if (!response.ok) throw new Error("Failed to fetch following");
        return response.json();
    },

    // ── Notifications ───────────────────────────────────────────────────

    async getNotifications(
        page = 1,
    ): Promise<PaginatedResponse<NotificationData>> {
        const response = await fetch(`${API_BASE}/notifications?page=${page}`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Failed to fetch notifications");
        return response.json();
    },

    async markNotificationsSeen(): Promise<void> {
        await ensureCsrfCookie();
        const response = await fetch(`${API_BASE}/notifications/mark-seen`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-XSRF-TOKEN": getCsrfToken(),
            },
            credentials: "same-origin",
        });
        if (!response.ok)
            throw new Error("Failed to mark notifications as seen");
    },

    async getUnreadNotificationCount(): Promise<{ count: number }> {
        const response = await fetch(`${API_BASE}/notifications/unread-count`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok)
            throw new Error("Failed to fetch unread notification count");
        return response.json();
    },
};
