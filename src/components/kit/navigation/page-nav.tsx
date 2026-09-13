import { Link } from "@tanstack/react-router";

import { Container } from "@/components/kit/layout/container";

export type NavLink = { to: string; label: string };

/** Shell navigation shared by both kits. The product name always comes from configuration. */
export function PageNav({ name, links }: { name: string; links: NavLink[] }) {
  return (
    <header className="border-b border-secondary bg-primary">
      <Container>
        <nav aria-label="Główna nawigacja" className="kit-nav">
          <Link to="/" className="text-sm font-semibold tracking-tight text-primary">
            {name}
          </Link>
          <ul className="text-sm text-tertiary">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="rounded outline-offset-4 hover:text-primary focus-visible:outline-2 focus-visible:outline-focus-ring [&.active]:font-medium [&.active]:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
