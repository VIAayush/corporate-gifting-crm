'use client';

import React, { useState } from 'react';
import { signIn } from './actions';
import { Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    { email: 'priya@wipro.example', role: 'Client Admin' },
    { email: 'rahul@nexora.example', role: 'Client Admin' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-primary p-12 text-white">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white text-primary rounded-2xl font-bold text-5xl mb-8">
            G
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">GIFFTER</h1>
          <p className="text-lg text-primary-100 opacity-80">
            The complete corporate gifting business operating platform.
          </p>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 lg:p-24">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-12 flex items-center gap-3 justify-center text-primary">
            <div className="w-12 h-12 bg-primary text-white rounded-lg font-bold flex items-center justify-center text-2xl">
              G
            </div>
            <span className="font-bold text-3xl tracking-tight">GIFFTER</span>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-2 text-sm">Please sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    name="password"
                    type="password"
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign in'}
              </button>
            </form>
          </div>

          <div className="mt-12">
            <h3 className="text-sm font-medium text-gray-900 mb-4 px-2">Demo Accounts (Password: Oaklane-Demo-2026!)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <div key={account.email} className="text-xs bg-white p-2.5 rounded-md border border-gray-200 flex justify-between items-center">
                  <span className="font-mono text-gray-600">{account.email}</span>
                  <span className="font-medium text-primary px-2 py-0.5 bg-primary/5 rounded-full">{account.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
