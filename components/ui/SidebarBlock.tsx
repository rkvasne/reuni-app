'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SidebarBlockProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
  headerAction?: React.ReactNode;
}

export default function SidebarBlock({
  title,
  subtitle,
  icon,
  children,
  collapsible = false,
  defaultOpen = true,
  className = "",
  headerAction
}: SidebarBlockProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    if (collapsible) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className={`p-4 border-b border-neutral-100 ${
          collapsible ? 'cursor-pointer hover:bg-neutral-50' : ''
        }`}
        onClick={toggleOpen}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-primary-600">
                {icon}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-neutral-800 text-sm">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-neutral-600 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {headerAction && (
              <div onClick={(e) => e.stopPropagation()}>
                {headerAction}
              </div>
            )}
            
            {collapsible && (
              <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                {isOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {isOpen && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}