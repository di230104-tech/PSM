import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { logoutUser } from '../../store/authSlice';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';
import { NotificationContainer } from './NotificationToast';


const Header = ({ user, onSearch, onNotificationClick, onProfileClick, collapsed }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const searchRef = useRef(null);
  const debounceTimeout = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef?.current && !searchRef?.current?.contains(event?.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addNotification = (message, type) => {
    setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const fetchSuggestions = async (query) => {
    if (query.length > 1) { // Fetch for 2 or more characters
      setIsLoading(true);
      try {
        const { data, error } = await supabase.rpc('global_search', {
          search_term: query
        });
        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching search suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery?.trim() && onSearch) {
      onSearch(searchQuery);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.url) {
      navigate(suggestion.url);
    }
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'asset': return 'Package';
      case 'employee': return 'User';
      case 'department': return 'Building';
      case 'supplier': return 'Truck';
      default: return 'Search';
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
          <form onSubmit={handleSearchSubmit} className="relative">
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
                className="pl-10 pr-4 h-10 bg-muted/50 border-border focus:bg-background"
              />
              <Icon
                name="Search"
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              {isLoading && (
                <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted border-t-primary"></div>
                </div>
              )}
              {searchQuery && !isLoading && (
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
            {/* Search Suggestions Dropdown */}
            {showSuggestions && suggestions?.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-modal z-200 max-h-80 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-medium text-muted-foreground px-3 py-2 border-b border-border">
                    Search Results
                  </div>
                  {suggestions?.map((suggestion) => (
                    <button
                      key={suggestion?.result_id + suggestion.result_type}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center space-x-3 px-3 py-3 text-left hover:bg-muted rounded-lg transition-colors"
                    >
                      <Icon name={getSuggestionIcon(suggestion.result_type)} size={16} className="text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{suggestion.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{suggestion.subtitle}</p>
                      </div>
                      <Icon name="ArrowRight" size={14} className="text-muted-foreground flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>
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