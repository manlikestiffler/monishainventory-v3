import { useState } from 'react';

const AddableSelect = ({
  label,
  value,
  onChange,
  options,
  onAddNew,
  placeholder = 'Select an option',
  addNewPlaceholder = 'Enter new value',
  required = false
}) => {
  const [showNewInput, setShowNewInput] = useState(false);
  const [newValue, setNewValue] = useState('');

  const handleAddNew = async () => {
    if (!newValue.trim()) return;
    await onAddNew(newValue.trim());
    setNewValue('');
    setShowNewInput(false);
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
      {!showNewInput ? (
        <div className="flex gap-3">
          <div className="flex-1">
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
              required={required}
            >
              <option value="">{placeholder}</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => setShowNewInput(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={addNewPlaceholder}
              className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
            />
          </div>
          <button
            type="button"
            onClick={handleAddNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setShowNewInput(false)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default AddableSelect; 