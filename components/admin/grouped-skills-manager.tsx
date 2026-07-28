"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GripVertical, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/admin/delete-button";
import { DeleteConfirmationDialog } from "@/components/admin/delete-confirmation-dialog";
import {
  bulkDeleteSkillsAction,
  deleteSkillAction,
  updateSkillGroupAction,
} from "@/app/admin/(dashboard)/skills/actions";
import { UNGROUPED_SKILL_GROUP, cleanSkillGroup, skillGroupKey } from "@/lib/skill-groups";

export interface GroupedSkillRow {
  id: string;
  name: string;
  group: string;
  level: string;
  projectCount: number;
}

interface Feedback {
  skillId: string;
  success: boolean;
  message: string;
}

export function GroupedSkillsManager({
  initialSkills,
  groups,
}: {
  initialSkills: GroupedSkillRow[];
  groups: string[];
}) {
  const router = useRouter();
  const [skills, setSkills] = useState(initialSkills);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const orderedGroups = useMemo(() => {
    const values = new Map<string, string>();
    for (const group of [...groups, ...skills.map((skill) => skill.group), UNGROUPED_SKILL_GROUP]) {
      const clean = cleanSkillGroup(group);
      values.set(skillGroupKey(clean), clean);
    }
    return [...values.values()].sort((left, right) => {
      if (left === UNGROUPED_SKILL_GROUP) return 1;
      if (right === UNGROUPED_SKILL_GROUP) return -1;
      return left.localeCompare(right);
    });
  }, [groups, skills]);

  const move = async (skillId: string, destination: string) => {
    if (pendingIds.has(skillId)) return;
    const canonical = orderedGroups.find((group) => skillGroupKey(group) === skillGroupKey(destination));
    if (!canonical) return;
    const current = skills.find((skill) => skill.id === skillId);
    if (!current || skillGroupKey(current.group) === skillGroupKey(canonical)) return;

    const originalGroup = current.group;
    setSkills((items) => items.map((skill) => skill.id === skillId ? { ...skill, group: canonical } : skill));
    setPendingIds((ids) => new Set(ids).add(skillId));
    setFeedback(null);
    try {
      const result = await updateSkillGroupAction({ id: skillId, group: canonical });
      if (!result.success) {
        setSkills((items) => items.map((skill) => skill.id === skillId ? { ...skill, group: originalGroup } : skill));
        setFeedback({ skillId, success: false, message: result.message ?? "The Skill group could not be changed." });
        return;
      }
      const savedGroup = result.group ?? canonical;
      setSkills((items) => items.map((skill) => skill.id === skillId ? { ...skill, group: savedGroup } : skill));
      setFeedback({ skillId, success: true, message: result.message ?? `Moved to ${savedGroup}.` });
      router.refresh();
    } catch {
      setSkills((items) => items.map((skill) => skill.id === skillId ? { ...skill, group: originalGroup } : skill));
      setFeedback({ skillId, success: false, message: "The Skill group could not be changed." });
    } finally {
      setPendingIds((ids) => {
        const next = new Set(ids);
        next.delete(skillId);
        return next;
      });
      setDraggingId(null);
    }
  };

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2">
          <span className="text-sm text-foreground">{selected.size} selected</span>
          <DeleteConfirmationDialog
            contentType="skill"
            count={selected.size}
            description={`Permanently delete ${selected.size} selected Skill${selected.size === 1 ? "" : "s"}. Existing content relationships will be detached.`}
            confirmLabel={`Delete ${selected.size} Skill${selected.size === 1 ? "" : "s"}`}
            onConfirm={() => bulkDeleteSkillsAction([...selected])}
            onSuccess={() => {
              setSkills((items) => items.filter((skill) => !selected.has(skill.id)));
              setSelected(new Set());
              router.refresh();
            }}
            trigger={<button type="button" className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10">Delete selected</button>}
          />
        </div>
      )}

      <div className="space-y-7">
        {orderedGroups.map((group) => {
          const rows = skills.filter((skill) => skillGroupKey(skill.group) === skillGroupKey(group));
          return (
            <section
              key={skillGroupKey(group)}
              onDragOver={(event) => {
                if (draggingId) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/skill-id") || draggingId;
                if (id) void move(id, group);
              }}
              className={`rounded-lg border transition-colors ${draggingId ? "border-primary/35 bg-primary/[0.025]" : "border-border"}`}
            >
              <div className="flex items-center justify-between border-b border-border bg-muted/20 px-4 py-3">
                <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group}</h2>
                <span className="text-xs text-muted-foreground">{rows.length}</span>
              </div>
              {rows.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">Drop a Skill here or use its group selector.</p>
              ) : (
                <div className="divide-y divide-border">
                  {rows.map((skill) => {
                    const pending = pendingIds.has(skill.id);
                    const message = feedback?.skillId === skill.id ? feedback : null;
                    return (
                      <div
                        key={skill.id}
                        draggable={!pending}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/skill-id", skill.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggingId(skill.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        className={`px-4 py-3 transition-opacity ${pending ? "opacity-65" : ""}`}
                      >
                        <div className="flex flex-wrap items-center gap-3">
                          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" aria-hidden="true" />
                          <input type="checkbox" checked={selected.has(skill.id)} onChange={() => toggleSelected(skill.id)} aria-label={`Select ${skill.name}`} className="h-4 w-4 rounded border-border" />
                          <Link href={`/admin/skills/${skill.id}`} className="min-w-40 flex-1">
                            <span className="block text-sm font-medium text-foreground">{skill.name}</span>
                            <span className="font-mono text-[0.68rem] text-muted-foreground">Used by {skill.projectCount} project{skill.projectCount === 1 ? "" : "s"}</span>
                          </Link>
                          <Badge variant="default">{skill.level}</Badge>
                          <label className="sr-only" htmlFor={`skill-group-${skill.id}`}>Group for {skill.name}</label>
                          <div className="relative">
                            <select
                              id={`skill-group-${skill.id}`}
                              value={group}
                              disabled={pending}
                              onChange={(event) => void move(skill.id, event.target.value)}
                              className="h-9 rounded-md border border-border bg-background pl-3 pr-8 text-xs text-foreground disabled:opacity-60"
                            >
                              {orderedGroups.map((option) => <option key={skillGroupKey(option)} value={option}>{option}</option>)}
                            </select>
                            {pending && <Loader2 className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 animate-spin text-primary" />}
                          </div>
                          <DeleteButton
                            variant="icon"
                            label={`Delete ${skill.name}`}
                            contentType="skill"
                            recordTitle={skill.name}
                            onDelete={() => deleteSkillAction(skill.id)}
                            onSuccess={() => {
                              setSkills((items) => items.filter((item) => item.id !== skill.id));
                              router.refresh();
                            }}
                          />
                        </div>
                        {message && (
                          <p role={message.success ? "status" : "alert"} className={`mt-2 pl-7 text-xs ${message.success ? "text-success" : "text-destructive"}`}>
                            {message.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
