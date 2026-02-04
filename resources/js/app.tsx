import "./bootstrap";
import { createInertiaApp } from "@inertiajs/react";
import { createRoot } from "react-dom/client";
import { AuthProvider } from "./contexts/AuthContext";
import { CartProvider } from "./contexts/CartContext";

const appName = "LEGO LDraw Studio Viewer";

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
        const pages = import.meta.glob("./Pages/**/*.tsx", { eager: true });
        return pages[`./Pages/${name}.tsx`] as any;
    },
    setup({ el, App, props }) {
        const initialUser =
            (props.initialPage.props as any)?.auth?.user || null;
        const initialCartCount =
            (props.initialPage.props as any)?.cart?.count || 0;
        createRoot(el).render(
            <AuthProvider initialUser={initialUser}>
                <CartProvider initialCount={initialCartCount}>
                    <App {...props} />
                </CartProvider>
            </AuthProvider>,
        );
    },
    progress: {
        color: "#facc15",
    },
});
