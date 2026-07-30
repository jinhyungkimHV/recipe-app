"use client";

import { useRef, useState } from "react";

interface PhotoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export default function PhotoUpload({
  value,
  onChange,
  disabled,
}: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function uploadPhoto(file: File) {
    setError("");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("photo", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Photo upload failed.");
      }
      onChange(payload.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Photo upload failed.",
      );
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <label>
        Recipe Photo
        <input
          ref={inputRef}
          id="photo"
          name="photo"
          type="file"
          accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
          disabled={disabled || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void uploadPhoto(file);
          }}
        />
      </label>
      {uploading && <p className="field-status">Uploading photo…</p>}
      {error && <p className="form-error">{error}</p>}
      {value && (
        <>
          <img
            src={value}
            className="photo-preview"
            alt="Recipe photo preview"
          />
          <button
            type="button"
            className="muted"
            disabled={disabled || uploading}
            onClick={() => {
              onChange(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
          >
            Remove Photo
          </button>
        </>
      )}
    </>
  );
}
