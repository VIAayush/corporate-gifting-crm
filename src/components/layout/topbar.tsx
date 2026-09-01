'use client';

import React from 'react';
import { Search, Bell } from 'lucide-react';
import { CompanyAvatar } from '../ui/avatar';

interface TopbarProps {
  user?: {
    name: string;
    avatar_url?: string;
  };
}

export function Topbar({ user }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex-shrink-0 flex items-center justify-between px-6">
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-gray-50"
            placeholder="Search..."
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
        </button>
        
        {user && (
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4 ml-2">
            <span className="text-sm font-medium text-gray-700">{user.name}</span>
            <CompanyAvatar name={user.name || 'User'} logoPath={user.avatar_url} size="sm" />
          </div>
        )}
      </div>
    </header>
  );
}
