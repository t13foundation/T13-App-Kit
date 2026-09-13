export const NOTE_TITLE_LIMIT = 120;
export const NOTE_BODY_LIMIT = 20_000;
export const NOTES_PAGE_SIZE = 20;
export interface NoteDraft {
  title: string;
  body: string;
}

export function validateNoteDraft(value: NoteDraft): NoteDraft {
  const title = value.title.trim();
  if (!title || title.length > NOTE_TITLE_LIMIT)
    throw new Error("Tytuł musi mieć od 1 do 120 znaków.");
  if (value.body.length > NOTE_BODY_LIMIT)
    throw new Error("Treść może mieć maksymalnie 20 000 znaków.");
  return { title, body: value.body };
}
