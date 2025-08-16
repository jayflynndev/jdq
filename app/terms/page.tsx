export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900 py-12 px-4">
      <div className="max-w-3xl mx-auto rounded-lg bg-white/80 backdrop-blur-md border border-purple-800 shadow-lg shadow-purple-50/20 p-8">
        <h1 className="font-heading text-3xl text-purple-900 mb-6">
          Terms of Service
        </h1>
        <p className="text-textc-muted mb-4">
          By accessing and using Jay’s Quiz Hub, you agree to the following
          terms and conditions.
        </p>

        <h2 className="text-xl font-semibold text-purple-800 mt-6 mb-2">
          Use of the Site
        </h2>
        <p className="text-textc-muted mb-4">
          You agree to use Jay’s Quiz Hub for personal, non-commercial purposes.
          You must not misuse the site or interfere with the experience of other
          users.
        </p>

        <h2 className="text-xl font-semibold text-purple-800 mt-6 mb-2">
          Accounts
        </h2>
        <p className="text-textc-muted mb-4">
          You are responsible for keeping your account secure. Do not share your
          password or impersonate others.
        </p>

        <h2 className="text-xl font-semibold text-purple-800 mt-6 mb-2">
          Content
        </h2>
        <p className="text-textc-muted mb-4">
          All quiz content, branding, and design belong to Jay’s Quiz Hub. You
          may not reuse or distribute content without permission.
        </p>

        <h2 className="text-xl font-semibold text-purple-800 mt-6 mb-2">
          Liability
        </h2>
        <p className="text-textc-muted mb-4">
          Jay’s Quiz Hub is provided “as is” without warranties of any kind. We
          do not guarantee uninterrupted availability or accuracy of scores.
        </p>

        <p className="text-textc-muted">
          These terms may be updated occasionally. Continued use of the site
          indicates acceptance of the latest terms.
        </p>
      </div>
    </main>
  );
}
