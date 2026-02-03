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

export interface LegoModelData {
    id?: number;
    name: string;
    description?: string;
    ldr_content: string;
    file_name?: string;
    total_steps: number;
    total_parts: number;
    created_at?: string;
}

export const api = {
    async getModels(): Promise<LegoModelData[]> {
        const response = await fetch(`${API_BASE}/lego-models`, {
            headers: {
                Accept: "application/json",
            },
        });
        if (!response.ok) throw new Error("Failed to fetch models");
        return response.json();
    },

    async getModel(id: number): Promise<LegoModelData> {
        const response = await fetch(`${API_BASE}/lego-models/${id}`, {
            headers: {
                Accept: "application/json",
            },
        });
        if (!response.ok) throw new Error("Failed to fetch model");
        return response.json();
    },

    async saveModel(
        data: Omit<LegoModelData, "id" | "created_at">,
    ): Promise<LegoModelData> {
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

    async deleteModel(id: number): Promise<void> {
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
};
