import { Link } from '@tanstack/react-router';
import { appConfig } from '../../../app.config';

export function AppHeader() {
  return <header className="border-b border-gray-200 bg-white">
    <nav aria-label="Główna nawigacja" className="mx-auto flex min-h-16 max-w-4xl items-center px-5 sm:px-8">
      <Link to="/" className="rounded text-base font-semibold tracking-tight text-gray-900 outline-offset-4 focus-visible:outline-2">
        {appConfig.name}
      </Link>
    </nav>
  </header>;
}
