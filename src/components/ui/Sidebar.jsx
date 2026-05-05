import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Panasonic } from '@thesvg/react';
import Icon from '../AppIcon';
import Button from './Button';

const Sidebar = ({ isCollapsed = false, onToggleCollapse, user, isMobileOpen, onMobileClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // UPDATED: Corrected role names to match database ('system_admin')
  const navigationItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard',
      roles: ['system_admin', 'it_staff', 'department_pic'],
      category: 'Asset Management and Workflow'
    },
    {
      label: 'Asset List',
      path: '/asset-list',
      icon: 'Package',
      roles: ['system_admin', 'it_staff', 'department_pic'],
      category: 'Asset Management and Workflow'
    },
    {
      label: 'QR Scan',
      path: '/scanner',
      icon: 'QrCode',
      roles: ['system_admin', 'it_staff'],
      category: 'Asset Management and Workflow'
    },
    {
      label: 'Add Asset',
      path: '/asset-registration',
      icon: 'Plus',
      roles: ['system_admin', 'it_staff'],
      category: 'Asset Management and Workflow'
    },
    {
      label: 'Assignment Management',
      path: '/checkout-management',
      icon: 'UserCheck',
      roles: ['system_admin', 'it_staff'],
      category: 'Asset Management and Workflow'
    },
    {
      label: 'Lifecycle Planning',
      path: '/lifecycle-planning',
      icon: 'TrendingUp',
      roles: ['system_admin', 'it_staff'],
      category: 'Asset Management and Workflow'
    },
    {
      label: 'Write-Offs & Disposals',
      path: '/write-offs',
      icon: 'Trash2',
      roles: ['system_admin', 'it_staff'],
      category: 'Asset Management and Workflow'
    },
    {
      label: 'Software Licenses',
      path: '/software',
      icon: 'Cloud',
      roles: ['system_admin', 'it_staff'],
      category: 'Asset Management and Workflow'
    },
    {
      label: 'Supplier Management',
      path: '/supplier-management',
      icon: 'Truck',
      roles: ['system_admin', 'it_staff'],
      category: 'Organization'
    },
    {
      label: 'User Registration',
      path: '/admin/user-registration',
      icon: 'UserCog',
      roles: ['system_admin'],
      category: 'Organization'
    },
    {
      label: 'Employee Management',
      path: '/admin/employee-management',
      icon: 'Users',
      roles: ['system_admin', 'manager'],
      category: 'Organization'
    },
    {
      label: 'Department Management',
      path: '/admin/department-management',
      icon: 'Building2',
      roles: ['system_admin', 'manager'],
      category: 'Organization'
    },
    {
      label: 'Location Management',
      path: '/admin/location-management',
      icon: 'MapPin',
      roles: ['system_admin', 'manager'],
      category: 'Organization'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (onMobileClose) onMobileClose();
  };

  // Improved filtering: if user role is missing, default to showing nothing to be safe
  const filteredNavItems = navigationItems?.filter(item => {
    const userRole = user?.role || user?.app_metadata?.role;
    // Show item if user has one of the allowed roles
    return item.roles.includes(userRole);
  });

  const isActive = (path) => {
    const { pathname, search } = location;

    if (path === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }

    if (path === '/asset-registration') {
      return pathname === '/asset-registration' && !search.includes('id=');
    }

    if (path === '/asset-list') {
      return pathname.startsWith('/asset-list') || (pathname === '/asset-registration' && search.includes('id='));
    }
    
    return pathname.startsWith(path);
  };

  const groupedNavItems = filteredNavItems.reduce((acc, item) => {
    const category = item.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] lg:hidden backdrop-blur-sm transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-[110]
        transition-all duration-300 ease-in-out shadow-sm
        ${isCollapsed ? 'w-16' : 'w-60'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-6'} py-5 border-b border-gray-100`}>
            {isCollapsed ? (
              <Panasonic className="h-6 w-6 text-[#0057B8]" />
            ) : (
              <div className="flex items-center space-x-3">
                <Panasonic className="h-7 w-auto text-[#0057B8]" />
                <div className="flex flex-col">
                  <span className="font-bold text-[13px] text-gray-900 leading-tight">ISD ASSETS</span>
                  <span className="text-[10px] text-gray-500 font-medium tracking-wider">PANASONIC</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 no-scrollbar">
            {Object.entries(groupedNavItems).map(([category, items], index) => (
              <div 
                key={category} 
                className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-4'} ${index > 0 ? 'mt-8' : ''}`}
              >
                {!isCollapsed && (
                  <h3 className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em]">
                    {category}
                  </h3>
                )}
                <div className="space-y-0.5">
                  {items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleNavigation(item.path)}
                      className={`
                        w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[13.5px] font-medium
                        transition-all duration-200 group
                        ${isActive(item.path)
                          ? 'bg-blue-50 text-[#0057B8]'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon 
                        name={item.icon} 
                        size={18} 
                        className={`flex-shrink-0 transition-colors ${
                          isActive(item.path) ? 'text-[#0057B8]' : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User Section */}
          <div className={`border-t border-gray-100 p-4 bg-gray-50/50 ${isCollapsed ? 'px-2' : ''}`}>
            {isCollapsed ? (
              <div className="flex justify-center">
                <div className="w-9 h-9 bg-white border border-gray-200 text-[#0057B8] rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white border border-gray-200 text-[#0057B8] rounded-xl flex items-center justify-center text-sm font-bold shadow-sm">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-gray-900 truncate">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium truncate">
                    {user?.role === 'system_admin' ? 'System Admin' : user?.role || 'IT Staff'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle (Desktop Only) */}
          <div className={`hidden lg:block border-t border-gray-100 p-2`}>
            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Icon name={isCollapsed ? "ChevronRight" : "ChevronLeft"} size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;