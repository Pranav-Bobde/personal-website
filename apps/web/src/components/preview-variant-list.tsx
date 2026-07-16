interface PreviewVariantListItem {
  name: string;
  tagline: string;
  to: string;
  tradeoff: string;
}

interface PreviewVariantListProps {
  variants: readonly PreviewVariantListItem[];
}

export function PreviewVariantList({ variants }: PreviewVariantListProps) {
  return (
    <div className="border-border border">
      {variants.map((variant, index) => (
        <a
          key={variant.to}
          href={variant.to}
          className="border-border hover:bg-secondary/20 group block border-b p-5 transition-colors last:border-b-0"
        >
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-accent text-xs tracking-widest">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="group-hover:text-accent font-bold transition-colors">{variant.name}</h2>
            <span className="text-muted-foreground text-sm">{variant.tagline}</span>
          </div>
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">{variant.tradeoff}</p>
        </a>
      ))}
    </div>
  );
}
