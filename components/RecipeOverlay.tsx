"use client";

import { useEffect, useRef } from "react";
import type { Recipe } from "@/lib/types";

interface RecipeOverlayProps {
  recipe: Recipe | null;
  onClose: () => void;
}

export default function RecipeOverlay({
  recipe,
  onClose,
}: RecipeOverlayProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!recipe) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [recipe, onClose]);

  if (!recipe) return null;

  return (
    <aside
      className="recipe-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="recipe-overlay-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="overlayTitle"
      >
        <button
          ref={closeRef}
          className="overlay-close-btn muted"
          type="button"
          onClick={onClose}
        >
          Close
        </button>
        {recipe.photo_url && (
          <img
            className="overlay-photo"
            src={recipe.photo_url}
            alt={recipe.name}
          />
        )}
        <h2 id="overlayTitle">{recipe.name}</h2>
        <p className="overlay-meta">
          {recipe.category || "Uncategorized"}
        </p>
        <div className="tag-list">
          {recipe.tags.map((tag) => (
            <span className="tag" key={tag}>
              #{tag}
            </span>
          ))}
        </div>
        <section>
          <h4>Ingredients</h4>
          <ul className="ingredients-list">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${ingredient}-${index}`}>{ingredient}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>Instructions</h4>
          <p className="instructions">{recipe.instructions}</p>
        </section>
        {recipe.notes && <p className="notes">Note: {recipe.notes}</p>}
      </section>
    </aside>
  );
}
