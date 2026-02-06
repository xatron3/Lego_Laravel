import { Link } from "@inertiajs/react";

export default function Footer() {
    return (
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-800 bg-gray-900/50">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-2">
                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 mb-3">
                            BrickOasis
                        </h3>
                        <p className="text-gray-400 mb-4">
                            The ultimate platform for LEGO enthusiasts. Explore,
                            build, and profit from your passion with our
                            advanced tools and comprehensive database.
                        </p>
                        <div className="flex gap-4">
                            <Link
                                href="/catalog"
                                className="text-gray-400 hover:text-yellow-400 transition-colors"
                            >
                                Catalog
                            </Link>
                            <Link
                                href="/store"
                                className="text-gray-400 hover:text-yellow-400 transition-colors"
                            >
                                MOCs
                            </Link>
                            <Link
                                href="/viewer"
                                className="text-gray-400 hover:text-yellow-400 transition-colors"
                            >
                                Viewer
                            </Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-3">
                            Resources
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="https://ldraw.org"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                                >
                                    LDraw.org
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://rebrickable.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                                >
                                    Rebrickable
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-semibold mb-3">Legal</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/about"
                                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                                >
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/terms"
                                    className="text-gray-400 hover:text-yellow-400 transition-colors"
                                >
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
                    <p className="mb-2">
                        © 2026 BrickOasis. Built with passion for LEGO
                        enthusiasts worldwide.
                    </p>
                    <p className="text-sm">
                        LEGO® is a trademark of the LEGO Group. BrickOasis is
                        not affiliated with the LEGO Group.
                    </p>
                </div>
            </div>
        </footer>
    );
}
