import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StatusBar } from './StatusBar';
import { SpatialBackground } from '../3d/SpatialBackground';
import { GlobalSearchModal } from '../modals/GlobalSearchModal';
import { useIntegrationsStore } from '../../stores/useIntegrationsStore';

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { reducedMotion } = useIntegrationsStore();

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#0e131d] text-[#dee2f1] overflow-hidden">
      {/* Subtle Spatial 3D Canvas Background */}
      <SpatialBackground reducedMotion={reducedMotion} />

      {/* Application Main Layout Shell */}
      <div className="relative z-10 flex flex-col h-full w-full">
        <Header
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          onOpenSearch={() => setSearchOpen(true)}
        />

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />

          <main className="flex-1 flex flex-col overflow-hidden bg-[#0e131d]/60 backdrop-blur-sm">
            <Outlet />
          </main>
        </div>

        <StatusBar />
      </div>

      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
};
