import { Container } from "@/components/kit/layout/container";

/** Shell footer shared by both kits. Facts only; no marketing copy. */
export function PageFooter({ name, note }: { name: string; note: string }) {
  return (
    <footer className="bg-primary py-8">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-tertiary">
          <span className="font-medium text-secondary">{name}</span>
          <span>{note}</span>
        </div>
      </Container>
    </footer>
  );
}
