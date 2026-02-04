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
    user?: {
        id: number;
        name: string;
    };
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
            throw new Error(error.message || "Failed to remove model");
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
};
