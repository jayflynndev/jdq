type Round = {
  roundName: string;
  numQuestions: number;
};

type Part = {
  name: string;
  rounds: Round[];
};

interface AdminRoundsInfoProps {
  parts: Part[];
}

export function AdminRoundsInfo({ parts }: AdminRoundsInfoProps) {
  return (
    <div className="bg-purple-100 rounded-xl p-4 shadow">
      <div className="font-semibold text-purple-700 mb-1">Rounds</div>
      <ul className="list-disc list-inside text-gray-700">
        {(parts || []).map((part, idx) => (
          <li key={idx} style={{ marginBottom: "8px" }}>
            <span className="font-bold">{part.name}</span>
            <ul className="ml-6 list-[circle]">
              {(part.rounds || []).map((r, i) => (
                <li key={i}>
                  {r.roundName} ({r.numQuestions} questions)
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
