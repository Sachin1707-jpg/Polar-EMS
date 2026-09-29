import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, MobileSidebar } from '@/components/navigation/Sidebar';
import { Header } from '@/components/navigation/Header';
import { Toaster } from 'sonner';

/**
 * Main Application Layout
 * Responsive layout with sidebar, header, and content area
 */

interface AppLayoutProps {
  user?: {
    full_name?: string;
    username: string;
    role: string;
  } | null;
  systemStatus?: 'normal' | 'warning' | 'critical';
  unreadAlertCount?: number;
  onLogout?: () => void;
}

export function AppLayout({
  user,
  systemStatus,
  unreadAlertCount,
  onLogout,
}: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-polar">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#141b2d',
            border: '1px solid #2d3748',
            color: '#f3f4f6',
          },
          className: 'text-sm',
        }}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <Header
          user={user}
          systemStatus={systemStatus}
          unreadAlertCount={unreadAlertCount}
          onLogout={onLogout}
          onMenuClick={() => setMobileMenuOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
