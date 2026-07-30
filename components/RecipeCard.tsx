"use client";

import type { KeyboardEvent, MouseEvent } from "react";
import type { Recipe } from "@/lib/types";

interface RecipeCardProps {
  recipe: Recipe;
  onOpen: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
}

export default function RecipeCard({
  recipe,
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}: RecipeCardProps) {
  function stop(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(recipe);
    }
  }

  return (
    <article
      className="recipe-card"
      role="button"
      tabIndex={0}
      aria-label={`Open ${recipe.name}`}
      onClick={() => onOpen(recipe)}
      onKeyDown={onKeyDown}
    >
      {recipe.photo_url && (
        <img
          className="recipe-photo"
          src={recipe.photo_url}
          alt={`${recipe.name}`}
        />
      )}
      <div className="recipe-head">
        <h3 className="recipe-name">{recipe.name}</h3>
        <button
          className={`favorite-btn${recipe.favorite ? " active" : ""}`}
          title="Toggle favorite"
          aria-label={`${recipe.favorite ? "Remove" : "Add"} ${recipe.name} ${
            recipe.favorite ? "from" : "to"
          } favorites`}
          onClick={(event) => {
            stop(event);
            onToggleFavorite(recipe);
          }}
        >
          {recipe.favorite ? "★" : "☆"}
        </button>
      </div>
      <p className="recipe-meta">{recipe.category || "Uncategorized"}</p>
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
      <div className="card-actions">
        <button
          className="edit-btn muted"
          onClick={(event) => {
            stop(event);
            onEdit(recipe);
          }}
        >
          Edit
        </button>
        <button
          className="delete-btn danger"
          onClick={(event) => {
            stop(event);
            onDelete(recipe);
          }}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
