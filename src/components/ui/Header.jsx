import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../../store/authSlice';
import Icon from '../AppIcon';
import Button from './Button';
import Input from './Input';
import { NotificationContainer } from './NotificationToast';
import { supabase } from '../../lib/supabaseClient';
import useDebounce from '../../hooks/useDebounce';
import QRCodeModal from '../../pages/asset-list/components/QRCodeModal';


const Header = ({ user, onSearch, onNotificationClick, onProfileClick, collapsed }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const [selectedAssetForQR, setSelectedAssetForQR] = useState(null);
  
  const searchRef = useRef(null);
  const debouncedTerm = useDebounce(searchQuery, 300);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsResultsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Supabase Omni-Search Logic
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedTerm.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      setIsResultsVisible(true);

      try {
        const trimmedTerm = debouncedTerm.trim();
        const { data, error } = await supabase
          .from('assets')
          .select('*, suppliers(company_name), locations(name)')
          .or(`product_name.ilike.%${trimmedTerm}%,asset_tag.ilike.%${trimmedTerm}%,serial_number.ilike.%${trimmedTerm}%`)
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedTerm]);

  const addNotification = (message, type) => {
    setNotifications(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (!isResultsVisible) setIsResultsVisible(true);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsResultsVisible(false);
    
    if (searchResults.length > 0) {
      const firstResult = searchResults[0];
      // Use asset_tag if available, fallback to id
      navigate(`/assets/${firstResult.asset_tag || firstResult.id}`);
    } else {
      // Navigate to asset list with search param as requested
      navigate(`/asset-list?search=${encodeURIComponent(query)}`);
    }
    
    setSearchQuery('');
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
                placeholder="Search assets by ID, Name, or Serial..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  setIsSearchExpanded(true);
                  if (searchQuery.length >= 2) setIsResultsVisible(true);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                className="pl-10 pr-10 h-10 bg-muted/50 border-border focus:bg-background"
              />
              <Icon
                name="Search"
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              {isSearching ? (
                <Icon
                  name="Loader2"
                  size={16}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground animate-spin"
                />
              ) : searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  iconName="X"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setIsResultsVisible(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground"
                />
              )}
            </div>

            {/* Search Results Dropdown */}
            {isResultsVisible && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-card border border-border rounded-lg shadow-modal z-200 overflow-hidden">
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      <span>Searching assets...</span>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="group flex items-center justify-between px-4 py-2 hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => {
                          navigate(`/assets/${asset.asset_tag || asset.id}`);
                          setIsResultsVisible(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="w-8 h-8 rounded bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {asset.image_url ? (
                              <img src={asset.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Icon name="Package" size={16} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="text-sm font-medium text-foreground truncate">
                              {asset.product_name}
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0 bg-primary/10 text-primary rounded border border-primary/20 uppercase">
                                {asset.asset_tag}
                              </span>
                              <span className={`text-[10px] px-1.5 py-0 rounded-full border ${
                                asset.status === 'In Use' ? 'bg-success/10 text-success border-success/20' :
                                asset.status === 'Maintenance' ? 'bg-warning/10 text-warning border-warning/20' :
                                'bg-muted text-muted-foreground border-border'
                              }`}>
                                {asset.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            iconName="QrCode" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAssetForQR(asset);
                            }}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            iconName="Wrench" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/assets/${asset.asset_tag || asset.id}?tab=maintenance`);
                              setIsResultsVisible(false);
                              setSearchQuery('');
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 p-2 border-t border-border">
                      <button 
                        className="w-full py-1.5 text-xs text-center text-primary hover:underline font-medium"
                        onClick={() => {
                          const query = searchQuery.trim();
                          navigate(`/asset-list?search=${encodeURIComponent(query)}`);
                          setIsResultsVisible(false);
                          setSearchQuery('');
                        }}
                      >
                        View all results
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-sm text-muted-foreground">No assets found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
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
      
      {/* QR Code Modal */}
      {selectedAssetForQR && (
        <QRCodeModal 
          asset={selectedAssetForQR}
          isOpen={!!selectedAssetForQR}
          onClose={() => setSelectedAssetForQR(null)}
        />
      )}
    </header>
  );
};

export default Header;