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


const Header = ({ user, onSearch, onNotificationClick, onProfileClick, collapsed, onMenuClick }) => {
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
    <header className="w-full h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <NotificationContainer notifications={notifications} onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile Menu Button */}
        <div className="lg:hidden mr-2">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Icon name="Menu" size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div ref={searchRef} className="flex-1 max-w-2xl">
          <div className="relative">
            <div className={`relative transition-all duration-200 ${
              isSearchExpanded ? 'w-full' : 'w-full md:w-96'
            }`}>
              <Input
                type="search"
                placeholder="Search assets..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  setIsSearchExpanded(true);
                  if (searchQuery.length >= 2) setIsResultsVisible(true);
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                className="pl-9 pr-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all rounded-lg text-sm"
              />
              <Icon
                name="Search"
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
              {isSearching ? (
                <Icon
                  name="Loader2"
                  size={14}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 animate-spin"
                />
              ) : searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setIsResultsVisible(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <Icon name="X" size={14} />
                </button>
              )}
            </div>

            {/* Search Results Dropdown */}
            {isResultsVisible && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 mt-2 w-full md:w-[480px] bg-white border border-gray-200 rounded-xl shadow-xl z-[200] overflow-hidden">
                {isSearching ? (
                  <div className="p-8 text-center">
                    <div className="flex flex-col items-center space-y-2">
                      <Icon name="Loader2" size={24} className="text-blue-500 animate-spin" />
                      <span className="text-sm font-medium text-gray-500">Searching assets...</span>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Quick Results
                    </div>
                    {searchResults.map((asset) => (
                      <div 
                        key={asset.id} 
                        className="group flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          navigate(`/assets/${asset.asset_tag || asset.id}`);
                          setIsResultsVisible(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-gray-200">
                            {asset.image_url ? (
                              <img src={asset.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Icon name="Package" size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div className="truncate">
                            <div className="text-sm font-bold text-gray-900 truncate">
                              {asset.product_name}
                            </div>
                            <div className="flex items-center space-x-2 mt-0.5">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 uppercase">
                                {asset.asset_tag}
                              </span>
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                asset.status === 'In Use' ? 'bg-green-50 text-green-700' :
                                asset.status === 'Maintenance' ? 'bg-amber-50 text-amber-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {asset.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Icon name="ChevronRight" size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                      </div>
                    ))}
                    <div className="p-2 bg-gray-50 border-t border-gray-100">
                      <button 
                        className="w-full py-2 text-xs text-center text-blue-600 hover:text-blue-700 font-bold transition-colors"
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
                  <div className="p-8 text-center">
                    <p className="text-sm text-gray-500 font-medium">No assets found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-1 md:space-x-3">
          {/* Notifications */}
          <button
            onClick={onNotificationClick}
            className="relative p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all"
          >
            <Icon name="Bell" size={20} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white shadow-sm"></span>
          </button>

          {/* User Profile */}
          <div className="relative pl-1 md:pl-3 border-l border-gray-100">
            <button
              onClick={toggleProfile}
              className="flex items-center space-x-2 group p-1 rounded-xl hover:bg-gray-50 transition-all"
            >
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-md shadow-blue-500/20">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-[12px] font-bold text-gray-900 leading-tight">
                  {user?.full_name || 'User'}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  {user?.role === 'system_admin' ? 'System Admin' : user?.role || 'IT Staff'}
                </div>
              </div>
              <Icon name="ChevronDown" size={14} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 bg-gray-50/50 border-b border-gray-100">
                  <div className="font-bold text-sm text-gray-900">
                    {user?.full_name || 'User Name'}
                  </div>
                  <div className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                    {user?.email || 'user@panasonic.com'}
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => handleProfileAction('profile')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center space-x-3 transition-colors group"
                  >
                    <Icon name="User" size={16} className="text-gray-400 group-hover:text-blue-500" />
                    <span className="font-medium">Profile Settings</span>
                  </button>
                  <button
                    onClick={() => handleProfileAction('preferences')}
                    className="w-full px-3 py-2 text-left text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg flex items-center space-x-3 transition-colors group"
                  >
                    <Icon name="Settings" size={16} className="text-gray-400 group-hover:text-blue-500" />
                    <span className="font-medium">Preferences</span>
                  </button>
                  <div className="h-px bg-gray-100 my-1 mx-2" />
                  <button
                    onClick={() => handleProfileAction('logout')}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-3 transition-colors group"
                  >
                    <Icon name="LogOut" size={16} className="text-red-400 group-hover:text-red-600" />
                    <span className="font-bold">Sign Out</span>
                  </button>
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