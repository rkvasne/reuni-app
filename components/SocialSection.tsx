'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface SocialSectionProps {
  title: string;
  subtitle?: string;
  viewAllLink?: string;
  viewAllText?: string;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function SocialSection({
  title,
  subtitle,
  viewAllLink,
  viewAllText = "Ver todos",
  loading = false,
  children,
  className = ""
}: SocialSectionProps) {
  return (
    <section className={`bg-neutral-50 rounded-xl p-6 ${className}`}>
      {/* Header da seção */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-800">{title}</h2>
          {subtitle && (
            <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        {viewAllLink && !loading && (
          <Link 
            href={viewAllLink}
            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
          >
            {viewAllText}
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      
      {/* Conteúdo */}
      <div>
        {children}
      </div>
    </section>
  );
}