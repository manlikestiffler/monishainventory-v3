import React from 'react';
import PropTypes from 'prop-types';

const Select = ({ value, onChange, options = [], placeholder, required, children }) => {
  // If options array is provided, use it to generate options
  if (options && options.length > 0) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
  
  // If children are provided directly (like <option> elements), use those
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
      required={required}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
};

Select.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  children: PropTypes.node
};

export default Select; 