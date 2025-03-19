import { useState, useCallback, useEffect } from 'react';
import ModernSelect from '../ui/ModernSelect';

// Custom debounce function implementation
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const AdvancedFilterSystem = ({
  filters,
  onFilterChange,
  onSearch,
  activeFilters,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [animateHeight, setAnimateHeight] = useState(false);

  // Handle animation on mount
  useEffect(() => {
    if (isExpanded) {
      setAnimateHeight(true);
    } else {
      const timer = setTimeout(() => {
        setAnimateHeight(false);
      }, 200); // match the CSS transition time
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const debouncedSearch = useCallback(
    debounce((term) => {
      onSearch(term);
    }, 300),
    [onSearch]
  );

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    debouncedSearch(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          Advanced Filters
        </button>
      </div>

      {isExpanded && (
        <div 
          className={`overflow-hidden transition-all duration-200 ease-in-out ${animateHeight ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {filters.map((filter) => (
              <div key={filter.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {filter.label}
                </label>
                <ModernSelect
                  value={activeFilters[filter.id]}
                  onChange={(e) => onFilterChange(filter.id, e.target.value)}
                  options={filter.options}
                  placeholder={`Select ${filter.label}`}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(activeFilters).length > 0 && (
        <div
          className="flex items-center justify-between p-4 bg-indigo-50 rounded-lg"
          style={{ animation: 'fadeIn 0.2s ease-in-out' }}
        >
          <div className="flex flex-wrap gap-2">
            {Object.entries(activeFilters).map(([key, value]) => (
              <span
                key={key}
                className="px-3 py-1 bg-white rounded-full text-sm font-medium text-indigo-600"
              >
                {filters.find(f => f.id === key)?.label}: {value}
              </span>
            ))}
          </div>
          <button
            onClick={onClearFilters}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Clear All
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default AdvancedFilterSystem; 