import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: "login" | "register";
}

export default function AuthModal({
    isOpen,
    onClose,
    initialMode = "login",
}: AuthModalProps) {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<"login" | "register">(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [remember, setRemember] = useState(false);

    if (!isOpen) return null;

    const resetForm = () => {
        setName("");
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        setRemember(false);
        setError(null);
    };

    const switchMode = (newMode: "login" | "register") => {
        setMode(newMode);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (mode === "login") {
                await login(email, password, remember);
            } else {
                if (password !== passwordConfirmation) {
                    throw new Error("Passwords do not match");
                }
                await register(name, email, password, passwordConfirmation);
            }
            resetForm();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = "/auth/google";
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl border border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-yellow-400">
                        {mode === "login" ? "Welcome Back" : "Create Account"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Google OAuth Button */}
                <button
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-lg font-medium transition-colors mb-4"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-gray-800 text-gray-400">
                            or continue with email
                        </span>
                    </div>
                </div>

                {/* Email/Password Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "register" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="Your name"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                            placeholder="••••••••"
                        />
                    </div>

                    {mode === "register" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={passwordConfirmation}
                                onChange={(e) =>
                                    setPasswordConfirmation(e.target.value)
                                }
                                required
                                minLength={8}
                                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>
                    )}

                    {mode === "login" && (
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember"
                                checked={remember}
                                onChange={(e) => setRemember(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-gray-800"
                            />
                            <label
                                htmlFor="remember"
                                className="ml-2 text-sm text-gray-300"
                            >
                                Remember me
                            </label>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-lg transition-colors"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin w-5 h-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    ></path>
                                </svg>
                                {mode === "login"
                                    ? "Signing in..."
                                    : "Creating account..."}
                            </span>
                        ) : mode === "login" ? (
                            "Sign In"
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                {/* Mode Switch */}
                <div className="mt-6 text-center text-sm text-gray-400">
                    {mode === "login" ? (
                        <>
                            Don't have an account?{" "}
                            <button
                                onClick={() => switchMode("register")}
                                className="text-yellow-400 hover:text-yellow-300 font-medium"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button
                                onClick={() => switchMode("login")}
                                className="text-yellow-400 hover:text-yellow-300 font-medium"
                            >
                                Sign in
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
