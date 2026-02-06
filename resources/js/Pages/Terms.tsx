import { Head, Link } from "@inertiajs/react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Terms() {
    return (
        <>
            <Head>
                <title>Terms of Service - BrickOasis</title>
                <meta
                    name="description"
                    content="BrickOasis Terms of Service - Read our terms and conditions for using the platform."
                />
            </Head>

            <div className="min-h-screen bg-gray-900">
                <Header />

                <div className="py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-linear-to-r from-yellow-400 to-orange-500 mb-8">
                                Terms of Service
                            </h1>

                            <div className="space-y-6 text-gray-300">
                                <p className="text-sm text-gray-400">
                                    Last updated: February 7, 2026
                                </p>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        1. Acceptance of Terms
                                    </h2>
                                    <p>
                                        By accessing and using BrickOasis ("the
                                        Platform"), you accept and agree to be
                                        bound by these Terms of Service. If you
                                        do not agree to these terms, please do
                                        not use the Platform.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        2. LEGO® Trademark Disclaimer
                                    </h2>
                                    <div className="bg-yellow-900/20 border border-yellow-500/30 p-4 rounded">
                                        <p className="font-semibold mb-2">
                                            IMPORTANT NOTICE:
                                        </p>
                                        <p className="mb-2">
                                            LEGO® is a trademark of the LEGO
                                            Group of companies which does not
                                            sponsor, authorize, or endorse this
                                            site.
                                        </p>
                                        <p>
                                            BrickOasis is an independent
                                            platform created by LEGO enthusiasts
                                            for LEGO enthusiasts. We are not
                                            affiliated with, endorsed by,
                                            sponsored by, or officially
                                            connected with the LEGO Group.
                                        </p>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        3. LEGO Fair Play Guidelines
                                    </h2>
                                    <p className="mb-2">
                                        BrickOasis and its users must comply
                                        with the{" "}
                                        <a
                                            href="https://www.lego.com/legal/notices-and-policies/fair-play"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:text-yellow-300"
                                        >
                                            LEGO Fair Play guidelines
                                        </a>
                                        :
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            We do not claim ownership of LEGO®
                                            trademarks or intellectual property
                                        </li>
                                        <li>
                                            Content must not imply official LEGO
                                            Group endorsement
                                        </li>
                                        <li>
                                            The LEGO logo and minifigure are
                                            used for descriptive purposes only
                                        </li>
                                        <li>
                                            Users may not upload or sell content
                                            that directly copies official LEGO
                                            sets without transformation
                                        </li>
                                        <li>
                                            Original MOCs (My Own Creations)
                                            must be clearly marked as
                                            fan-created content
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        4. User Accounts
                                    </h2>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        4.1 Registration
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            You must be at least 13 years old to
                                            create an account
                                        </li>
                                        <li>
                                            You must provide accurate and
                                            complete information
                                        </li>
                                        <li>
                                            You are responsible for maintaining
                                            account security
                                        </li>
                                        <li>
                                            One person or business may not
                                            maintain more than one account
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                                        4.2 Account Termination
                                    </h3>
                                    <p>
                                        We reserve the right to suspend or
                                        terminate accounts that violate these
                                        terms, engage in fraudulent activity, or
                                        infringe on intellectual property
                                        rights.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        5. User Content and Intellectual
                                        Property
                                    </h2>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        5.1 Your Content
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            You retain ownership of content you
                                            upload (LDraw files, MOCs, images)
                                        </li>
                                        <li>
                                            By uploading, you grant BrickOasis a
                                            non-exclusive license to display,
                                            distribute, and promote your content
                                        </li>
                                        <li>
                                            You represent that you have the
                                            right to upload and share the
                                            content
                                        </li>
                                        <li>
                                            You must not upload content that
                                            infringes on others' copyrights,
                                            trademarks, or intellectual property
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                                        5.2 LDraw Files and Models
                                    </h3>
                                    <p>
                                        LDraw files use the LDraw parts library,
                                        which is distributed under the{" "}
                                        <a
                                            href="https://www.ldraw.org/article/349.html"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:text-yellow-300"
                                        >
                                            LDraw.org Contributor Agreement
                                        </a>
                                        . Models you create and upload must:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                                        <li>
                                            Be your original creation or
                                            properly licensed
                                        </li>
                                        <li>
                                            Not directly replicate copyrighted
                                            official LEGO instruction manuals
                                        </li>
                                        <li>
                                            Include proper attribution for
                                            derivative works
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                                        5.3 Prohibited Content
                                    </h3>
                                    <p>You may not upload content that:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                                        <li>
                                            Is illegal, harmful, threatening,
                                            abusive, or offensive
                                        </li>
                                        <li>
                                            Infringes on intellectual property
                                            rights
                                        </li>
                                        <li>
                                            Contains malware or malicious code
                                        </li>
                                        <li>
                                            Violates LEGO Fair Play or trademark
                                            guidelines
                                        </li>
                                        <li>
                                            Contains sexually explicit or adult
                                            content
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        6. Marketplace and Transactions
                                    </h2>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        6.1 Selling Content
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            Sellers must provide accurate
                                            descriptions and fair pricing
                                        </li>
                                        <li>
                                            BrickOasis takes a 5% platform fee
                                            on all sales
                                        </li>
                                        <li>
                                            Payments are processed securely
                                            through Stripe
                                        </li>
                                        <li>
                                            Sellers are responsible for
                                            applicable taxes
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                                        6.2 Purchasing Content
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            All sales are final (digital goods)
                                        </li>
                                        <li>
                                            Purchased content is for personal
                                            use only
                                        </li>
                                        <li>
                                            You may not redistribute or resell
                                            purchased content
                                        </li>
                                        <li>
                                            Refunds may be issued at
                                            BrickOasis's discretion for
                                            defective content
                                        </li>
                                    </ul>

                                    <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                                        6.3 Pro Subscriptions
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            Subscriptions are billed monthly and
                                            auto-renew
                                        </li>
                                        <li>You may cancel at any time</li>
                                        <li>
                                            No refunds for partial billing
                                            periods
                                        </li>
                                        <li>
                                            Features and pricing may change with
                                            30 days notice
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        7. Data Attribution
                                    </h2>
                                    <p>
                                        BrickOasis uses data from{" "}
                                        <a
                                            href="https://rebrickable.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-yellow-400 hover:text-yellow-300"
                                        >
                                            Rebrickable
                                        </a>{" "}
                                        for LEGO set and part information. This
                                        data is used under Rebrickable's terms
                                        and is provided "as is" without
                                        warranty.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        8. Acceptable Use
                                    </h2>
                                    <p className="mb-2">You agree not to:</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>
                                            Use the Platform for any illegal
                                            purpose
                                        </li>
                                        <li>
                                            Harass, abuse, or harm other users
                                        </li>
                                        <li>
                                            Attempt to gain unauthorized access
                                            to systems or accounts
                                        </li>
                                        <li>
                                            Upload viruses or malicious code
                                        </li>
                                        <li>
                                            Scrape, crawl, or harvest data
                                            without permission
                                        </li>
                                        <li>
                                            Impersonate others or misrepresent
                                            affiliation
                                        </li>
                                        <li>
                                            Interfere with the Platform's
                                            operation
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        9. Disclaimers and Limitation of
                                        Liability
                                    </h2>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        9.1 Service Availability
                                    </h3>
                                    <p>
                                        The Platform is provided "as is" without
                                        warranties of any kind. We do not
                                        guarantee uninterrupted or error-free
                                        service.
                                    </p>

                                    <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                                        9.2 User Content
                                    </h3>
                                    <p>
                                        We are not responsible for
                                        user-generated content. Users are solely
                                        responsible for compliance with
                                        intellectual property laws.
                                    </p>

                                    <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                                        9.3 Limitation of Liability
                                    </h3>
                                    <p>
                                        To the fullest extent permitted by law,
                                        BrickOasis shall not be liable for any
                                        indirect, incidental, special, or
                                        consequential damages arising from your
                                        use of the Platform.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        10. Indemnification
                                    </h2>
                                    <p>
                                        You agree to indemnify and hold
                                        BrickOasis harmless from any claims,
                                        damages, or expenses arising from your
                                        violation of these Terms or infringement
                                        of intellectual property rights.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        11. DMCA and Copyright Infringement
                                    </h2>
                                    <p>
                                        If you believe content on BrickOasis
                                        infringes your copyright, please contact
                                        us at dmca@brickoasis.com with:
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                                        <li>
                                            Identification of the copyrighted
                                            work
                                        </li>
                                        <li>
                                            Location of the infringing material
                                        </li>
                                        <li>Your contact information</li>
                                        <li>
                                            A statement of good faith belief of
                                            infringement
                                        </li>
                                        <li>
                                            A statement under penalty of perjury
                                            that the information is accurate
                                        </li>
                                    </ul>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        12. Changes to Terms
                                    </h2>
                                    <p>
                                        We reserve the right to modify these
                                        Terms at any time. Material changes will
                                        be notified via email or platform
                                        notice. Your continued use after changes
                                        constitutes acceptance of the updated
                                        Terms.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        13. Governing Law
                                    </h2>
                                    <p>
                                        These Terms are governed by the laws of
                                        your jurisdiction. Disputes will be
                                        resolved through binding arbitration or
                                        small claims court.
                                    </p>
                                </section>

                                <section>
                                    <h2 className="text-2xl font-semibold text-white mb-4">
                                        14. Contact Information
                                    </h2>
                                    <p>
                                        For questions about these Terms, please
                                        contact:
                                    </p>
                                    <div className="mt-2 bg-gray-900/50 p-4 rounded border border-gray-700">
                                        <p>Email: legal@brickoasis.com</p>
                                        <p>
                                            Or visit our{" "}
                                            <Link
                                                href="/contact"
                                                className="text-yellow-400 hover:text-yellow-300"
                                            >
                                                contact page
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
