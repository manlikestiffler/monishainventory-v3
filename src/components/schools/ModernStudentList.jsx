import React from 'react';
import { FiUsers, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const ModernStudentList = ({ students = [], onEdit, onDelete }) => {
  // Helper function to get uniform details
  const getUniformSummary = (student) => {
    if (!student.uniformQuantities) return 'No custom quantities';
    
    const quantityKeys = Object.keys(student.uniformQuantities);
    if (quantityKeys.length === 0) return 'No custom quantities';
    
    const customItems = quantityKeys.length;
    const totalQuantity = Object.values(student.uniformQuantities).reduce((sum, qty) => sum + qty, 0);
    
    return `${customItems} items, total: ${totalQuantity}`;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-red-50 to-red-100">
        <h2 className="text-lg font-bold text-gray-900 flex items-center">
          <FiUsers className="mr-2 text-red-600" />
          Students
        </h2>
        <span className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
          {students.length} {students.length === 1 ? 'student' : 'students'}
        </span>
      </div>
      
      {students.length === 0 ? (
        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiUsers className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">No students added yet</p>
          <p className="text-sm text-gray-400">Click the "Add Student" button to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uniform Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantities
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-red-100 text-red-800">
                      {student.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-medium rounded-full ${
                      student.gender === 'MALE' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                    }`}>
                      {student.gender === 'MALE' ? 'Male' : 'Female'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{getUniformSummary(student)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {Object.keys(student.uniformQuantities || {}).length > 0 ? (
                        <span className="text-green-600 font-medium">Custom</span>
                      ) : (
                        <span className="text-gray-500">Default</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => onEdit(student)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <FiEdit2 className="w-4 h-4 mr-1" /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(student.id)}
                        className="text-red-600 hover:text-red-900 flex items-center"
                      >
                        <FiTrash2 className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ModernStudentList; 