import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const GlobalSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const debounceTimeout = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef?.current && !searchRef?.current?.contains(event?.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query) => {
    if (query.length > 2) {
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
    }, 300); // 300ms debounce delay
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setTimeout(() => {
        navigate(`/assets/${query}`);
        setShowSuggestions(false);
        setSearchQuery('');
      }, 0);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'asset' && (suggestion.asset_tag || suggestion.id)) {
      navigate(`/assets/${suggestion.asset_tag || suggestion.id}`);
    } else if (suggestion.path) {
      navigate(suggestion.path);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case 'asset':
        return 'Package';
      case 'employee':
        return 'User';
      case 'department':
        return 'Building';
      case 'supplier':
        return 'Truck';
      default:
        return 'Search';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Input
            type="search"
            placeholder="Search for assets, employees, suppliers..."
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery?.length > 2 && setShowSuggestions(true)}
            className="pl-10 pr-4 h-12 text-base bg-background border-border focus:border-primary"
          />
          <Icon
            name="Search"
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-muted border-t-primary"></div>
            </div>
          )}
        </div>
      </form>
      {/* Search Suggestions Dropdown */}
      {showSuggestions && suggestions?.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-modal z-200 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-muted-foreground px-3 py-2 border-b border-border">
              Search Results
            </div>
            {suggestions?.map((suggestion) => (
              <button
                key={suggestion?.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center space-x-3 px-3 py-3 text-left hover:bg-muted rounded-lg transition-colors"
              >
                <Icon 
                  name={getSuggestionIcon(suggestion?.type)} 
                  size={16} 
                  className="text-muted-foreground flex-shrink-0" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {suggestion?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {suggestion?.description}
                  </p>
                </div>
                <Icon name="ArrowRight" size={14} className="text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
      {/* No Results */}
      {showSuggestions && suggestions?.length === 0 && searchQuery?.length > 2 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-modal z-200">
          <div className="p-4 text-center">
            <Icon name="Search" size={24} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No results found for "{searchQuery}"</p>
          </div>
        </div>
      )}
    </div>
  );
};


export default GlobalSearchBar;