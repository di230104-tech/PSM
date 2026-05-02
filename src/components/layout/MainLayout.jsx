import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../ui/Sidebar';
import Header from '../ui/Header';
import CommandPalette from '../ui/CommandPalette';
import { useSelector } from 'react-redux';

const MainLayout = () => {

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const handleSearch = (query) => {
    if (query?.trim()) {
      navigate(`/search-results?q=${encodeURIComponent(query)}`);
    }
  };

    return (

      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <CommandPalette />
      <div className="print:hidden">
        <Sidebar 
          user={user} 
          isCollapsed={isSidebarCollapsed} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="print:hidden">
          <Header user={user} collapsed={isSidebarCollapsed} onSearch={handleSearch} />
        </div>
        <main className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'} pt-16 flex-1 overflow-y-auto print:p-0 print:m-0 print:overflow-visible`}>
          
          {/* THIS IS KEY: Passing the user object to children */}
          <Outlet context={{ user }} /> 
          
        </main>
      </div>
    </div>
  );
};

export default MainLayout;