import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import Header from "../components/Header";

export default function Login() {
    const { isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(true);

    // If already authenticated, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated) {
            router.visit("/dashboard");
        }
    }, [isAuthenticated]);

    const handleClose = () => {
        setShowAuthModal(false);
        // Navigate to home when modal is dismissed
        router.visit("/");
    };

    if (isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <Header onOpenAuthModal={() => setShowAuthModal(true)} />

            {/* Background content */}
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center text-gray-500">
                    <p className="text-lg">Sign in to access your account</p>
                </div>
            </div>

            <AuthModal isOpen={showAuthModal} onClose={handleClose} />
        </div>
    );
}
