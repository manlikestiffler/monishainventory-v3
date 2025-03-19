import React from 'react';
import { FiShoppingBag, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

const UniformCard = ({ uniform, onEdit, onDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{uniform.name}</h3>
          <div className="flex space-x-1">
            <button 
              onClick={() => onEdit(uniform)} 
              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onDelete(uniform.id)} 
              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 flex-grow">
          <p>Category: <span className="font-medium">{uniform.category}</span></p>
          <p>Level: <span className="font-medium">{uniform.level}</span></p>
          <p>Gender: <span className="font-medium">{uniform.gender}</span></p>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-gray-700">
              Qty per student: 
              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full">
                {uniform.quantity || 1}
              </span>
            </span>
          </div>
          
          {uniform.required !== false ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <FiCheck className="w-3 h-3 mr-1" /> Required
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              <FiX className="w-3 h-3 mr-1" /> Optional
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ModernUniformRequirements = ({ uniforms = [], onEdit, onDelete }) => {
  // Group uniforms by category
  const uniformsByCategory = uniforms.reduce((acc, uniform) => {
    const category = uniform.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(uniform);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-red-50 to-red-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <FiShoppingBag className="mr-2 text-red-600" />
          Uniform Requirements
        </h2>
        <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
          {uniforms.length} {uniforms.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      
      {uniforms.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No uniform requirements added yet</p>
          <p className="text-sm text-gray-400">Click the "Add Uniform" button to get started</p>
        </div>
      ) : (
        <div className="p-6">
          {Object.entries(uniformsByCategory).map(([category, categoryUniforms]) => (
            <div key={category} className="mb-8 last:mb-0">
              <h3 className="text-md font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-200">
                {category}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryUniforms.map((uniform) => (
                  <UniformCard 
                    key={uniform.id} 
                    uniform={uniform} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModernUniformRequirements; 