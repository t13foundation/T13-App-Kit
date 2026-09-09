import { Link } from "@tanstack/react-router";

import { appConfig } from "../../../app.config";

const links = [
  { to: "/", label: "Start" },
  { to: "/account", label: "Konto" },
  { to: "/catalog", label: "Komponenty" },
];

/** Application shell header. The product name always comes from app.config.ts. */
export function AppHeader() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <nav
        aria-label="Główna nawigacja"
        className="mx-auto flex h-14 max-w-4xl items-center gap-6 px-4"
      >
        <Link to="/" className="text-sm font-semibold tracking-tight text-gray-900">
          {appConfig.name}
        </Link>
        <ul className="flex items-center gap-4 text-sm text-gray-600">
          {links.map((link) => (
            <li key={link.to}>
              <Link
                to={link.to}
                className="rounded outline-offset-4 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-gray-900 [&.active]:text-gray-900 [&.active]:font-medium"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
