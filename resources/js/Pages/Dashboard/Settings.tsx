import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import ProBadge from "../../components/ProBadge";
import { api } from "../../api";

export default function Settings() {
    const { user, isPro } = useAuth();
    const [settingsName, setSettingsName] = useState(user?.name || "");
    const [settingsEmail, setSettingsEmail] = useState(user?.email || "");
    const [currencySymbol, setCurrencySymbol] = useState(
        user?.settings?.flipping?.currency_symbol || "$",
    );
    const [currencyPlacement, setCurrencyPlacement] = useState<
        "left" | "right"
    >(user?.settings?.flipping?.currency_placement || "left");
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isCancellingPro, setIsCancellingPro] = useState(false);
    const [isResumingPro, setIsResumingPro] = useState(false);

    useEffect(() => {
        if (user) {
            setSettingsName(user.name);
            setSettingsEmail(user.email);
            setCurrencySymbol(user.settings?.flipping?.currency_symbol || "$");
            setCurrencyPlacement(
                user.settings?.flipping?.currency_placement || "left",
            );
        }
    }, [user]);

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await api.updateSettings({
                name: settingsName,
                email: settingsEmail,
                settings: {
                    flipping: {
                        currency_symbol: currencySymbol,
                        currency_placement: currencyPlacement,
                    },
                },
            });
            alert("Settings saved successfully!");
        } catch (error: any) {
            console.error("Failed to save settings:", error);
            alert(error.message || "Failed to save settings");
        } finally {
            setIsSavingSettings(false);
        }
    };

    return (
        <DashboardLayout currentPage="settings">
            <div className="max-w-2xl">
                <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Profile
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={settingsName}
                                    onChange={(e) =>
                                        setSettingsName(e.target.value)
                                    }
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={settingsEmail}
                                    onChange={(e) =>
                                        setSettingsEmail(e.target.value)
                                    }
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                disabled={isSavingSettings}
                                className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSavingSettings
                                    ? "Saving..."
                                    : "Save Changes"}
                            </button>
                        </div>
                    </div>

                    {/* Flipping Settings */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Flipping Tracker Settings
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Currency Symbol
                                </label>
                                <input
                                    type="text"
                                    value={currencySymbol}
                                    onChange={(e) =>
                                        setCurrencySymbol(e.target.value)
                                    }
                                    placeholder="$"
                                    maxLength={10}
                                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <p className="text-gray-500 text-xs mt-1">
                                    Enter your preferred currency symbol (e.g.,
                                    $, €, £, ¥)
                                </p>
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">
                                    Currency Placement
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() =>
                                            setCurrencyPlacement("left")
                                        }
                                        className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                                            currencyPlacement === "left"
                                                ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                                                : "bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500"
                                        }`}
                                    >
                                        <div className="text-sm mb-1">Left</div>
                                        <div className="text-xs opacity-75">
                                            {currencySymbol}100
                                        </div>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrencyPlacement("right")
                                        }
                                        className={`px-4 py-3 rounded-lg font-medium transition-all border-2 ${
                                            currencyPlacement === "right"
                                                ? "bg-yellow-500/20 border-yellow-500 text-yellow-400"
                                                : "bg-gray-700 border-gray-600 text-gray-400 hover:border-gray-500"
                                        }`}
                                    >
                                        <div className="text-sm mb-1">
                                            Right
                                        </div>
                                        <div className="text-xs opacity-75">
                                            100{currencySymbol}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Section */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            Account
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                <div>
                                    <div className="text-white font-medium">
                                        Role
                                    </div>
                                    <div className="text-gray-400 text-sm capitalize">
                                        {user?.role}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                                <div>
                                    <div className="text-white font-medium">
                                        Member Since
                                    </div>
                                    <div className="text-gray-400 text-sm">
                                        {user?.created_at
                                            ? new Date(
                                                  user.created_at,
                                              ).toLocaleDateString()
                                            : "Unknown"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pro Subscription Section */}
                    <div
                        className={`bg-gray-800 rounded-xl p-6 border ${isPro ? "border-yellow-500/30" : "border-gray-700"}`}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-lg font-semibold text-white">
                                Pro Subscription
                            </h2>
                            {isPro && <ProBadge size="md" />}
                        </div>

                        {isPro ? (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <svg
                                        className="w-5 h-5 text-green-400 flex-shrink-0"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    <div>
                                        <p className="text-green-400 font-medium">
                                            Active Pro Subscription
                                        </p>
                                        {user?.pro_expires_at && (
                                            <p className="text-gray-400 text-sm mt-1">
                                                Cancellation scheduled. Access
                                                until{" "}
                                                {new Date(
                                                    user.pro_expires_at,
                                                ).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="text-sm text-gray-400 space-y-1">
                                    <p>Your Pro benefits include:</p>
                                    <ul className="list-disc list-inside space-y-1 text-gray-500">
                                        <li>
                                            Unlimited flip transaction tracking
                                        </li>
                                        <li>
                                            Full 3D viewer access for all free
                                            MOCs
                                        </li>
                                        <li>MOC promotion in search results</li>
                                        <li>Pro badge on your profile</li>
                                    </ul>
                                </div>

                                {user?.pro_expires_at ? (
                                    <button
                                        onClick={async () => {
                                            setIsResumingPro(true);
                                            try {
                                                await api.resumePro();
                                                window.location.reload();
                                            } catch (err: any) {
                                                alert(
                                                    err.message ||
                                                        "Failed to resume",
                                                );
                                            } finally {
                                                setIsResumingPro(false);
                                            }
                                        }}
                                        disabled={isResumingPro}
                                        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isResumingPro
                                            ? "Resuming..."
                                            : "Resume Subscription"}
                                    </button>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            if (
                                                !confirm(
                                                    "Are you sure you want to cancel your Pro subscription? You'll keep access until the end of your billing period.",
                                                )
                                            )
                                                return;
                                            setIsCancellingPro(true);
                                            try {
                                                await api.cancelPro();
                                                window.location.reload();
                                            } catch (err: any) {
                                                alert(
                                                    err.message ||
                                                        "Failed to cancel",
                                                );
                                            } finally {
                                                setIsCancellingPro(false);
                                            }
                                        }}
                                        disabled={isCancellingPro}
                                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {isCancellingPro
                                            ? "Cancelling..."
                                            : "Cancel Subscription"}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-gray-400">
                                    Upgrade to Pro for $3.99/month to unlock
                                    unlimited flip tracking, 3D viewer access
                                    for all free MOCs, MOC promotion, and more.
                                </p>
                                <a
                                    href="/pro"
                                    className="inline-block px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-lg transition-all"
                                >
                                    Upgrade to Pro — $3.99/month
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-gray-800 rounded-xl p-6 border border-red-500/50">
                        <h2 className="text-lg font-semibold text-red-400 mb-4">
                            Danger Zone
                        </h2>
                        <p className="text-gray-400 mb-4">
                            Once you delete your account, there is no going
                            back. Please be certain.
                        </p>
                        <button className="px-6 py-3 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-lg transition-colors">
                            Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
