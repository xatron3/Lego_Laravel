import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import { api } from "../../api";

export default function Settings() {
    const { user } = useAuth();
    const [settingsName, setSettingsName] = useState(user?.name || "");
    const [settingsEmail, setSettingsEmail] = useState(user?.email || "");
    const [currencySymbol, setCurrencySymbol] = useState(
        user?.settings?.flipping?.currency_symbol || "$",
    );
    const [currencyPlacement, setCurrencyPlacement] = useState<
        "left" | "right"
    >(user?.settings?.flipping?.currency_placement || "left");
    const [isSavingSettings, setIsSavingSettings] = useState(false);

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
