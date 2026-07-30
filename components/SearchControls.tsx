"use client";

import { CATEGORY_OPTIONS, type RecipeSort } from "@/lib/types";

interface SearchControlsProps {
  search: string;
  category: string;
  sort: RecipeSort;
  favoritesOnly: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onSortChange: (value: RecipeSort) => void;
  onFavoritesOnlyChange: (value: boolean) => void;
}

export default function SearchControls(props: SearchControlsProps) {
  return (
    <div className="controls">
      <input
        aria-label="Search recipes"
        placeholder="Search recipes..."
        value={props.search}
        onChange={(event) => props.onSearchChange(event.target.value)}
      />
      <select
        aria-label="Filter by category"
        value={props.category}
        onChange={(event) => props.onCategoryChange(event.target.value)}
      >
        <option value="">All Categories</option>
        {CATEGORY_OPTIONS.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort recipes"
        value={props.sort}
        onChange={(event) =>
          props.onSortChange(event.target.value as RecipeSort)
        }
      >
        <option value="newest">Newest First</option>
        <option value="az">A to Z</option>
        <option value="favorites">Favorites First</option>
      </select>
      <label className="favorites-filter">
        <input
          type="checkbox"
          checked={props.favoritesOnly}
          onChange={(event) =>
            props.onFavoritesOnlyChange(event.target.checked)
          }
        />
        Favorites only
      </label>
    </div>
  );
}
