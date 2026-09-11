interface PageHeaderProps { index?: string; eyebrow?: string; title: string; description?: string; }

export function PageHeader({ index="01", eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="public-page-header">
      <div className="public-page-header-inner">
        <div className="public-page-kicker"><span>{index}</span>{eyebrow && <span>{eyebrow}</span>}</div>
        <div className="public-page-title-wrap">
          <h1>{title}</h1>
          <div className="public-page-geometry" aria-hidden="true"><span /><i /><b /></div>
        </div>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}

export function PageShell({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={`public-page-shell ${className}`}>{children}</div>;
}

export function SectionLabel({ index, title }: { index: string; title: string }) {
  return <div className="public-section-label"><span>{index}</span><h2>{title}</h2><i /></div>;
}
