export function ResultCount({ from, to, total }: { from: number; to: number; total: number }) {
  return (
    <p className="results-headline">
      Showing <strong>{from}&ndash;{to}</strong> of <strong>{total}</strong> {total === 1 ? "experience" : "experiences"}
    </p>
  );
}
