"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { upload } from "@vercel/blob/client";
import { Camera, Loader2, Save, Trash2 } from "lucide-react";
import { updateAboutAction, updateAboutProfileImageAction } from "@/app/admin/(dashboard)/about/actions";
import { FormMessage } from "@/components/admin/form-message";
import { useToast } from "@/components/ui/toast";
import type { AboutPageValues } from "@/lib/validations/about";
import type { ActionResult } from "@/types/admin";

const initialState: ActionResult = { success: false };
const textareaClassName =
  "w-full border border-border bg-surface-2 px-3 py-2.5 text-sm text-text outline-none focus:border-cobalt";
const allowedProfileTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxProfileBytes = 5 * 1024 * 1024;

export function AboutForm({ about }: { about: AboutPageValues }) {
  const [state, action] = useFormState(updateAboutAction, initialState);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(about.profileImageUrl);
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { success } = useToast();

  useEffect(() => {
    if (state.success && state.message) success(state.message, { id: "about-page-save" });
  }, [state.message, state.success, success]);

  async function uploadProfile(file: File) {
    setProfileError(null);
    if (!allowedProfileTypes.has(file.type)) {
      setProfileError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxProfileBytes) {
      setProfileError("Profile photos must be 5 MB or smaller.");
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(`profile/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/about/profile-image/upload",
      });
      const result = await updateAboutProfileImageAction(blob.url);
      if (!result.success) throw new Error(result.message ?? "Profile photo could not be saved.");
      setProfileImageUrl(blob.url);
      success("Profile photo updated.", { id: "about-profile-save" });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Profile photo upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeProfile() {
    setUploading(true);
    setProfileError(null);
    try {
      const result = await updateAboutProfileImageAction(null);
      if (!result.success) throw new Error(result.message ?? "Profile photo could not be removed.");
      setProfileImageUrl(null);
      success("Profile photo removed.", { id: "about-profile-remove" });
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Profile photo could not be removed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="px-6 py-8 sm:px-10">
      <input type="hidden" name="profileImageUrl" value={profileImageUrl ?? ""} />
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-text">About</h1>
        <button type="submit" className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2 text-sm font-medium text-surface">
          <Save size={13} /> Save
        </button>
      </div>

      <div className="max-w-2xl space-y-6">
        <div>
          <span className="label mb-2 block">Profile Photo</span>
          <div className="flex items-start gap-4">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden border border-border-strong bg-surface-2">
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImageUrl} alt="Current profile" className="h-full w-full object-cover grayscale" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted"><Camera size={22} /></div>
              )}
              <div className="pointer-events-none absolute left-2 top-2 h-5 w-5 border border-border" />
              <div className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 bg-vermilion" />
            </div>
            <div className="space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => event.target.files?.[0] && void uploadProfile(event.target.files[0])}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 border border-border-strong bg-text px-3 py-2 text-xs font-medium text-surface disabled:opacity-50"
              >
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                {profileImageUrl ? "Replace photo" : "Upload photo"}
              </button>
              {profileImageUrl && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void removeProfile()}
                  className="flex items-center gap-2 px-1 py-1 text-xs text-vermilion disabled:opacity-50"
                >
                  <Trash2 size={12} /> Remove photo
                </button>
              )}
              <p className="max-w-xs text-[11px] leading-5 text-muted">JPEG, PNG, or WebP. Up to 5 MB. Stored separately from the Media Library.</p>
            </div>
          </div>
          {profileError && <p className="mt-2 text-xs text-vermilion">{profileError}</p>}
        </div>

        <div><label htmlFor="quote" className="label mb-2 block">Opening Quote</label><textarea id="quote" name="quote" rows={3} defaultValue={about.quote} required className={textareaClassName} /></div>
        <div><label htmlFor="background" className="label mb-2 block">Background</label><textarea id="background" name="background" rows={5} defaultValue={about.background} required className={textareaClassName} /></div>
        <div><label htmlFor="currentFocus" className="label mb-2 block">Current Focus</label><textarea id="currentFocus" name="currentFocus" rows={3} defaultValue={about.currentFocus} required className={textareaClassName} /></div>
        <div>
          <label htmlFor="focusTags" className="label mb-2 block">Current Focus Tags</label>
          <textarea id="focusTags" name="focusTags" rows={4} defaultValue={about.focusTags.join("\n")} required className={textareaClassName} />
          <p className="mt-1 text-[11px] text-muted">One tag per line.</p>
        </div>
        <div><label htmlFor="learningPhilosophy" className="label mb-2 block">Learning Philosophy</label><textarea id="learningPhilosophy" name="learningPhilosophy" rows={3} defaultValue={about.learningPhilosophy} required className={textareaClassName} /></div>
        <div><label htmlFor="whatsNext" className="label mb-2 block">What&apos;s Next</label><textarea id="whatsNext" name="whatsNext" rows={3} defaultValue={about.whatsNext} required className={textareaClassName} /></div>

        {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}
      </div>
    </form>
  );
}
