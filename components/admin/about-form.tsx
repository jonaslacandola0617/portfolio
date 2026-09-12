"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { upload } from "@vercel/blob/client";
import { Camera, Loader2, Save, Trash2 } from "lucide-react";
import { updateAboutAction, updateAboutProfileImageAction } from "@/app/admin/(dashboard)/about/actions";
import { FormMessage } from "@/components/admin/form-message";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { AboutPageValues } from "@/lib/validations/about";
import type { ActionResult } from "@/types/admin";

const initialState: ActionResult = { success: false };
const allowedProfileTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxProfileBytes = 5 * 1024 * 1024;

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="admin-field-error">{errors[0]}</p> : null;
}

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
    <form action={action} className="admin-control-about-form">
      <input type="hidden" name="profileImageUrl" value={profileImageUrl ?? ""} />

      <section className="admin-form-section">
        <header><span>01</span><div><h2>Profile image</h2><p>The portrait used in the public About composition.</p></div></header>
        <div className="admin-form-section-body">
          <div className="admin-profile-field">
            <div className="admin-profile-preview">
              {profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImageUrl} alt="Current profile" />
              ) : (
                <Camera aria-hidden="true" />
              )}
              <i aria-hidden="true" /><b aria-hidden="true" />
            </div>
            <div className="admin-profile-controls">
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(event) => event.target.files?.[0] && void uploadProfile(event.target.files[0])} />
              <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()} className="admin-primary-button">
                {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Camera aria-hidden="true" />}
                {profileImageUrl ? "Replace photo" : "Upload photo"}
              </button>
              {profileImageUrl && <button type="button" disabled={uploading} onClick={() => void removeProfile()} className="admin-text-danger"><Trash2 aria-hidden="true" /> Remove photo</button>}
              <p>JPEG, PNG, or WebP · Maximum 5 MB</p>
            </div>
          </div>
          {profileError && <FormMessage variant="error" className="mt-4">{profileError}</FormMessage>}
        </div>
      </section>

      <section className="admin-form-section">
        <header><span>02</span><div><h2>Opening statement</h2><p>The lead idea displayed beside your profile image.</p></div></header>
        <div className="admin-form-section-body">
          <div className="admin-field"><label htmlFor="quote">Opening Quote</label><Textarea id="quote" name="quote" rows={3} defaultValue={about.quote} required /><FieldError errors={state.errors?.quote} /></div>
        </div>
      </section>

      <section className="admin-form-section">
        <header><span>03</span><div><h2>Story</h2><p>Background, current direction, and the way you learn.</p></div></header>
        <div className="admin-form-section-body admin-form-grid">
          <div className="admin-field is-full"><label htmlFor="background">Background</label><Textarea id="background" name="background" rows={6} defaultValue={about.background} required /><FieldError errors={state.errors?.background} /></div>
          <div className="admin-field"><label htmlFor="currentFocus">Current Focus</label><Textarea id="currentFocus" name="currentFocus" rows={5} defaultValue={about.currentFocus} required /><FieldError errors={state.errors?.currentFocus} /></div>
          <div className="admin-field"><label htmlFor="learningPhilosophy">Learning Philosophy</label><Textarea id="learningPhilosophy" name="learningPhilosophy" rows={5} defaultValue={about.learningPhilosophy} required /><FieldError errors={state.errors?.learningPhilosophy} /></div>
        </div>
      </section>

      <section className="admin-form-section">
        <header><span>04</span><div><h2>Focus and next step</h2><p>Short labels and the direction you are moving toward.</p></div></header>
        <div className="admin-form-section-body admin-form-grid">
          <div className="admin-field"><label htmlFor="focusTags">Current Focus Tags</label><Textarea id="focusTags" name="focusTags" rows={6} defaultValue={about.focusTags.join("\n")} required /><p className="admin-field-note">One focused tag per line.</p><FieldError errors={state.errors?.focusTags} /></div>
          <div className="admin-field"><label htmlFor="whatsNext">What&apos;s Next</label><Textarea id="whatsNext" name="whatsNext" rows={6} defaultValue={about.whatsNext} required /><FieldError errors={state.errors?.whatsNext} /></div>
        </div>
      </section>

      {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}

      <div className="admin-form-actions">
        <span>Saving publishes these About details immediately.</span>
        <button type="submit" className="admin-control-settings-save"><Save aria-hidden="true" /> Save About page</button>
      </div>
    </form>
  );
}
