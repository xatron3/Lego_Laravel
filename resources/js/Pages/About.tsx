import { Head, Link } from "@inertiajs/react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function About() {
    return (
        <>
            <Head>
                <title>About - BrickOasis</title>
                <meta
                    name="description"
                    content="Learn about BrickOasis - The ultimate platform for LEGO enthusiasts to explore, build, and share LEGO creations."
                />
            </Head>

            <div className="min-h-screen bg-gray-900">
                <Header />

                <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 mb-8">
                                About BrickOasis
                            </h1>

                            <div className="space-y-6 text-gray-300">
                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        Our Mission
                                    </h2>
                                    <p>
                                        BrickOasis is a passion project created
                                        by LEGO enthusiasts, for LEGO
                                        enthusiasts. Our mission is to provide a
                                        comprehensive platform where builders
                                        can explore, create, share, and profit
                                        from their love of LEGO.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        What We Offer
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                            <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                                                3D Model Viewer
                                            </h3>
                                            <p>
                                                View LDraw LEGO models in
                                                stunning 3D with interactive
                                                building instructions powered by
                                                Three.js technology.
                                            </p>
                                        </div>
                                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                            <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                                                MOC Marketplace
                                            </h3>
                                            <p>
                                                Buy and sell custom My Own
                                                Creations (MOCs) with a vibrant
                                                community of builders and
                                                designers.
                                            </p>
                                        </div>
                                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                            <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                                                Comprehensive Catalog
                                            </h3>
                                            <p>
                                                Explore a vast database of LEGO
                                                sets, parts, minifigures, and
                                                themes powered by Rebrickable
                                                data.
                                            </p>
                                        </div>
                                        <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                            <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                                                Flipping Tracker
                                            </h3>
                                            <p>
                                                Track your LEGO investment
                                                portfolio with advanced buy/sell
                                                matching and profit analytics.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        Technology Stack
                                    </h2>
                                    <p className="mb-4">
                                        BrickOasis is built with modern web
                                        technologies to provide a fast,
                                        reliable, and beautiful user experience:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            <strong>Frontend:</strong> React 19
                                            with TypeScript, Tailwind CSS 4, and
                                            Inertia.js
                                        </li>
                                        <li>
                                            <strong>Backend:</strong> Laravel 12
                                            with PHP 8.2+
                                        </li>
                                        <li>
                                            <strong>3D Rendering:</strong>{" "}
                                            Three.js with @react-three/fiber and
                                            LDrawLoader
                                        </li>
                                        <li>
                                            <strong>Data:</strong> Rebrickable
                                            API for LEGO set and part
                                            information
                                        </li>
                                        <li>
                                            <strong>Payments:</strong> Stripe
                                            for secure transactions
                                        </li>
                                        <li>
                                            <strong>Authentication:</strong>{" "}
                                            Laravel Sanctum with Google OAuth
                                            support
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        LDraw Integration
                                    </h2>
                                    <p className="mb-2">
                                        BrickOasis leverages the open-source{" "}
                                        <a
                                            href="https://ldraw.org"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:text-yellow-300"
                                        >
                                            LDraw
                                        </a>{" "}
                                        system for representing LEGO models.
                                        LDraw is a community-developed standard
                                        that allows builders to:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            Design virtual LEGO models with
                                            precision
                                        </li>
                                        <li>
                                            Create step-by-step building
                                            instructions
                                        </li>
                                        <li>
                                            Render photorealistic images of
                                            builds
                                        </li>
                                        <li>
                                            Share creations in a standardized
                                            format
                                        </li>
                                    </ul>
                                    <p className="mt-2">
                                        We're grateful to the LDraw community
                                        for maintaining this incredible library
                                        of LEGO parts and tools.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        LEGO® Trademark Notice
                                    </h2>
                                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded">
                                        <p className="mb-2">
                                            LEGO® is a trademark of the LEGO
                                            Group of companies which does not
                                            sponsor, authorize, or endorse this
                                            site.
                                        </p>
                                        <p>
                                            BrickOasis is an independent,
                                            fan-created platform. We are not
                                            affiliated with, endorsed by, or
                                            officially connected with the LEGO
                                            Group. We follow the{" "}
                                            <a
                                                href="https://www.lego.com/legal/notices-and-policies/fair-play"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                LEGO Fair Play guidelines
                                            </a>{" "}
                                            and respect all LEGO trademarks and
                                            intellectual property.
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        Data Attribution
                                    </h2>
                                    <p>
                                        BrickOasis uses set and part cataloging
                                        data from{" "}
                                        <a
                                            href="https://rebrickable.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:text-yellow-300"
                                        >
                                            Rebrickable
                                        </a>
                                        , a comprehensive LEGO database
                                        maintained by the community. We're
                                        grateful for their work in cataloging
                                        the vast LEGO universe.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        Community Guidelines
                                    </h2>
                                    <p className="mb-2">
                                        BrickOasis is built on respect for
                                        intellectual property and the LEGO
                                        community. We expect all users to:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            Respect LEGO trademarks and
                                            copyrights
                                        </li>
                                        <li>
                                            Only upload original creations or
                                            properly licensed content
                                        </li>
                                        <li>
                                            Give credit to other builders and
                                            designers
                                        </li>
                                        <li>
                                            Engage respectfully with the
                                            community
                                        </li>
                                        <li>
                                            Follow our{" "}
                                            <Link
                                                href="/terms"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                Terms of Service
                                            </Link>
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        Open Source and Credits
                                    </h2>
                                    <p className="mb-2">
                                        BrickOasis is built on the shoulders of
                                        giants. Special thanks to:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            <a
                                                href="https://ldraw.org"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                LDraw.org
                                            </a>{" "}
                                            - Open standard for LEGO CAD
                                            programs
                                        </li>
                                        <li>
                                            <a
                                                href="https://rebrickable.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                Rebrickable
                                            </a>{" "}
                                            - LEGO set and part database
                                        </li>
                                        <li>
                                            <a
                                                href="https://threejs.org"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                Three.js
                                            </a>{" "}
                                            - 3D rendering engine
                                        </li>
                                        <li>
                                            <a
                                                href="https://laravel.com"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                Laravel
                                            </a>{" "}
                                            and{" "}
                                            <a
                                                href="https://react.dev"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                React
                                            </a>{" "}
                                            - Application frameworks
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        Contact Us
                                    </h2>
                                    <p className="mb-2">
                                        We'd love to hear from you! Whether you
                                        have questions, feedback, or partnership
                                        inquiries:
                                    </p>
                                    <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                        <p>Email: hello@brickoasis.com</p>
                                        <p>Support: support@brickoasis.com</p>
                                        <p>
                                            Or use our{" "}
                                            <Link
                                                href="/contact"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                contact form
                                            </Link>
                                        </p>
                                    </div>
                                </section>

                                <div className="mt-8 pt-6 border-t border-gray-700 text-center">
                                    <p className="text-xl text-white mb-4">
                                        Thank you for being part of the
                                        BrickOasis community!
                                    </p>
                                    <Link
                                        href="/"
                                        className="inline-block bg-linear-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold px-6 py-3 rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all"
                                    >
                                        Explore BrickOasis
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <Footer />
            </div>
        </>
    );
}
