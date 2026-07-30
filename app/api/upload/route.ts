import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { errorMessage } from "@/lib/utils";

export const runtime = "nodejs";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const photo = formData.get("photo");
    if (!(photo instanceof File)) {
      return NextResponse.json(
        { error: "A photo file is required." },
        { status: 400 },
      );
    }
    const extension = EXTENSIONS[photo.type];
    if (!extension) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, WebP, GIF, or AVIF image." },
        { status: 415 },
      );
    }
    if (photo.size > MAX_PHOTO_SIZE) {
      return NextResponse.json(
        { error: "Photos must be 5 MB or smaller." },
        { status: 413 },
      );
    }

    const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from("recipe-photos")
      .upload(storagePath, await photo.arrayBuffer(), {
        contentType: photo.type,
        upsert: false,
      });
    if (error) throw error;

    const { data } = supabase.storage
      .from("recipe-photos")
      .getPublicUrl(storagePath);
    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
