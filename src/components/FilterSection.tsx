const filters = ['Workout', 'Relax', 'Energize', 'Commute'];

export default function FilterSection() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
      {filters.map((filter) => (
        <button
          key={filter}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors whitespace-nowrap"
        >
          {filter}
        </button>
      ))}
    </div>
  );
} 