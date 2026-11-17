"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number; hub: boolean };
type Packet = { from: number; to: number; t: number; speed: number };

/**
 * A quiet network topology that drifts behind the hero. The pointer acts as a
 * router: nearby nodes link to it and packets travel along the live edges.
 * Static (single frame) when the visitor prefers reduced motion.
 */
export function NetworkField({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    const packets: Packet[] = [];
    const pointer = { x: -9999, y: -9999, active: false };
    let frame = 0;
    let raf = 0;
    let visible = true;

    const readColors = () => {
      const styles = getComputedStyle(canvas);
      return {
        line: styles.getPropertyValue("--field-line").trim() || "rgba(240,236,228,.12)",
        node: styles.getPropertyValue("--field-node").trim() || "rgba(240,236,228,.55)",
        accent: styles.getPropertyValue("--field-accent").trim() || "#ff6a3d",
      };
    };
    let colors = readColors();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, Math.max(26, (width * height) / 16000)));
      nodes = Array.from({ length: count }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: i % 9 === 0 ? 2.6 : 1.4,
        hub: i % 9 === 0,
      }));
      packets.length = 0;
      colors = readColors();
    };

    const linkDistance = () => Math.min(170, Math.max(110, width / 9));

    const draw = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);
      const maxDist = linkDistance();

      for (const node of nodes) {
        if (!reduced) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < -20) node.x = width + 20;
          if (node.x > width + 20) node.x = -20;
          if (node.y < -20) node.y = height + 20;
          if (node.y > height + 20) node.y = -20;
        }
      }

      // Edges between nearby nodes.
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i];
          const b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d > maxDist) continue;
          ctx.globalAlpha = 1 - d / maxDist;
          ctx.strokeStyle = colors.line;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          if (!reduced && (a.hub || b.hub) && packets.length < 10 && Math.random() < 0.0009) {
            packets.push({ from: i, to: j, t: 0, speed: 0.008 + Math.random() * 0.01 });
          }
        }
      }

      // Pointer acts as a router node.
      if (pointer.active) {
        const reach = maxDist * 1.35;
        for (const node of nodes) {
          const d = Math.hypot(node.x - pointer.x, node.y - pointer.y);
          if (d > reach) continue;
          ctx.globalAlpha = (1 - d / reach) * 0.9;
          ctx.strokeStyle = colors.accent;
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(node.x, node.y);
          ctx.stroke();
          if (!reduced) {
            node.x += (pointer.x - node.x) * 0.0018;
            node.y += (pointer.y - node.y) * 0.0018;
          }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.25 + 0.15 * Math.sin(frame / 14);
        ctx.strokeStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 11, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Nodes.
      for (const node of nodes) {
        ctx.globalAlpha = node.hub ? 0.95 : 0.6;
        ctx.fillStyle = node.hub ? colors.accent : colors.node;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Packets travelling along edges.
      for (let k = packets.length - 1; k >= 0; k -= 1) {
        const packet = packets[k];
        packet.t += packet.speed;
        const a = nodes[packet.from];
        const b = nodes[packet.to];
        if (!a || !b || packet.t >= 1 || Math.hypot(a.x - b.x, a.y - b.y) > maxDist) {
          packets.splice(k, 1);
          continue;
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors.accent;
        ctx.fillRect(a.x + (b.x - a.x) * packet.t - 1.5, a.y + (b.y - a.y) * packet.t - 1.5, 3, 3);
      }
      ctx.globalAlpha = 1;
    };

    const loop = () => {
      if (visible) draw();
      raf = requestAnimationFrame(loop);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
      if (reduced) draw();
    };
    const onLeave = () => {
      pointer.active = false;
      if (reduced) draw();
    };

    resize();
    draw();
    if (!reduced) raf = requestAnimationFrame(loop);

    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    observer.observe(canvas);
    const themeObserver = new MutationObserver(() => { colors = readColors(); if (reduced) draw(); });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const resizeObserver = new ResizeObserver(() => { resize(); draw(); });
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      themeObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
