import { legoInstructionsUrl } from "../../utils/seoUrls";

interface InstructionsButtonProps {
    setNum: string;
}

/**
 * Button component for linking to LEGO official building instructions
 */
export default function InstructionsButton({
    setNum,
}: InstructionsButtonProps) {
    return (
        <a
            href={legoInstructionsUrl(setNum)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
            <span>Instructions</span>
        </a>
    );
}
