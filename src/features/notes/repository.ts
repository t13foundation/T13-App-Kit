import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../lib/supabase/database.types";
import { NOTES_PAGE_SIZE, validateNoteDraft, type NoteDraft } from "./validation.ts";

export type NotesClient = SupabaseClient<Database>;
export type Note = Pick<Database["public"]["Tables"]["notes"]["Row"], "id" | "title" | "body" | "created_at" | "updated_at">;
const columns = "id,title,body,created_at,updated_at";
async function safeQuery<T>(request: PromiseLike<T>, message: string): Promise<T> {
  try { return await request; } catch { throw new Error(message); }
}

export async function listNotes(client: NotesClient, actorId: string, page: number, signal: AbortSignal) {
  if (!Number.isSafeInteger(page) || page < 0) throw new Error("Nieprawidłowa strona.");
  // The actor filter also prevents in-flight requests from crossing an account switch.
  // RLS is still mandatory: direct callers can omit this filter.
  const { data, error } = await safeQuery(client.from("notes").select(columns).eq("owner_id", actorId)
    .order("created_at", { ascending: false }).order("id", { ascending: false })
    .range(page * NOTES_PAGE_SIZE, (page + 1) * NOTES_PAGE_SIZE).abortSignal(signal), "Nie udało się wczytać notatek.");
  if (error) throw new Error("Nie udało się wczytać notatek. Sprawdź połączenie i migracje bazy.");
  return { notes: data.slice(0, NOTES_PAGE_SIZE), hasMore: data.length > NOTES_PAGE_SIZE };
}

export async function saveNote(client: NotesClient, actorId: string, draft: NoteDraft, original?: Note): Promise<Note> {
  const payload = validateNoteDraft(draft);
  const result = original
    ? await safeQuery(client.from("notes").update(payload).eq("owner_id", actorId).eq("id", original.id).eq("updated_at", original.updated_at).select(columns).maybeSingle(), "Nie potwierdzono zapisu. Odśwież listę przed ponowną próbą.")
    : await safeQuery(client.from("notes").insert({ ...payload, owner_id: actorId }).select(columns).single(), "Nie potwierdzono zapisu. Odśwież listę przed ponowną próbą.");
  if (result.error) throw new Error("Nie potwierdzono zapisu. Odśwież listę przed ponowną próbą.");
  if (!result.data) throw new Error("Notatka została zmieniona albo nie jest już dostępna. Odśwież listę.");
  return result.data;
}

export async function deleteNote(client: NotesClient, actorId: string, original: Note): Promise<void> {
  const { data, error } = await safeQuery(client.from("notes").delete()
    .eq("owner_id", actorId).eq("id", original.id).eq("updated_at", original.updated_at).select("id").maybeSingle(), "Nie potwierdzono usunięcia. Odśwież listę przed ponowną próbą.");
  if (error) throw new Error("Nie potwierdzono usunięcia. Odśwież listę przed ponowną próbą.");
  if (!data) throw new Error("Notatka została zmieniona albo usunięta. Odśwież listę.");
}
