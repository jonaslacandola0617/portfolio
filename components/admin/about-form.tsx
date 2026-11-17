"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
  const [state, action] = useActionState(updateAboutAction, initialState);
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
        <header><span>01</span><div><h2>Profile photo</h2><p>Shown on About and as a small round photo in the homepage hero. A clear, friendly headshot works best.</p></div></header>
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
        <header><span>02</span><div><h2>Big quote</h2><p>The large line between the About header and the four cards. One or two sentences in your own voice.</p></div></header>
        <div className="admin-form-section-body">
          <div className="admin-field"><label htmlFor="quote">Quote</label><Textarea id="quote" name="quote" rows={3} defaultValue={about.quote} required /><FieldError errors={state.errors?.quote} /></div>
        </div>
      </section>

      <section className="admin-form-section">
        <header><span>03</span><div><h2>The four cards</h2><p>Each box below is one card on the About page, in the same order.</p></div></header>
        <div className="admin-form-section-body admin-form-grid">
          <div className="admin-field"><label htmlFor="background">01 · Where I&apos;m coming from</label><Textarea id="background" name="background" rows={7} defaultValue={about.background} required /><p className="admin-field-note">Your background: work so far and how you got into IT.</p><FieldError errors={state.errors?.background} /></div>
          <div className="admin-field"><label htmlFor="currentFocus">02 · What I work with</label><Textarea id="currentFocus" name="currentFocus" rows={7} defaultValue={about.currentFocus} required /><p className="admin-field-note">What you&apos;re focused on now: training, tools, labs.</p><FieldError errors={state.errors?.currentFocus} /></div>
          <div className="admin-field is-full"><label htmlFor="focusTags">Tags under card 02</label><Textarea id="focusTags" name="focusTags" rows={4} defaultValue={about.focusTags.join("\n")} required /><p className="admin-field-note">One per line, up to 20. Shown as small chips.</p><FieldError errors={state.errors?.focusTags} /></div>
          <div className="admin-field"><label htmlFor="learningPhilosophy">03 · How I work</label><Textarea id="learningPhilosophy" name="learningPhilosophy" rows={6} defaultValue={about.learningPhilosophy} required /><p className="admin-field-note">How you learn and solve problems.</p><FieldError errors={state.errors?.learningPhilosophy} /></div>
          <div className="admin-field"><label htmlFor="whatsNext">04 · What I&apos;m looking for</label><Textarea id="whatsNext" name="whatsNext" rows={6} defaultValue={about.whatsNext} required /><p className="admin-field-note">The roles you want, where, and shifts. Be specific.</p><FieldError errors={state.errors?.whatsNext} /></div>
        </div>
      </section>

      {!state.success && state.message && <FormMessage variant="error">{state.message}</FormMessage>}

      <div className="admin-form-actions">
        <span>Saving updates the live About page right away.</span>
        <button type="submit" className="admin-control-settings-save"><Save aria-hidden="true" /> Save About page</button>
      </div>
    </form>
  );
}
