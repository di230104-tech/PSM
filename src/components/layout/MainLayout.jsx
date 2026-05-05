import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';
import CommandPalette from '../ui/CommandPalette';
import { useSelector } from 'react-redux';

const MainLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleSearch = (query) => {
    if (query?.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <CommandPalette />
      
      <div className="print:hidden">
        <Sidebar 
          user={user} 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className={`flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden relative transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'}`}>
        <div className="print:hidden sticky top-0 z-50">
          <Header 
            user={user} 
            collapsed={isSidebarCollapsed} 
            onSearch={handleSearch}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full max-w-7xl mx-auto print:m-0 print:p-0 print:overflow-visible">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;