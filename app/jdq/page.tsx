export default function JDQPage() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center p-8 ">
        <h1 className="text-center text-4xl font-bold text-black-800">
          Here you can find all of the JDQ podcasts!
        </h1>
        <h2 className="text-center text-2xl font-bold text-black-800">
          The perfect place to find them, if you ever miss an episode!
        </h2>
        <h2 className="text-center text-2xl font-bold text-black-800">
          When you&apos;ve finished a quiz, don&apos;t forget to add your score
          to the leaderboard!
        </h2>
      </div>
      <iframe
        className="p-4"
        src="https://embed.acast.com/67715725024ebc889dd99c23?font-family=Quicksand&font-src=https%3A%2F%2Ffonts.googleapis.com%2Fcss%3Ffamily%3DQuicksand&subscribe=false&feed=true"
        width="100%"
        height="630px"
      ></iframe>
    </div>
  );
}
