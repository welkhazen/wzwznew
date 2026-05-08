import { supabase } from "@/lib/supabase";

export type LandingNewAvatar = {
  id: string;
  name: string;
  imageSrc: string;
  position: number;
};

const LOCAL_KEY = "raw.landing-new-avatars.v1";

function readLocal(): LandingNewAvatar[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return (JSON.parse(raw) as LandingNewAvatar[]).filter(
      (item) => Boolean(item.id) && Boolean(item.name),
    );
  } catch {
    return [];
  }
}

function writeLocal(items: LandingNewAvatar[]): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  }
}

export function readLandingNewAvatarsLocal(): LandingNewAvatar[] {
  return readLocal();
}

export async function loadLandingNewAvatars(): Promise<LandingNewAvatar[]> {
  try {
    const { data, error } = await supabase
      .from("landing_new_avatars")
      .select("id, name, image_src, position")
      .order("position", { ascending: true });

    if (error) return readLocal();

    const items = (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      imageSrc: (row.image_src as string) ?? "",
      position: row.position as number,
    }));

    writeLocal(items);
    return items;
  } catch {
    return readLocal();
  }
}

export async function saveLandingNewAvatars(items: LandingNewAvatar[]): Promise<LandingNewAvatar[]> {
  const ordered = items.map((item, i) => ({ ...item, position: i }));

  const { error: deleteError } = await supabase
    .from("landing_new_avatars")
    .delete()
    .neq("id", "__never_matches__");

  if (deleteError) throw new Error(deleteError.message || "Could not clear new avatars.");

  if (ordered.length === 0) {
    writeLocal([]);
    return [];
  }

  const rows = ordered.map((item) => ({
    id: item.id,
    name: item.name,
    image_src: item.imageSrc,
    position: item.position,
  }));

  const { error: insertError } = await supabase
    .from("landing_new_avatars")
    .insert(rows);

  if (insertError) throw new Error(insertError.message || "Could not save new avatars.");

  writeLocal(ordered);
  return ordered;
}
