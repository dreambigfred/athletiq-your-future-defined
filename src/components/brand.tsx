export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-baseline gap-[2px] font-display text-2xl tracking-wide ${className}`}>
      <span className="text-foreground">athlet</span>
      <span className="text-primary">IQ</span>
    </div>
  );
}

export function GoldLine() {
  return <div className="gold-line" />;
}
