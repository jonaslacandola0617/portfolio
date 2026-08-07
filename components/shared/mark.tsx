export function Mark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="31" height="31" stroke="var(--border-strong)" strokeWidth="1" />
      <circle cx="16" cy="12" r="5.5" fill="var(--cobalt)" />
      <rect x="6" y="20" width="20" height="6" fill="var(--text)" />
      <rect x="6" y="20" width="6" height="6" fill="var(--vermilion)" />
    </svg>
  );
}
