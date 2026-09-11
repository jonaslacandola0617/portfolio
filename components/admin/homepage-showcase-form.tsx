"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { ArrowDown, Save, Sparkles } from "lucide-react";
import { updateHomepageShowcaseAction } from "@/app/admin/(dashboard)/showcase/actions";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/types/admin";

const initialState: ActionResult = { success: false };

type ProjectOption = {
  id: string;
  title: string;
  summary: string;
  liveSiteUrl: string | null;
  thumbnailUrl: string | null;
};

function Preview({ project, slot }: { project?: ProjectOption; slot: string }) {
  return (
    <div className="admin-showcase-preview">
      <div className="admin-showcase-preview-head">
        <span>{slot}</span>
        <span>{project ? "SELECTED" : "AUTOMATIC"}</span>
      </div>
      <div className="admin-showcase-preview-body">
        <div className="admin-showcase-preview-mark" aria-hidden="true" />
        <div>
          <h3>{project?.title ?? "Automatic selection"}</h3>
          <p>
            {project?.summary ?? "The homepage will choose the next suitable published project using the existing fallback order."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function HomepageShowcaseForm({
  projectOptions,
  selectedIds,
}: {
  projectOptions: ProjectOption[];
  selectedIds: string[];
}) {
  const [state, formAction] = useFormState(updateHomepageShowcaseAction, initialState);
  const { success } = useToast();
  const [primaryId, setPrimaryId] = useState(selectedIds[0] ?? "");
  const [secondaryId, setSecondaryId] = useState(selectedIds[1] ?? "");

  const byId = useMemo(() => new Map(projectOptions.map((project) => [project.id, project])), [projectOptions]);
  const primary = primaryId ? byId.get(primaryId) : undefined;
  const secondary = secondaryId ? byId.get(secondaryId) : undefined;

  useEffect(() => {
    if (state.success) success(state.message ?? "Homepage showcase updated.", { id: "homepage-showcase-save" });
  }, [state.message, state.success, success]);

  return (
    <form action={formAction} className="admin-showcase-form">
      <section className="admin-showcase-control-block">
        <div className="admin-showcase-control-copy">
          <span>01 / PRIMARY</span>
          <h2>Lead project</h2>
          <p>This occupies the first, largest project space on the public homepage.</p>
        </div>
        <label className="admin-showcase-select-wrap" htmlFor="primaryProjectId">
          <span>PROJECT</span>
          <select
            id="primaryProjectId"
            name="primaryProjectId"
            value={primaryId}
            onChange={(event) => {
              const next = event.target.value;
              setPrimaryId(next);
              if (next && next === secondaryId) setSecondaryId("");
            }}
          >
            <option value="">Automatic</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </select>
        </label>
        <Preview project={primary} slot="PRIMARY / 01" />
      </section>

      <div className="admin-showcase-flow" aria-hidden="true"><ArrowDown /></div>

      <section className="admin-showcase-control-block">
        <div className="admin-showcase-control-copy">
          <span>02 / SECONDARY</span>
          <h2>Second project</h2>
          <p>This follows the lead project and uses the alternate homepage composition.</p>
        </div>
        <label className="admin-showcase-select-wrap" htmlFor="secondaryProjectId">
          <span>PROJECT</span>
          <select
            id="secondaryProjectId"
            name="secondaryProjectId"
            value={secondaryId}
            onChange={(event) => {
              const next = event.target.value;
              setSecondaryId(next);
              if (next && next === primaryId) setPrimaryId("");
            }}
          >
            <option value="">Automatic</option>
            {projectOptions.map((project) => (
              <option key={project.id} value={project.id}>{project.title}</option>
            ))}
          </select>
        </label>
        <Preview project={secondary} slot="SECONDARY / 02" />
      </section>

      <div className="admin-showcase-foot">
        <div>
          <Sparkles className="h-4 w-4" />
          <p>Only published projects can be selected. If a chosen project becomes unavailable, the homepage automatically falls back instead of breaking.</p>
        </div>
        <button type="submit" className="admin-showcase-save"><Save className="h-3.5 w-3.5" /> Save homepage</button>
      </div>

      {!state.success && state.message && <p role="alert" className="admin-showcase-error">{state.message}</p>}
    </form>
  );
}
