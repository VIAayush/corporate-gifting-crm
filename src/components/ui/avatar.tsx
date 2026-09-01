import React from 'react';
import Image from 'next/image';

interface CompanyAvatarProps {
  name: string;
  logoPath?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
};

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, 70%, 80%)`;
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return `${words[0][0]}${words[0][1]}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

export function CompanyAvatar({ name, logoPath, size = 'md', className = '' }: CompanyAvatarProps) {
  const sClass = sizeClasses[size];
  const bgColor = stringToColor(name);
  const initials = getInitials(name);

  return (
    <div className={`relative flex-shrink-0 rounded-full overflow-hidden flex items-center justify-center font-semibold text-gray-800 ${sClass} ${className}`} style={{ backgroundColor: logoPath ? 'transparent' : bgColor }}>
      {logoPath ? (
        <Image
          src={logoPath}
          alt={name}
          fill
          className="object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
