import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";
import {
  errorMessage,
  filterAndSortRecipes,
  normalizeRecipeInput,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const recipes = (data || []) as Recipe[];
    const params = request.nextUrl.searchParams;
    const filtered = filterAndSortRecipes(recipes, {
      search: params.get("search") || "",
      category: params.get("category") || "",
      sort: params.get("sort") || "newest",
      favoritesOnly: params.get("favoritesOnly") === "true",
    });

    return NextResponse.json({
      recipes: filtered,
      total: recipes.length,
      favorites: recipes.filter((recipe) => recipe.favorite).length,
    });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const input = normalizeRecipeInput(await request.json());
    const { data, error } = await supabase
      .from("recipes")
      .insert({ ...input, created_by: user.id })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ recipe: data as Recipe }, { status: 201 });
  } catch (error) {
    const message = errorMessage(error);
    const status = message.includes("required") || message.includes("characters")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
