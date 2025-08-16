export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-purple-100 to-purple-900 py-12 px-4">
      <div className="max-w-3xl mx-auto rounded-lg bg-white/80 backdrop-blur-md border border-purple-800 shadow-lg shadow-purple-50/20 p-8">
        <h1 className="font-heading text-3xl text-purple-900 mb-6">
          About Jay’s Quiz Hub
        </h1>
        <p className="text-textc-muted mb-4">
          Jay’s Quiz Hub is the home of quizzing online. Built around Jay’s
          Daily Quiz (JDQ) podcast and Jay’s Virtual Quiz (JVQ) live streams,
          the site brings together players from around the world to test their
          knowledge, track their scores, and climb the leaderboards.
        </p>
        <p className="text-textc-muted mb-4">
          What started as a fun way to connect people through quizzes has grown
          into a thriving community. Whether you’re here to play along live on
          YouTube, log your daily score, or browse quiz recaps, Jay’s Quiz Hub
          is designed to make quizzing simple, fun, and social.
        </p>
        <p className="text-textc-muted">
          Thank you for being part of the journey — and good luck climbing those
          leaderboards!
          <br />
          More to come soon on here!
        </p>
      </div>
    </main>
  );
}
