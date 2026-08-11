export default function Pagination({ page, pageCount, onChange, className = "" }) {
  if (pageCount <= 1) return null;
  return (
    <div className={`pagination ${className}`}>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" className={n === page ? "active" : ""} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}
