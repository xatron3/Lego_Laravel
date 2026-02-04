interface StatCardProps {
    label: string;
    value: string;
    icon: string;
}

/**
 * Card component for displaying a statistic with icon
 */
export default function StatCard({ label, value, icon }: StatCardProps) {
    return (
        <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                <span>{icon}</span>
                <span>{label}</span>
            </div>
            <div className="text-white text-xl font-bold">{value}</div>
        </div>
    );
}
