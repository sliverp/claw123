interface Props {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarDisplay({ rating, size = 'md' }: Props) {
  const sizeClass = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' }[size];
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<span key={i} className={`${sizeClass} text-amber-400`}>★</span>);
    } else if (i - 0.5 <= rating) {
      stars.push(<span key={i} className={`${sizeClass} text-amber-400`}>★</span>);
    } else {
      stars.push(<span key={i} className={`${sizeClass} text-slate-200`}>★</span>);
    }
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      {stars}
      {rating > 0 && (
        <span className={`ml-1 ${size === 'sm' ? 'text-xs' : 'text-sm'} text-slate-500 font-medium`}>
          {rating.toFixed(1)}
        </span>
      )}
    </span>
  );
}
