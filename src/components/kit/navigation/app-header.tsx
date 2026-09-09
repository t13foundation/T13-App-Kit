import { Link } from "@tanstack/react-router";
import { appConfig } from "../../../app.config";

const links = [
  { to: "/", label: "Start" },
  { to: "/notes", label: "Konto i notatki" },
  { to: "/catalog", label: "Komponenty" },
];

export function AppHeader() {
  return <header className="border-b border-gray-200 bg-white">
    <nav aria-label="Główna nawigacja" className="mx-auto flex min-h-14 max-w-4xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
      <Link to="/" className="min-w-0 break-words text-sm font-semibold tracking-tight text-gray-900">{appConfig.name}</Link>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-gray-600">
        {links.map((link) => <li key={link.to}><Link to={link.to} className="rounded outline-offset-4 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-gray-900 [&.active]:font-medium [&.active]:text-gray-900">{link.label}</Link></li>)}
      </ul>
    </nav>
  </header>;
}
