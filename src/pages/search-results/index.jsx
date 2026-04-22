import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { supabase } from '../../lib/supabaseClient';
import { NotificationContainer } from '../../components/ui/NotificationToast';
import { LoadingSpinner } from '../../components/ui/LoadingState';
import Button from '../../components/ui/Button';
import SearchHeader from './components/SearchHeader';
import FilterSidebar from './components/FilterSidebar';
import SearchResultItem from './components/SearchResultItem';
import SortControls from './components/SortControls';
import SearchHistory from './components/SearchHistory';
import EmptySearchState from './components/EmptySearchState';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');

  // Search state
  const searchQuery = searchParams?.get('q') || '';
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filters, setFilters] = useState({
    categories: [],
    statuses: [],
    locations: [],
    dateRange: ''
  });

  // Get actual user from Redux store
  const { user } = useSelector((state) => state.auth);

  const suggestions = ["laptop", "desktop computer", "printer", "monitor", "tablet"];

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery) {
        setSearchResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('global_search', {
          search_term: searchQuery
        });

        if (error) throw error;
        
        setSearchResults(data || []);
      } catch (error) {
        addNotification(`Error fetching search results: ${error.message}`, 'error');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchQuery]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev?.filter((notif) => notif?.id !== id));
  };

  const handleFilterChange = (filterType, value, checked) => {
    setFilters((prev) => {
      if (filterType === 'dateRange') {
        return { ...prev, [filterType]: value };
      }

      const currentValues = prev?.[filterType] || [];
      if (checked) {
        return { ...prev, [filterType]: [...currentValues, value] };
      } else {
        return { ...prev, [filterType]: currentValues?.filter((v) => v !== value) };
      }
    });
  };

  const handleClearFilters = () => {
    setFilters({
      categories: [],
      statuses: [],
      locations: [],
      dateRange: ''
    });
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleOrderChange = () => {
    setSortOrder((prev) => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleAddToFavorites = (assetId) => {
    addNotification('Asset added to favorites', 'success');
  };

  const handleExport = () => {
    addNotification('Search results exported successfully', 'success');
  };

  const handleClearSearch = () => {
    navigate('/search-results');
  };

  const handleSaveSearch = () => {
    addNotification('Search saved successfully', 'success');
  };

  const handleSelectSearch = (query) => {
    navigate(`/search-results?q=${encodeURIComponent(query)}`);
  };

  const handleDeleteSearch = (index) => {
    addNotification('Search removed from history', 'info');
  };

  const handleDeleteSavedSearch = (index) => {
    addNotification('Saved search deleted', 'info');
  };

  const handleBrowseAssets = () => {
    navigate('/asset-list');
  };

  // Filter and sort results
  const filteredResults = searchResults?.filter((asset) => {
    if (filters?.categories?.length > 0 && !filters?.categories?.includes(asset?.category)) {
      return false;
    }
    if (filters?.statuses?.length > 0 && !filters?.statuses?.includes(asset?.status)) {
      return false;
    }
    if (filters?.locations?.length > 0 && !filters?.locations?.some((loc) => asset?.location?.includes(loc))) {
      return false;
    }
    return true;
  });

  const sortedResults = [...filteredResults]?.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a?.product_name?.toLowerCase();
        bValue = b?.product_name?.toLowerCase();
        break;
      case 'dateAdded':
        aValue = new Date(a.date_added);
        bValue = new Date(b.date_added);
        break;
      case 'category':
        aValue = a?.category?.toLowerCase();
        bValue = b?.category?.toLowerCase();
        break;
      case 'status':
        aValue = a?.status?.toLowerCase();
        bValue = b?.status?.toLowerCase();
        break;
      case 'location':
        aValue = a?.location?.toLowerCase();
        bValue = b?.location?.toLowerCase();
        break;
      case 'relevance':
      default:
        aValue = a?.relevance_score;
        bValue = b?.relevance_score;
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-muted-foreground">Searching assets...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SearchHeader
        searchQuery={searchQuery}
        resultCount={sortedResults?.length}
        onClearSearch={handleClearSearch}
        onSaveSearch={handleSaveSearch}
        suggestions={searchQuery && sortedResults?.length === 0 ? suggestions : []}
      />

      <div className="flex">
        {/* Filter Sidebar */}
        <FilterSidebar
          isOpen={filterSidebarOpen}
          onClose={() => setFilterSidebarOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {searchQuery ? (
            <>
              {/* Mobile Filter Button */}
              <div className="lg:hidden p-4 border-b border-border">
                <Button
                  variant="outline"
                  iconName="Filter"
                  iconPosition="left"
                  onClick={() => setFilterSidebarOpen(true)}
                  className="w-full"
                >
                  Filters
                  {Object.values(filters)?.some((filter) =>
                    Array.isArray(filter) ? filter?.length > 0 : filter
                  ) && (
                    <span className="ml-2 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                      {Object.values(filters)?.reduce(
                        (count, filter) =>
                          count + (Array.isArray(filter) ? filter?.length : filter ? 1 : 0),
                        0
                      )}
                    </span>
                  )}
                </Button>
              </div>

              {sortedResults?.length > 0 ? (
                <>
                  {/* Sort Controls */}
                  <SortControls
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSortChange={handleSortChange}
                    onOrderChange={handleOrderChange}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    onExport={handleExport}
                  />

                  {/* Search Results */}
                  <div className="p-6">
                    <div
                      className={`space-y-4 ${
                        viewMode === 'grid'
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 space-y-0'
                          : ''
                      }`}
                    >
                      {sortedResults?.map((asset, index) => (
                        <SearchResultItem
                          key={asset?.result_id || index}
                          asset={asset}
                          searchQuery={searchQuery}
                          onAddToFavorites={handleAddToFavorites}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <EmptySearchState
                  searchQuery={searchQuery}
                  onClearSearch={handleClearSearch}
                  onBrowseAssets={handleBrowseAssets}
                  suggestions={suggestions}
                />
              )}
            </>
          ) : (
            /* Search History and Saved Searches (Placeholder) */
            <div className="p-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-foreground mb-2">Search Assets</h1>
                  <p className="text-muted-foreground">
                    Find assets by name, model, serial number, or category. Use the search bar above to get started.
                  </p>
                </div>

                {/* Quick Search Suggestions */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Popular Searches</h3>
                  <div className="flex flex-wrap gap-3">
                    {suggestions?.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSearch(suggestion)}
                        className="px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors text-sm font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </>
  );
};


export default SearchResults;