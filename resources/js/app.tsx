import "./bootstrap";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";

const appName = "LEGO LDraw Studio Viewer";

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.tsx", { eager: true });
        return pages[`./Pages/${name}.tsx`] as any;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <AuthProvider>
                <App {...props} />
            </AuthProvider>,
        );
    },
    progress: {
        color: "#facc15",
    },
});
