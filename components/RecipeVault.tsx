"use client";

import { useCallback, useEffect, useState } from "react";
import AuthActions from "@/components/AuthActions";
import RecipeForm from "@/components/RecipeForm";
import RecipeGrid from "@/components/RecipeGrid";
import RecipeOverlay from "@/components/RecipeOverlay";
import UpdateToast from "@/components/UpdateToast";
import {
  createRecipe,
  getRecipes,
  removeRecipe,
  setFavorite,
  updateRecipe,
} from "@/lib/api";
import type { Recipe, RecipeInput } from "@/lib/types";

export default function RecipeVault() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [overlay, setOverlay] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await getRecipes();
      setRecipes(result.recipes);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load recipes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(input: RecipeInput) {
    if (editing) {
      const { recipe } = await updateRecipe(editing.id, input);
      setRecipes((current) =>
        current.map((item) => (item.id === recipe.id ? recipe : item)),
      );
      setEditing(null);
    } else {
      const { recipe } = await createRecipe(input);
      setRecipes((current) => [recipe, ...current]);
    }
  }

  async function deleteRecipe(recipe: Recipe) {
    if (!window.confirm(`Delete "${recipe.name}"?`)) return;
    try {
      await removeRecipe(recipe.id);
      setRecipes((current) =>
        current.filter((item) => item.id !== recipe.id),
      );
      if (editing?.id === recipe.id) setEditing(null);
      if (overlay?.id === recipe.id) setOverlay(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete recipe.",
      );
    }
  }

  async function toggleFavorite(recipe: Recipe) {
    const favorite = !recipe.favorite;
    setRecipes((current) =>
      current.map((item) =>
        item.id === recipe.id ? { ...item, favorite } : item,
      ),
    );
    try {
      await setFavorite(recipe.id, favorite);
    } catch (favoriteError) {
      setRecipes((current) =>
        current.map((item) =>
          item.id === recipe.id ? { ...item, favorite: recipe.favorite } : item,
        ),
      );
      setError(
        favoriteError instanceof Error
          ? favoriteError.message
          : "Could not update favorite.",
      );
    }
  }

  return (
    <>
      <main className="app">
        <AuthActions />
        <header className="hero">
          <p className="eyebrow">Jin + Shein</p>
          <h1>Personal Recipe Vault</h1>
          <p className="subtitle">
            One home for everyday staples and special dinners, organized your
            way.
          </p>
        </header>
        {error && (
          <div className="page-error" role="alert">
            {error}
            <button className="muted" onClick={() => void load()}>
              Try again
            </button>
          </div>
        )}
        <section className="layout">
          <RecipeForm
            key={editing?.id || "new"}
            recipe={editing}
            onSave={save}
            onCancel={() => setEditing(null)}
          />
          {loading ? (
            <section className="card list-card">
              <p className="stats">Loading recipes…</p>
            </section>
          ) : (
            <RecipeGrid
              recipes={recipes}
              onOpen={setOverlay}
              onEdit={(recipe) => {
                setEditing(recipe);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onDelete={(recipe) => void deleteRecipe(recipe)}
              onToggleFavorite={(recipe) => void toggleFavorite(recipe)}
            />
          )}
        </section>
      </main>
      <RecipeOverlay recipe={overlay} onClose={() => setOverlay(null)} />
      <UpdateToast />
    </>
  );
}
