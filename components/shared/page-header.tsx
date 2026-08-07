interface PageHeaderProps { index?: string; eyebrow?: string; title: string; description?: string; }
export function PageHeader({ index="01", eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="border-b border-border px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex items-center gap-3"><span className="idx">{index}</span>{eyebrow && <span className="label">{eyebrow}</span>}</div>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] text-text sm:text-5xl lg:text-6xl">{title}</h1>
        {description && <p className="mt-5 max-w-2xl text-base text-text-dim sm:text-lg">{description}</p>}
      </div>
    </header>
  );
}

export function PageShell({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-5xl px-6 py-12 sm:px-10 lg:px-14 ${className}`}>{children}</div>;
}

export function SectionLabel({ index, title }: { index: string; title: string }) {
  return <div className="mb-6 flex items-baseline gap-3"><span className="idx">{index}</span><h2 className="font-display text-2xl font-semibold text-text sm:text-3xl">{title}</h2><span className="rule-strong ml-2 flex-1" /></div>;
}
