import { createClient as createAdminClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseUrl } from "@/lib/supabase/env";
import { requireUser } from "@/lib/supabase/server";
import type { OldRecipe } from "@/lib/types";
import {
  errorMessage,
  normalizeCategory,
  normalizeRecipeInput,
} from "@/lib/utils";

export const runtime = "nodejs";

const PHOTO_TYPES: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function decodeDataUrl(value: string) {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(value);
  if (!match) throw new Error("Unsupported base64 photo.");
  const extension = PHOTO_TYPES[match[1].toLowerCase()];
  if (!extension) throw new Error(`Unsupported photo type: ${match[1]}.`);
  return {
    bytes: Buffer.from(match[2], "base64"),
    contentType: match[1].toLowerCase(),
    extension,
  };
}

export async function POST(request: Request) {
  if (process.env.MIGRATION_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Recipe migration is disabled." },
      { status: 403 },
    );
  }

  try {
    const { user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured.");
    }
    const admin = createAdminClient(getSupabaseUrl(), serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const payload = (await request.json()) as { recipes?: unknown };
    if (!Array.isArray(payload.recipes)) {
      return NextResponse.json(
        { error: "recipes must be an array." },
        { status: 400 },
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const rawRecipe of payload.recipes) {
      const old = rawRecipe as OldRecipe;
      try {
        const normalized = normalizeRecipeInput({
          ...old,
          category: normalizeCategory(old.category),
          photo_url: null,
        });
        let photoUrl: string | null = null;

        if (old.photo?.startsWith("data:")) {
          const photo = decodeDataUrl(old.photo);
          const storagePath = `${user.id}/migrated-${old.id}.${photo.extension}`;
          const { error: uploadError } = await admin.storage
            .from("recipe-photos")
            .upload(storagePath, photo.bytes, {
              contentType: photo.contentType,
              upsert: true,
            });
          if (uploadError) throw uploadError;
          photoUrl = admin.storage
            .from("recipe-photos")
            .getPublicUrl(storagePath).data.publicUrl;
        }

        const { error } = await admin.from("recipes").upsert({
          id: old.id,
          created_at: new Date(old.createdAt || Date.now()).toISOString(),
          ...normalized,
          photo_url: photoUrl,
          favorite: Boolean(old.favorite),
          created_by: user.id,
        });
        if (error) throw error;
        imported += 1;
      } catch (error) {
        skipped += 1;
        errors.push(`${old?.name || old?.id || "Unknown recipe"}: ${errorMessage(error)}`);
      }
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
