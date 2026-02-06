import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useAuth } from "../contexts/AuthContext";
import AuthModal from "../components/AuthModal";
import DashboardLayout from "../components/DashboardLayout";

export default function Dashboard() {
    const { isAuthenticated } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);

    // Redirect to my-models if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.visit("/dashboard/my-models");
        }
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">
                        Please sign in to access your dashboard
                    </h1>
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors"
                    >
                        Sign In
                    </button>
                </div>
                <AuthModal
                    isOpen={showAuthModal}
                    onClose={() => setShowAuthModal(false)}
                />
            </div>
        );
    }

    // While redirecting, show a simple loading state
    return (
        <DashboardLayout currentPage="my-models">
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
            </div>
        </DashboardLayout>
    );
}
