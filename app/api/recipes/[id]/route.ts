import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import type { Recipe } from "@/lib/types";
import {
  errorMessage,
  normalizeRecipeInput,
  storagePathFromPublicUrl,
} from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const { data: existing, error: readError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    const input = normalizeRecipeInput({ ...existing, ...body });

    const { data, error } = await supabase
      .from("recipes")
      .update(input)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    if (existing.photo_url && existing.photo_url !== input.photo_url) {
      const oldPath = storagePathFromPublicUrl(existing.photo_url);
      if (oldPath) {
        await supabase.storage.from("recipe-photos").remove([oldPath]);
      }
    }

    return NextResponse.json({ recipe: data as Recipe });
  } catch (error) {
    const message = errorMessage(error);
    const status = message.includes("required") || message.includes("characters")
      ? 400
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { id } = await context.params;
    const { data: existing, error: readError } = await supabase
      .from("recipes")
      .select("photo_url")
      .eq("id", id)
      .single();
    if (readError) throw readError;

    const { error } = await supabase.from("recipes").delete().eq("id", id);
    if (error) throw error;

    const photoPath = storagePathFromPublicUrl(existing.photo_url);
    if (photoPath) {
      await supabase.storage.from("recipe-photos").remove([photoPath]);
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
