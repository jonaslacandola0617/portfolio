interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <div className="mb-10 max-w-2xl">
      {eyebrow && (
        <div className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl text-balance">
        {title}
      </h1>
      {description && <p className="mt-3 text-base text-muted-foreground text-balance">{description}</p>}
    </div>
  );
}
