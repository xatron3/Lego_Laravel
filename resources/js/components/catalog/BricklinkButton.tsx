interface BricklinkButtonProps {
    url?: string;
}

/**
 * Button component for linking to BrickLink
 */
export default function BricklinkButton({ url }: BricklinkButtonProps) {
    if (!url) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white border border-gray-600 hover:border-gray-500 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
            <svg
                className="w-4 h-4 transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
            </svg>
            <span>BrickLink</span>
        </a>
    );
}
