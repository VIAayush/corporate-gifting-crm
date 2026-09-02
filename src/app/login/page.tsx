'use client';

import React, { useState } from 'react';
import { signIn } from './actions';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@oaklane.demo');
  const [password, setPassword] = useState('Oaklane-Demo-2026!');

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
      console.error(err);
      setLoading(false);
    }
  };

  const demoAccounts = [
    { email: 'admin@oaklane.demo', role: 'Admin' },
    { email: 'sales@oaklane.demo', role: 'Sales' },
    { email: 'ops@oaklane.demo', role: 'Operations' },
    { email: 'accounts@oaklane.demo', role: 'Accounts' },
    { email: 'management@oaklane.demo', role: 'Management' },
    { email: 'priya@wipro.example', role: 'Client Admin (Wipro)' },
    { email: 'rahul@nexora.example', role: 'Client Admin (Nexora)' },
  ];

  return (
    <div className="min-h-screen bg-[#F4EFE6] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="font-serif text-4xl text-[#1C1917] tracking-tight">Oaklane</h1>
        <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#7A7267] mt-1">
          GIFT OPERATIONS PLATFORM
        </p>
        <p className="text-xs text-[#7A7267] mt-3">
          Corporate gifting, from enquiry to payment.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-2xl border border-[#E5DFD5] sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  required
                  className="block w-full pl-10 pr-3 py-2.5 bg-[#FAF7F2] border border-[#E5DFD5] rounded-xl text-xs text-[#1C1917] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1A3022] focus:border-[#1A3022] transition-colors"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-xs font-semibold text-white bg-[#1A3022] hover:bg-[#274433] focus:outline-none shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in to Oaklane'}
            </button>
          </form>

          {/* Quick-fill Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-[#EFE9E0]">
            <p className="text-[11px] font-semibold text-[#7A7267] uppercase tracking-wider mb-3">
              One-Click Demo Accounts (Password: Oaklane-Demo-2026!)
            </p>
            <div className="space-y-1.5">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword('Oaklane-Demo-2026!');
                  }}
                  className="w-full text-left p-2.5 rounded-xl bg-[#FAF7F2] hover:bg-[#EFE9E0] border border-[#EFE9E0] flex justify-between items-center transition-all group"
                >
                  <span className="font-mono text-xs text-[#1C1917] group-hover:text-[#1A3022]">{account.email}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#E5DFD5] text-[#5A5248]">
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
