export default function JDQPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <header className="mb-6 text-center">
          <h1 className="font-heading text-3xl text-black">
            Here you can find all of the JDQ podcasts!
          </h1>
          <p className="mt-2 text-textc">
            The perfect place to catch up if you miss an episode — and when
            you’re done, don’t forget to add your score to the leaderboard!
          </p>
        </header>

        {/* Card with responsive iframe */}
        <section className="rounded-2xl border borderc bg-white shadow-card p-4 sm:p-6">
          <div
            className="relative w-full overflow-hidden rounded-xl border borderc shadow-inner"
            style={{ paddingTop: "56.25%" /* 16:9 */ }}
          >
            <iframe
              className="absolute inset-0 h-full w-full"
              src="https://embed.acast.com/67715725024ebc889dd99c23?font-family=Quicksand&font-src=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DQuicksand&subscribe=false&feed=true"
              title="JDQ Podcasts"
              allow="autoplay; encrypted-media"
              loading="lazy"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
