"use client";

import { useEffect, useState, type FormEvent } from "react";
import PhotoUpload from "@/components/PhotoUpload";
import { CATEGORY_OPTIONS, type Recipe, type RecipeInput } from "@/lib/types";

interface RecipeFormProps {
  recipe: Recipe | null;
  onSave: (input: RecipeInput) => Promise<void>;
  onCancel: () => void;
}

export default function RecipeForm({
  recipe,
  onSave,
  onCancel,
}: RecipeFormProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(
    recipe?.photo_url || null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPhotoUrl(recipe?.photo_url || null);
    setError("");
  }, [recipe]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await onSave({
        name: String(data.get("name") || "").trim(),
        category: (String(data.get("category") || "") ||
          null) as RecipeInput["category"],
        tags: String(data.get("tags") || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        ingredients: String(data.get("ingredients") || "")
          .split("\n")
          .map((ingredient) => ingredient.trim())
          .filter(Boolean),
        instructions: String(data.get("instructions") || "").trim(),
        notes: String(data.get("notes") || "").trim(),
        photo_url: photoUrl,
        favorite: recipe?.favorite || false,
      });
      if (!recipe) {
        form.reset();
        setPhotoUrl(null);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save recipe.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card form-card">
      <h2>{recipe ? "Edit Recipe" : "Add Recipe"}</h2>
      <form onSubmit={submit}>
        <label>
          Recipe Name
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={recipe?.name || ""}
          />
        </label>
        <label>
          Category
          <select name="category" defaultValue={recipe?.category || ""}>
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tags (comma-separated)
          <input
            name="tags"
            placeholder="quick, vegetarian, meal prep"
            maxLength={120}
            defaultValue={recipe?.tags.join(", ") || ""}
          />
        </label>
        <label>
          Ingredients (one per line)
          <textarea
            name="ingredients"
            rows={6}
            required
            defaultValue={recipe?.ingredients.join("\n") || ""}
          />
        </label>
        <label>
          Instructions
          <textarea
            name="instructions"
            rows={6}
            required
            defaultValue={recipe?.instructions || ""}
          />
        </label>
        <label>
          Notes
          <textarea
            name="notes"
            rows={3}
            defaultValue={recipe?.notes || ""}
          />
        </label>

        <PhotoUpload
          value={photoUrl}
          onChange={setPhotoUrl}
          disabled={saving}
        />

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button id="submitBtn" type="submit" disabled={saving}>
            {saving
              ? "Saving…"
              : recipe
                ? "Update Recipe"
                : "Save Recipe"}
          </button>
          {recipe && (
            <button
              type="button"
              className="muted"
              disabled={saving}
              onClick={onCancel}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
