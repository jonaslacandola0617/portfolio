/**
 * A small, deterministic network diagram generated from a lab's slug, so every
 * lab card gets its own topology without needing an uploaded image.
 */
function seeded(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function LabTopology({ seed, className }: { seed: string; className?: string }) {
  const random = seeded(seed);
  const width = 320;
  const height = 150;
  const count = 5 + Math.floor(random() * 3);

  // Core router in the middle, switches and hosts spread around it.
  type TopoNode = { x: number; y: number; kind: "router" | "switch" | "host" };
  const nodes: TopoNode[] = [{ x: width / 2, y: height / 2, kind: "router" }];
  for (let i = 1; i < count; i += 1) {
    const angle = (i / (count - 1)) * Math.PI * 2 + random() * 0.6;
    const radius = 42 + random() * 26;
    nodes.push({
      x: Math.round(width / 2 + Math.cos(angle) * radius * 1.9),
      y: Math.round(height / 2 + Math.sin(angle) * radius * 0.85),
      kind: i % 3 === 0 ? "switch" : "host",
    });
  }

  const edges: [number, number][] = [];
  for (let i = 1; i < nodes.length; i += 1) {
    const parent = nodes[i].kind === "host" && i > 2 && random() > 0.5 ? i - 1 : 0;
    edges.push([parent, i]);
  }
  if (nodes.length > 4) edges.push([1, nodes.length - 1]);

  return (
    <svg className={className} viewBox={`0 0 ${width} ${height}`} role="presentation" aria-hidden="true">
      {edges.map(([a, b], index) => (
        <line
          key={`${a}-${b}`}
          className="topo-edge"
          x1={nodes[a].x}
          y1={nodes[a].y}
          x2={nodes[b].x}
          y2={nodes[b].y}
          style={{ animationDelay: `${index * 0.35}s` }}
        />
      ))}
      {nodes.map((node, index) =>
        node.kind === "router" ? (
          <g key={index} className="topo-router">
            <circle cx={node.x} cy={node.y} r={11} />
            <circle cx={node.x} cy={node.y} r={4} />
          </g>
        ) : node.kind === "switch" ? (
          <rect key={index} className="topo-switch" x={node.x - 9} y={node.y - 5} width={18} height={10} rx={2} />
        ) : (
          <circle key={index} className="topo-host" cx={node.x} cy={node.y} r={4.5} />
        ),
      )}
    </svg>
  );
}
