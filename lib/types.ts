export const CATEGORY_OPTIONS = [
  "Auggie",
  "Dessert",
  "Breakfast",
  "Lunch/Dinner",
] as const;

export type RecipeCategory = (typeof CATEGORY_OPTIONS)[number] | null;

export interface Recipe {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  category: RecipeCategory;
  tags: string[];
  ingredients: string[];
  instructions: string;
  notes: string;
  photo_url: string | null;
  favorite: boolean;
  created_by: string | null;
}

export interface RecipeInput {
  name: string;
  category: RecipeCategory;
  tags: string[];
  ingredients: string[];
  instructions: string;
  notes: string;
  photo_url?: string | null;
  favorite?: boolean;
}

export interface OldRecipe {
  id: string;
  createdAt: number;
  favorite: boolean;
  photo: string;
  name: string;
  category: string;
  tags: string[];
  ingredients: string[];
  instructions: string;
  notes: string;
}

export type RecipeSort = "newest" | "az" | "favorites";
