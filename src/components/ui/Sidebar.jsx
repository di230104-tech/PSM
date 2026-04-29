import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Panasonic } from '@thesvg/react';
import Icon from '../AppIcon';
import Button from './Button';

const Sidebar = ({ isCollapsed = false, onToggleCollapse, user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

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
    
      label: 'Checkout Management',
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
    setIsMobileOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
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
          className="fixed inset-0 bg-black/50 z-200 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        iconName="Menu"
        onClick={toggleMobileMenu}
        className="fixed top-4 left-4 z-250 lg:hidden text-foreground"
      />
      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full bg-card border-r border-border z-200
        transition-transform duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-60'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-6'} py-4 border-b border-border`}>
            {isCollapsed ? (
              <Panasonic className="h-6 w-6 text-primary" />
            ) : (
              <div className="flex items-center space-x-3">
                <Panasonic className="h-8 w-auto text-primary" />
                <div>
                  <div className="font-semibold text-sm text-foreground">Panasonic ISD</div>
                  <div className="text-xs text-muted-foreground">Asset Management</div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4">
            {Object.entries(groupedNavItems).map(([category, items], index) => (
              <div 
                key={category} 
                className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-4'} ${index > 0 ? 'mt-4' : ''}`} // Add mt-4 for spacing
              >
                {!isCollapsed && (
                  <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </h3>
                )}
                {items.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-colors duration-150 group
                      ${isActive(item.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon 
                      name={item.icon} 
                      size={20} 
                      className={`flex-shrink-0 ${
                        isActive(item.path) ? 'text-primary-foreground' : ''
                      }`}
                    />
                    {!isCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* User Section */}
          <div className={`border-t border-border p-4 ${isCollapsed ? 'px-2' : ''}`}>
            {isCollapsed ? (
              <div className="flex justify-center">
                <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">
                    {user?.full_name || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user?.role === 'system_admin' ? 'System Admin' : user?.role || 'IT Staff'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Collapse Toggle (Desktop Only) */}
          {!isMobileOpen && (
            <div className={`hidden lg:block border-t border-border p-2`}>
              <Button
                variant="ghost"
                size="icon"
                iconName={isCollapsed ? "ChevronRight" : "ChevronLeft"}
                onClick={onToggleCollapse}
                className="w-full text-muted-foreground hover:text-foreground"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;