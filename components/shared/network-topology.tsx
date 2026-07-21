export type NodeKind = "router" | "switch" | "pc" | "server" | "firewall" | "internet" | "ap";

export interface TopologyNode {
  id: string;
  kind: NodeKind;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
}

export interface TopologyEdge {
  from: string;
  to: string;
  label?: string;
}

const kindGlyph: Record<NodeKind, string> = {
  router: "◈",
  switch: "▤",
  pc: "▢",
  server: "▥",
  firewall: "◆",
  internet: "◯",
  ap: "▲",
};

export function NetworkTopology({
  nodes,
  edges,
  className,
  height = 320,
}: {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  className?: string;
  height?: number;
}) {
  const find = (id: string) => nodes.find((n) => n.id === id)!;

  return (
    <div className={className}>
      <svg viewBox="0 0 640 320" width="100%" height={height} className="overflow-visible">
        <g opacity="0.9">
          {edges.map((edge, i) => {
            const a = find(edge.from);
            const b = find(edge.to);
            if (!a || !b) return null;
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            return (
              <g key={i}>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="hsl(var(--border))"
                  strokeWidth={2}
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={midY - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground font-mono"
                    fontSize="10"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        {nodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle
              r="22"
              className="fill-card stroke-primary/40"
              strokeWidth="1.5"
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-primary"
              fontSize="16"
            >
              {kindGlyph[node.kind]}
            </text>
            <text
              y="38"
              textAnchor="middle"
              className="fill-foreground font-mono font-medium"
              fontSize="11"
            >
              {node.label}
            </text>
            {node.sublabel && (
              <text
                y="52"
                textAnchor="middle"
                className="fill-muted-foreground font-mono"
                fontSize="9.5"
              >
                {node.sublabel}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
