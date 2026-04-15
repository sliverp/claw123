interface Props {
  categories: string[];
  labels: Record<string, string>;
  active: string;
  onChange: (cat: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  all: '🏠',
  gateway: '🚪',
  proxy: '🔄',
  aggregator: '🧩',
  tool: '🔧',
  other: '📦',
};

export default function CategoryFilter({ categories, labels, active, onChange }: Props) {
  return (
    <nav className="flex flex-col gap-1 w-full">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left ${
            active === cat
              ? 'bg-blue-50 text-blue-700 border-l-[3px] border-blue-600'
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-l-[3px] border-transparent'
          }`}
        >
          <span className="text-base">{CATEGORY_ICONS[cat] || '📦'}</span>
          <span>{labels[cat] || cat}</span>
        </button>
      ))}
    </nav>
  );
}
