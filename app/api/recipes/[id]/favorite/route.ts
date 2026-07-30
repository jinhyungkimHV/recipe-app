import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { favorite } = (await request.json()) as { favorite?: unknown };
    if (typeof favorite !== "boolean") {
      return NextResponse.json(
        { error: "favorite must be a boolean." },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const { data, error } = await supabase
      .from("recipes")
      .update({ favorite })
      .eq("id", id)
      .select("id, favorite")
      .single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
