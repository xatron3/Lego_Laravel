import { Head, Link } from "@inertiajs/react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Privacy() {
    return (
        <>
            <Head>
                <title>Privacy Policy - BrickOasis</title>
                <meta
                    name="description"
                    content="BrickOasis privacy policy - Learn how we collect, use, and protect your personal information."
                />
            </Head>

            <div className="min-h-screen bg-gray-900">
                <Header />

                <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 mb-8">
                                Privacy Policy
                            </h1>

                            <div className="space-y-6 text-gray-300">
                                <p className="text-sm text-gray-400">
                                    Last updated: February 7, 2026
                                </p>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        1. Introduction
                                    </h2>
                                    <p>
                                        BrickOasis ("we," "our," or "us") is
                                        committed to protecting your privacy.
                                        This Privacy Policy explains how we
                                        collect, use, disclose, and safeguard
                                        your information when you use our
                                        platform.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        2. Information We Collect
                                    </h2>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        2.1 Information You Provide
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            <strong>
                                                Account Information:
                                            </strong>{" "}
                                            Name, email address, password, and
                                            profile picture
                                        </li>
                                        <li>
                                            <strong>
                                                User-Generated Content:
                                            </strong>{" "}
                                            LDraw models, MOCs, comments, and
                                            other content you upload
                                        </li>
                                        <li>
                                            <strong>Transaction Data:</strong>{" "}
                                            LEGO flipping tracker data, purchase
                                            history, and pricing information
                                        </li>
                                        <li>
                                            <strong>
                                                Payment Information:
                                            </strong>{" "}
                                            Processed securely through Stripe
                                            (we do not store full credit card
                                            details)
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                                        2.2 Automatically Collected Information
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            <strong>Usage Data:</strong> IP
                                            address, browser type, device
                                            information, and pages visited
                                        </li>
                                        <li>
                                            <strong>Cookies:</strong> Session
                                            cookies for authentication and user
                                            preferences
                                        </li>
                                        <li>
                                            <strong>Database Logs:</strong>{" "}
                                            Error logs and performance metrics
                                            for troubleshooting
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        3. How We Use Your Information
                                    </h2>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            Provide, maintain, and improve our
                                            services
                                        </li>
                                        <li>
                                            Process transactions and send
                                            transaction notifications
                                        </li>
                                        <li>
                                            Authenticate users and protect
                                            against fraud
                                        </li>
                                        <li>
                                            Send service-related communications
                                            (purchase confirmations, account
                                            updates)
                                        </li>
                                        <li>
                                            Respond to support requests and user
                                            inquiries
                                        </li>
                                        <li>
                                            Analyze usage patterns to improve
                                            user experience
                                        </li>
                                        <li>
                                            Comply with legal obligations and
                                            enforce our Terms of Service
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        4. Third-Party Services
                                    </h2>
                                    <p className="mb-2">
                                        We use the following third-party
                                        services:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            <strong>Stripe:</strong> Payment
                                            processing (see{" "}
                                            <a
                                                href="https://stripe.com/privacy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                Stripe Privacy Policy
                                            </a>
                                            )
                                        </li>
                                        <li>
                                            <strong>Google OAuth:</strong>{" "}
                                            Third-party authentication
                                            (optional)
                                        </li>
                                        <li>
                                            <strong>Rebrickable API:</strong>{" "}
                                            LEGO set and part data (see{" "}
                                            <a
                                                href="https://rebrickable.com/privacy"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                Rebrickable Privacy
                                            </a>
                                            )
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        5. Data Sharing and Disclosure
                                    </h2>
                                    <p className="mb-2">
                                        We do not sell your personal
                                        information. We may share data in the
                                        following circumstances:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            <strong>Public Content:</strong>{" "}
                                            Models, MOCs, and comments you
                                            publicly share are visible to other
                                            users
                                        </li>
                                        <li>
                                            <strong>Service Providers:</strong>{" "}
                                            Third-party processors (e.g.,
                                            Stripe) necessary to provide
                                            services
                                        </li>
                                        <li>
                                            <strong>Legal Requirements:</strong>{" "}
                                            To comply with court orders,
                                            subpoenas, or legal processes
                                        </li>
                                        <li>
                                            <strong>Business Transfers:</strong>{" "}
                                            In connection with mergers,
                                            acquisitions, or asset sales
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        6. Data Security
                                    </h2>
                                    <p>
                                        We implement industry-standard security
                                        measures including:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                                        <li>
                                            HTTPS encryption for data in transit
                                        </li>
                                        <li>
                                            Bcrypt hashing for password storage
                                        </li>
                                        <li>
                                            Laravel Sanctum for secure API
                                            authentication
                                        </li>
                                        <li>
                                            Regular security updates and
                                            monitoring
                                        </li>
                                    </ul>
                                    <p className="mt-2">
                                        However, no method of transmission over
                                        the internet is 100% secure. We cannot
                                        guarantee absolute security.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        7. Your Rights
                                    </h2>
                                    <p className="mb-2">
                                        Depending on your location, you may have
                                        the following rights:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            <strong>Access:</strong> Request a
                                            copy of your personal data
                                        </li>
                                        <li>
                                            <strong>Correction:</strong> Update
                                            inaccurate or incomplete information
                                        </li>
                                        <li>
                                            <strong>Deletion:</strong> Request
                                            deletion of your account and data
                                        </li>
                                        <li>
                                            <strong>Data Portability:</strong>{" "}
                                            Export your data in a structured
                                            format
                                        </li>
                                        <li>
                                            <strong>Opt-Out:</strong>{" "}
                                            Unsubscribe from promotional emails
                                            (service emails may still be sent)
                                        </li>
                                    </ul>
                                    <p className="mt-2">
                                        To exercise these rights, please contact
                                        us at privacy@brickoasis.com.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        8. Data Retention
                                    </h2>
                                    <p>
                                        We retain your personal information for
                                        as long as your account is active or as
                                        needed to provide services. After
                                        account deletion, we may retain certain
                                        data for:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                                        <li>
                                            Legal compliance (e.g., tax records)
                                        </li>
                                        <li>Fraud prevention and security</li>
                                        <li>Dispute resolution</li>
                                        <li>
                                            Enforcing agreements (up to 7 years)
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        9. Children's Privacy
                                    </h2>
                                    <p>
                                        BrickOasis is not intended for users
                                        under 13 years old. We do not knowingly
                                        collect personal information from
                                        children. If you believe a child has
                                        provided us with personal information,
                                        please contact us immediately.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        10. International Data Transfers
                                    </h2>
                                    <p>
                                        Your information may be transferred to
                                        and processed in countries other than
                                        your country of residence. We ensure
                                        appropriate safeguards are in place to
                                        protect your data in accordance with
                                        this Privacy Policy.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        11. Changes to This Policy
                                    </h2>
                                    <p>
                                        We may update this Privacy Policy from
                                        time to time. We will notify you of
                                        significant changes by posting the new
                                        policy on this page and updating the
                                        "Last updated" date. Your continued use
                                        of BrickOasis after changes constitutes
                                        acceptance of the updated policy.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        12. Contact Us
                                    </h2>
                                    <p>
                                        If you have questions about this Privacy
                                        Policy or our data practices, please
                                        contact us at:
                                    </p>
                                    <div className="mt-2 bg-gray-900/50 p-4 rounded border border-gray-700">
                                        <p>Email: privacy@brickoasis.com</p>
                                        <p>
                                            Or via our{" "}
                                            <Link
                                                href="/contact"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                contact form
                                            </Link>
                                        </p>
                                    </div>
                                </section>

                                <div className="mt-8 pt-6 border-t border-gray-700">
                                    <Link
                                        href="/"
                                        className="text-yellow-400 hover:text-yellow-300"
                                    >
                                        ← Back to Home
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
