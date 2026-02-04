import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { router } from "@inertiajs/react";
import { useAuth } from "./AuthContext";
import { api, CartItemData } from "../api";

interface CartContextType {
    items: CartItemData[];
    itemCount: number;
    subtotal: number;
    total: number;
    isLoading: boolean;
    addToCart: (modelId: number) => Promise<void>;
    removeFromCart: (modelId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    isInCart: (modelId: number) => boolean;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({
    children,
    initialCount,
}: {
    children: React.ReactNode;
    initialCount?: number;
}) {
    const { isAuthenticated } = useAuth();
    const [items, setItems] = useState<CartItemData[]>([]);
    const [itemCount, setItemCount] = useState(initialCount || 0);
    const [subtotal, setSubtotal] = useState(0);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Update count when Inertia props change
    useEffect(() => {
        const handlePageChange = (event: any) => {
            const cartCount = event.detail?.page?.props?.cart?.count;
            if (cartCount !== undefined) {
                setItemCount(cartCount);
            }
        };

        document.addEventListener("inertia:success", handlePageChange);
        return () =>
            document.removeEventListener("inertia:success", handlePageChange);
    }, []);

    const refreshCart = useCallback(async () => {
        if (!isAuthenticated) {
            setItems([]);
            setItemCount(0);
            setSubtotal(0);
            setTotal(0);
            return;
        }

        setIsLoading(true);
        try {
            const data = await api.getCart();
            setItems(data.items);
            setItemCount(data.count);
            setSubtotal(data.subtotal);
            setTotal(data.total);
        } catch (error) {
            console.error("Failed to fetch cart:", error);
            setItems([]);
            setItemCount(0);
            setSubtotal(0);
            setTotal(0);
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    const addToCart = async (modelId: number) => {
        if (!isAuthenticated) {
            throw new Error("You must be logged in to add items to your cart.");
        }

        try {
            await api.addToCart(modelId);
            // Reload Inertia props to update cart count
            router.reload({ only: ["cart"] });
        } catch (error: any) {
            throw new Error(error.message || "Failed to add item to cart.");
        }
    };

    const removeFromCart = async (modelId: number) => {
        if (!isAuthenticated) return;

        try {
            await api.removeFromCart(modelId);
            // Reload Inertia props and refresh cart details
            router.reload({ only: ["cart"] });
            await refreshCart();
        } catch (error) {
            console.error("Failed to remove item from cart:", error);
        }
    };

    const clearCart = async () => {
        if (!isAuthenticated) return;

        try {
            await api.clearCart();
            setItems([]);
            setItemCount(0);
            setSubtotal(0);
            setTotal(0);
            router.reload({ only: ["cart"] });
        } catch (error) {
            console.error("Failed to clear cart:", error);
        }
    };

    const isInCart = (modelId: number): boolean => {
        return items.some((item) => item.moc_id === modelId);
    };

    return (
        <CartContext.Provider
            value={{
                items,
                itemCount,
                subtotal,
                total,
                isLoading,
                addToCart,
                removeFromCart,
                clearCart,
                isInCart,
                refreshCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
