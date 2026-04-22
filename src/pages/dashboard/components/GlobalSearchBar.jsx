import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const GlobalSearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setTimeout(() => {
        navigate(`/assets/${query}`);
        setSearchQuery('');
      }, 0);
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
            className="pl-10 pr-4 h-12 text-base bg-background border-border focus:border-primary"
          />
          <Icon
            name="Search"
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </form>
    </div>
  );
};


export default GlobalSearchBar;