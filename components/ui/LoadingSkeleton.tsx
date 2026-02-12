export function CardSkeleton() {
  return (
    <div className="qhl-card p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="h-3 w-16 bg-violet-300/20 rounded"></div>
        <div className="h-10 w-10 bg-violet-300/20 rounded-lg"></div>
      </div>
      <div className="mt-2 h-8 w-32 bg-violet-300/30 rounded"></div>
      <div className="mt-2 h-4 w-full bg-violet-300/20 rounded"></div>
      <div className="mt-1 h-4 w-3/4 bg-violet-300/20 rounded"></div>
    </div>
  );
}

export function QuizListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="qhl-card p-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 w-48 bg-violet-300/30 rounded mb-2"></div>
              <div className="h-3 w-32 bg-violet-300/20 rounded"></div>
            </div>
            <div className="h-9 w-24 bg-violet-300/20 rounded-xl"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-12 flex-1 bg-violet-300/20 rounded"></div>
          <div className="h-12 w-32 bg-violet-300/20 rounded"></div>
          <div className="h-12 w-24 bg-violet-300/20 rounded"></div>
        </div>
      ))}
    </div>
  );
}
