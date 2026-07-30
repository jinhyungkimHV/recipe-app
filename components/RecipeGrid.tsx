"use client";

import { useMemo, useState } from "react";
import RecipeCard from "@/components/RecipeCard";
import SearchControls from "@/components/SearchControls";
import type { Recipe, RecipeSort } from "@/lib/types";
import { filterAndSortRecipes } from "@/lib/utils";

interface RecipeGridProps {
  recipes: Recipe[];
  onOpen: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onToggleFavorite: (recipe: Recipe) => void;
}

export default function RecipeGrid(props: RecipeGridProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<RecipeSort>("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const visible = useMemo(
    () =>
      filterAndSortRecipes(props.recipes, {
        search,
        category,
        sort,
        favoritesOnly,
      }),
    [props.recipes, search, category, sort, favoritesOnly],
  );
  const favorites = props.recipes.filter((recipe) => recipe.favorite).length;

  return (
    <section className="card list-card">
      <SearchControls
        search={search}
        category={category}
        sort={sort}
        favoritesOnly={favoritesOnly}
        onSearchChange={setSearch}
        onCategoryChange={setCategory}
        onSortChange={setSort}
        onFavoritesOnlyChange={setFavoritesOnly}
      />
      <div className="stats">
        {visible.length} of {props.recipes.length} shown • {favorites} favorite
        {favorites === 1 ? "" : "s"}
      </div>
      <div className="recipes">
        {visible.length === 0 ? (
          <p className="stats">
            {props.recipes.length === 0
              ? "No recipes yet. Add your first one on the left."
              : "No recipes match your current filters."}
          </p>
        ) : (
          visible.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpen={props.onOpen}
              onEdit={props.onEdit}
              onDelete={props.onDelete}
              onToggleFavorite={props.onToggleFavorite}
            />
          ))
        )}
      </div>
    </section>
  );
}
