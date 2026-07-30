import type { Recipe, RecipeInput } from "@/lib/types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed (${response.status}).`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getRecipes() {
  return request<{ recipes: Recipe[]; total: number; favorites: number }>(
    "/api/recipes",
  );
}

export async function createRecipe(input: RecipeInput) {
  return request<{ recipe: Recipe }>("/api/recipes", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateRecipe(id: string, input: RecipeInput) {
  return request<{ recipe: Recipe }>(`/api/recipes/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function removeRecipe(id: string) {
  return request<void>(`/api/recipes/${id}`, { method: "DELETE" });
}

export async function setFavorite(id: string, favorite: boolean) {
  return request<{ id: string; favorite: boolean }>(
    `/api/recipes/${id}/favorite`,
    {
      method: "PATCH",
      body: JSON.stringify({ favorite }),
    },
  );
}
