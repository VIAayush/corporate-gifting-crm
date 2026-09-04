'use client';

import React, { useState } from 'react';
import { signIn } from './actions';
import { Mail, Lock, Loader2 } from 'lucide-react';

export function LoginForm({ next = '' }: { next?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await signIn(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err) {
      const digest =
        typeof err === 'object' && err && 'digest' in err
          ? String((err as { digest?: unknown }).digest)
          : ''
      if (digest.startsWith('NEXT_REDIRECT')) throw err
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="font-serif text-4xl text-[#1C1917] tracking-tight">GIFFTER</h1>
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7267] mt-1">
          Corporate Gifting CRM
        </p>
        <p className="text-xs text-[#7A7267] mt-3">
          Corporate gifting, from enquiry to payment.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl border border-[#E5DFD5] sm:px-10">
          <p className="text-sm text-[#5A5248] mb-6 text-center">Sign in to GIFFTER</p>
          <form onSubmit={handleSubmit} className="space-y-5">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#5A5248] mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl text-xs text-[#1C1917] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1A3022] focus:border-[#1A3022] transition-colors"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5A5248] mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl text-xs text-[#1C1917] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1A3022] focus:border-[#1A3022] transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1A3022] hover:bg-[#274433] hover:text-white focus:outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
