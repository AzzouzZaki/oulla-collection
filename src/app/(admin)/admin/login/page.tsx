'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/dashboard');
        return;
      } else {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? 'Invalid username or password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-[8px] border border-[#E5E7EB] p-8">
          {/* Shop name heading */}
          <h1 className="text-lg font-semibold text-[#111827] mb-1">
            Oulla Collection
          </h1>
          <p className="text-sm text-[#6B7280] mb-6">Admin panel</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[#111827] mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-[6px] outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] transition-colors placeholder:text-[#9CA3AF]"
                placeholder="Enter username"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#111827] mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm text-[#111827] bg-white border border-[#E5E7EB] rounded-[6px] outline-none focus:border-[#18181B] focus:ring-1 focus:ring-[#18181B] transition-colors placeholder:text-[#9CA3AF]"
                placeholder="Enter password"
              />
            </div>

            {/* Inline error */}
            {error && (
              <p className="text-sm text-[#EF4444]" role="alert">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-white bg-[#18181B] rounded-[6px] hover:bg-[#27272A] active:bg-[#18181B] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
