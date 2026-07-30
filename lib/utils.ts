import {
  CATEGORY_OPTIONS,
  type Recipe,
  type RecipeCategory,
  type RecipeInput,
} from "@/lib/types";

const MAX_NAME_LENGTH = 80;

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean);
}

export function normalizeCategory(value: unknown): RecipeCategory {
  const category = String(value || "").trim();
  return CATEGORY_OPTIONS.includes(
    category as (typeof CATEGORY_OPTIONS)[number],
  )
    ? (category as RecipeCategory)
    : null;
}

export function normalizeRecipeInput(value: unknown): RecipeInput {
  const body =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const name = String(body.name || "").trim();
  const ingredients = normalizeStringArray(body.ingredients);
  const instructions = String(body.instructions || "").trim();

  if (!name) throw new Error("Recipe name is required.");
  if (name.length > MAX_NAME_LENGTH) {
    throw new Error(`Recipe name must be ${MAX_NAME_LENGTH} characters or less.`);
  }
  if (ingredients.length === 0) {
    throw new Error("At least one ingredient is required.");
  }
  if (!instructions) throw new Error("Instructions are required.");

  return {
    name,
    category: normalizeCategory(body.category),
    tags: normalizeStringArray(body.tags),
    ingredients,
    instructions,
    notes: String(body.notes || "").trim(),
    photo_url:
      typeof body.photo_url === "string" && body.photo_url.trim()
        ? body.photo_url.trim()
        : null,
    favorite: Boolean(body.favorite),
  };
}

export function filterAndSortRecipes(
  recipes: Recipe[],
  options: {
    search?: string;
    category?: string;
    favoritesOnly?: boolean;
    sort?: string;
  },
): Recipe[] {
  const query = options.search?.trim().toLocaleLowerCase() || "";

  const filtered = recipes.filter((recipe) => {
    const categoryPass =
      !options.category || recipe.category === options.category;
    const favoritePass = !options.favoritesOnly || recipe.favorite;
    const searchable = [
      recipe.name,
      recipe.category || "",
      recipe.instructions,
      recipe.notes,
      ...recipe.tags,
      ...recipe.ingredients,
    ]
      .join(" ")
      .toLocaleLowerCase();

    return categoryPass && favoritePass && (!query || searchable.includes(query));
  });

  return [...filtered].sort((a, b) => {
    if (options.sort === "az") return a.name.localeCompare(b.name);
    if (options.sort === "favorites") {
      return (
        Number(b.favorite) - Number(a.favorite) ||
        Date.parse(b.created_at) - Date.parse(a.created_at)
      );
    }
    return Date.parse(b.created_at) - Date.parse(a.created_at);
  });
}

export function storagePathFromPublicUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const marker = "/storage/v1/object/public/recipe-photos/";
    const index = parsed.pathname.indexOf(marker);
    if (index === -1) return null;
    return decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
