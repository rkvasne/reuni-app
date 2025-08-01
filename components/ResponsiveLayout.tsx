'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { useBreakpoint, responsive } from '@/lib/responsive';

interface ResponsiveLayoutProps {
  leftSidebar: React.ReactNode;
  mainContent: React.ReactNode;
  rightSidebar: React.ReactNode;
}

export default function ResponsiveLayout({
  leftSidebar,
  mainContent,
  rightSidebar
}: ResponsiveLayoutProps) {
  const breakpoint = useBreakpoint();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const isMobile = responsive.isMobile(breakpoint);
  const isTablet = responsive.isTablet(breakpoint);
  const isDesktop = responsive.isDesktop(breakpoint);

  // Fechar sidebars ao mudar para desktop
  useEffect(() => {
    if (isDesktop) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  }, [isDesktop]);

  // Fechar sidebars ao clicar fora (mobile)
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMobile) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };

    if (leftSidebarOpen || rightSidebarOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [leftSidebarOpen, rightSidebarOpen, isMobile]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {isMobile && (
        <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-neutral-600" />
            </button>
            
            <h1 className="font-bold text-lg text-primary-600">Reuni</h1>
            
            <button
              onClick={() => setRightSidebarOpen(true)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Left Sidebar */}
        <div className={`
          ${isDesktop 
            ? 'w-64 flex-shrink-0' 
            : 'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300'
          }
          ${isMobile && !leftSidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          bg-white border-r border-neutral-200
        `}>
          {/* Mobile close button */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="font-semibold text-neutral-800">Menu</h2>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          )}
          
          <div className={`${isMobile ? 'p-4' : ''} h-full overflow-y-auto sidebar-container`}>
            <div className="sidebar-content">
              {leftSidebar}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className={`
            max-w-4xl mx-auto
            ${isMobile ? 'px-4 py-4' : 'px-6 py-6'}
          `}>
            {mainContent}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={`
          ${isDesktop 
            ? 'w-80 flex-shrink-0' 
            : isTablet
              ? 'w-72 flex-shrink-0'
              : 'fixed inset-y-0 right-0 z-50 w-80 transform transition-transform duration-300'
          }
          ${isMobile && !rightSidebarOpen ? 'translate-x-full' : 'translate-x-0'}
          bg-white border-l border-neutral-200
        `}>
          {/* Mobile close button */}
          {isMobile && (
            <div className="flex items-center justify-between p-4 border-b border-neutral-200">
              <h2 className="font-semibold text-neutral-800">Ações</h2>
              <button
                onClick={() => setRightSidebarOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          )}
          
          <div className={`${isMobile ? 'p-4' : 'p-6'} h-full overflow-y-auto sidebar-container`}>
            <div className="sidebar-content">
              {rightSidebar}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      {isMobile && (leftSidebarOpen || rightSidebarOpen) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
}