"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { VibeTag, SocialPlatform } from "@/lib/types";

const VIBE_TAGS: { id: VibeTag; label: string }[] = [
  { id: "here-for-headliners", label: "Here for the headliners" },
  { id: "discover-new-artists", label: "Discover new artists" },
  { id: "dance-all-night", label: "Dance all night" },
  { id: "chill-vibes", label: "Chill vibes" },
  { id: "front-row-energy", label: "Front row energy" },
  { id: "festival-foodie", label: "Festival foodie" },
  { id: "photographer", label: "Photographer" },
  { id: "first-timer", label: "First timer" },
];

const GROUP_SIZES = [2, 3, 4, 5, 6];
const PLATFORMS: SocialPlatform[] = ["instagram", "tiktok", "snapchat"];

type HandleStatus = "idle" | "checking" | "valid" | "invalid";

export default function CreateProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<VibeTag[]>([]);
  const [groupSize, setGroupSize] = useState<number>(3);
  const [handles, setHandles] = useState<Record<SocialPlatform, string>>({
    instagram: "",
    tiktok: "",
    snapchat: "",
  });
  const [handleStatuses, setHandleStatuses] = useState<Record<SocialPlatform, HandleStatus>>({
    instagram: "idle",
    tiktok: "idle",
    snapchat: "idle",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filledPlatforms = PLATFORMS.filter((p) => handles[p].trim());
  const allFilledAreValid = filledPlatforms.every((p) => handleStatuses[p] === "valid");
  const canSubmit =
    name.trim() &&
    selectedTags.length > 0 &&
    filledPlatforms.length > 0 &&
    allFilledAreValid &&
    !submitting;

  function toggleTag(tag: VibeTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function checkHandle(p: SocialPlatform) {
    const clean = handles[p].replace(/^@/, "").trim();
    if (!clean) return;
    setHandleStatuses((prev) => ({ ...prev, [p]: "checking" }));
    try {
      const res = await fetch("/api/check-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: p, handle: clean }),
      });
      const data = await res.json();
      setHandleStatuses((prev) => ({ ...prev, [p]: data.exists ? "valid" : "invalid" }));
    } catch {
      setHandleStatuses((prev) => ({ ...prev, [p]: "idle" }));
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError("Name is required."); return; }
    if (selectedTags.length === 0) { setError("Pick at least one vibe tag."); return; }
    if (filledPlatforms.length === 0) { setError("Add at least one social handle."); return; }
    if (!allFilledAreValid) { setError("Please verify all your social handles before continuing."); return; }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }

      let photoUrl: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        const path = `${user.id}/profile.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(path, photoFile, { upsert: true });
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("profile-photos")
            .getPublicUrl(path);
          photoUrl = publicUrl;
        }
      }

      const clean = (p: SocialPlatform) => handles[p].replace(/^@/, "").trim() || null;

      const { error: upsertError } = await supabase.from("users").upsert({
        id: user.id,
        email: user.email!,
        name: name.trim(),
        photo_url: photoUrl,
        vibe_tags: selectedTags,
        group_size_preference: groupSize,
        instagram_handle: clean("instagram"),
        tiktok_handle: clean("tiktok"),
        snapchat_handle: clean("snapchat"),
        profile_complete: true,
      });

      if (upsertError) { setError("Failed to save profile. Please try again."); return; }

      router.push("/feed");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col flex-1 px-5 pb-8 pt-10">
      <h1 className="text-2xl font-bold text-white mb-1">Create your profile</h1>
      <p className="text-sm text-neutral-400 mb-8">Takes about 45 seconds. You only do this once.</p>

      {/* Photo */}
      <div className="flex flex-col items-center mb-8">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 flex items-center justify-center overflow-hidden hover:border-brand-500 transition-colors"
        >
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Your photo" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        <p className="mt-2 text-xs text-neutral-500">Add a photo</p>
      </div>

      {/* Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-300 mb-2">Your name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="First name or nickname"
          className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-brand-500 transition-colors"
          maxLength={40}
          required
        />
      </div>

      {/* Vibe tags */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-300 mb-3">
          Your vibe <span className="text-neutral-500">(pick up to 3)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {VIBE_TAGS.map((tag) => {
            const selected = selectedTags.includes(tag.id);
            const disabled = !selected && selectedTags.length >= 3;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => !disabled && toggleTag(tag.id)}
                disabled={disabled}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  selected
                    ? "bg-brand-500 border-brand-500 text-white"
                    : disabled
                    ? "border-neutral-800 text-neutral-600 cursor-not-allowed"
                    : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
                }`}
              >
                {tag.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group size */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-neutral-300 mb-3">Ideal group size</label>
        <div className="flex gap-2">
          {GROUP_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setGroupSize(size)}
              className={`w-12 h-12 rounded-xl text-sm font-medium border transition-colors ${
                groupSize === size
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
              }`}
            >
              {size}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setGroupSize(10)}
            className={`px-3 h-12 rounded-xl text-sm font-medium border transition-colors ${
              groupSize === 10
                ? "bg-brand-500 border-brand-500 text-white"
                : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            7+
          </button>
        </div>
      </div>

      {/* Social handles */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-neutral-300 mb-1">
          Social handles <span className="text-red-400">*</span>
        </label>
        <p className="text-xs text-neutral-500 mb-4">
          At least one required — lets your group look you up before you meet.
        </p>
        <div className="space-y-3">
          {PLATFORMS.map((p) => (
            <HandleRow
              key={p}
              platform={p}
              value={handles[p]}
              status={handleStatuses[p]}
              onChange={(val) => {
                setHandles((prev) => ({ ...prev, [p]: val }));
                setHandleStatuses((prev) => ({ ...prev, [p]: "idle" }));
              }}
              onBlur={() => { if (handles[p].trim()) void checkHandle(p); }}
              onCheck={() => void checkHandle(p)}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl bg-brand-500 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-600 active:scale-95 transition-all mt-auto"
      >
        {submitting ? "Saving…" : "Take me to the feed"}
      </button>
    </form>
  );
}

function HandleRow({
  platform,
  value,
  status,
  onChange,
  onBlur,
  onCheck,
}: {
  platform: SocialPlatform;
  value: string;
  status: HandleStatus;
  onChange: (val: string) => void;
  onBlur: () => void;
  onCheck: () => void;
}) {
  const label = platform.charAt(0).toUpperCase() + platform.slice(1);
  return (
    <div className="flex items-center gap-2">
      <span className="w-[74px] text-xs text-neutral-500 shrink-0">{label}</span>
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">@</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="yourhandle"
          className={`w-full bg-neutral-900 border rounded-xl pl-7 pr-9 py-3 text-white text-sm placeholder-neutral-500 focus:outline-none transition-colors ${
            status === "valid"
              ? "border-green-500"
              : status === "invalid"
              ? "border-red-500"
              : "border-neutral-700 focus:border-brand-500"
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {status === "checking" && (
            <svg className="w-4 h-4 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {status === "valid" && (
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === "invalid" && (
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onCheck}
        disabled={!value.trim() || status === "checking"}
        className="px-3 py-3 rounded-xl bg-neutral-800 text-neutral-300 text-sm font-medium hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
      >
        Check
      </button>
    </div>
  );
}
