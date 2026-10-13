import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { PageMeta } from '@/components/ui/PageMeta';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function Login() {
  const { isAuthenticated, loginWithPassword, loginAsMockAdmin, mockAuthAvailable, supabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await loginWithPassword(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleMockLogin() {
    loginAsMockAdmin();
    navigate('/', { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <PageMeta title="Admin sign in" noIndex />
      <div className="w-full max-w-sm border border-border bg-white p-8">
        <BrandLogo withWordmark wordmark="BanaGifts" size="lg" className="mb-1" />
        <h1 className="mt-3 font-serif text-2xl text-text">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage orders, products, and settings.</p>

        {supabaseConfigured ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password" required>
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" fullWidth isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">
            Supabase auth is not configured. Set <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> to enable email sign-in.
          </p>
        )}

        {mockAuthAvailable && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs text-muted">Development only</p>
            <Button variant="outline" fullWidth className="mt-2" onClick={handleMockLogin}>
              Dev login (mock admin)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
