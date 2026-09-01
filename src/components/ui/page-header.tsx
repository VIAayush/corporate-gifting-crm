import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, breadcrumbs, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-6 md:flex md:items-center md:justify-between ${className}`}>
      <div className="flex-1 min-w-0">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
      </div>
      {action && (
        <div className="mt-4 flex md:mt-0 md:ml-4">
          {action}
        </div>
      )}
    </div>
  );
}
