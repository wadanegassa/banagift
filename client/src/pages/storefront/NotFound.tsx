import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/PageMeta';
import { Button } from '@/components/ui/Button';

export function NotFound() {
  return (
    <div className="container-prose flex flex-col items-center px-4 py-24 text-center sm:px-6">
      <PageMeta title="Page not found" noIndex />
      <p className="font-serif text-6xl text-accent/50">404</p>
      <h1 className="mt-4 font-serif text-3xl text-text">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Return home</Button>
      </Link>
    </div>
  );
}
