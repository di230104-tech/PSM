import React, { useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/authSlice';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';
import { NotificationContainer } from './NotificationToast';


const Header = ({ user, onSearch, onNotificationClick, onProfileClick, collapsed }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const searchRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const addNotification = (message, type) => {
    setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = () => {
    const query = searchQuery.trim();
    if (query) {
      setTimeout(() => {
        navigate(`/assets/${query}`);
        setSearchQuery('');
      }, 0);
    }
  };

  const toggleProfile = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleProfileAction = async (action) => {
    setIsProfileOpen(false);
    if (action === 'logout') {
      try {
        addNotification('You have been successfully logged out.', 'success');
        await dispatch(logoutUser()).unwrap();
        setTimeout(() => navigate('/login'), 1500);
      } catch (error) {
        console.error("Logout failed:", error);
        addNotification('Logout failed. Please try again.', 'error');
      }
    } else if (onProfileClick) {
      onProfileClick(action);
    }
  };

  return (
    <header className={`fixed top-0 right-0 z-100 h-16 bg-card border-b border-border transition-all duration-300 ${collapsed ? 'lg:left-16' : 'lg:left-60'}`}>
      <NotificationContainer notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      <div className="flex items-center justify-between h-full px-6">
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            iconName="Menu"
            onClick={() => {}}
            className="text-muted-foreground hover:text-foreground"
          />
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <div className={`relative transition-all duration-200 ${
              isSearchExpanded ? 'w-full' : 'w-full md:w-96'
            }`}>
              <Input
                type="search"
                placeholder="Search assets, employees, suppliers..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => setIsSearchExpanded(false)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                className="pl-10 pr-4 h-10 bg-muted/50 border-border focus:bg-background"
              />              <Icon
                name="Search"
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              {searchQuery && (
                <Button
                  type="button" // Important: type="button" to not submit form
                  variant="ghost"
                  size="icon"
                  iconName="X"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            iconName="Bell"
            onClick={onNotificationClick}
            className="relative text-muted-foreground hover:text-foreground"
          >
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-error text-error-foreground text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              onClick={toggleProfile}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground px-3"
            >
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium text-foreground">
                  {user?.full_name || 'User'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {user?.role || 'IT Staff'}
                </div>
              </div>
              <Icon name="ChevronDown" size={16} />
            </Button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-modal z-200">
                <div className="p-3 border-b border-border">
                  <div className="font-medium text-sm text-popover-foreground">
                    {user?.full_name || 'User Name'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.email || 'user@panasonic.com'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Role: {user?.role || 'IT Staff'}
                  </div>
                </div>
                <div className="py-2">
                  <button
                    onClick={() => handleProfileAction('profile')}
                    className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted flex items-center space-x-2 transition-colors"
                  >
                    <Icon name="User" size={16} />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={() => handleProfileAction('preferences')}
                    className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted flex items-center space-x-2 transition-colors"
                  >
                    <Icon name="Settings" size={16} />
                    <span>Preferences</span>
                  </button>
                  <button
                    onClick={() => handleProfileAction('help')}
                    className="w-full px-3 py-2 text-left text-sm text-popover-foreground hover:bg-muted flex items-center space-x-2 transition-colors"
                  >
                    <Icon name="HelpCircle" size={16} />
                    <span>Help & Support</span>
                  </button>
                  <div className="border-t border-border mt-2 pt-2">
                    <button
                      onClick={() => handleProfileAction('logout')}
                      className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-muted flex items-center space-x-2 transition-colors"
                    >
                      <Icon name="LogOut" size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;