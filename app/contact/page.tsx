import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-6">
          <h1 className="font-heading text-3xl text-black">
            Contact Jay’s Quiz Hub
          </h1>
          <p className="text-textc-muted">
            Found a bug, need a correction, or have an idea? Ping us here.
          </p>
        </header>

        <ContactForm />
      </div>
    </main>
  );
}
