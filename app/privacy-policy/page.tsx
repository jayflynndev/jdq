export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900 py-12 px-4">
      <div className="max-w-3xl mx-auto rounded-lg bg-white/80 backdrop-blur-md border border-purple-800 shadow-lg shadow-purple-50/20 p-8">
        <h1 className="font-heading text-3xl text-purple-900 mb-6">
          Privacy Policy
        </h1>
        <p className="text-textc-muted mb-4">
          This Privacy Policy explains how Jay’s Quiz Hub collects, uses, and
          protects your information when you use this website and related
          services.
        </p>

        <h2 className="text-xl font-semibold text-purple-800 mt-6 mb-2">
          Information We Collect
        </h2>
        <p className="text-textc-muted mb-4">
          We collect information you provide during sign up (such as your email
          address and username), scores you submit, and any messages you send
          via our contact forms or quiz system.
        </p>

        <h2 className="text-xl font-semibold text-purple-800 mt-6 mb-2">
          How We Use Your Information
        </h2>
        <ul className="list-disc pl-6 mb-4 text-textc-muted">
          <li>To provide leaderboard and quiz features</li>
          <li>To communicate important updates</li>
          <li>To keep the community safe and secure</li>
        </ul>

        <h2 className="text-xl font-semibold text-purple-800 mt-6 mb-2">
          Third-Party Services
        </h2>
        <p className="text-textc-muted mb-4">
          We may use third-party services such as Google Analytics and Google
          Ads. These services may collect data in accordance with their own
          privacy policies.
        </p>

        <h2 className="text-xl font-semibold text-purple-800 mt-6 mb-2">
          Your Rights
        </h2>
        <p className="text-textc-muted mb-4">
          You may request deletion of your account at any time using the “Danger
          Zone” option in your profile settings.
        </p>
        <p className="text-textc-muted">
          If you have questions about this policy, please contact us at{" "}
          <a
            href="mailto:info@example.com"
            className="text-purple-700 underline"
          >
            info@example.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}
