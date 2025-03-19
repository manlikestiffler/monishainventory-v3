import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserManagement from '../components/users/UserManagement';
import { FiArrowLeft, FiUsers } from 'react-icons/fi';

const UsersPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center">
              <FiUsers className="mr-3 text-red-500" />
              User Management
            </h1>
            <p className="mt-1 text-gray-500 font-light">Manage staff and manager accounts for your inventory system</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <UserManagement />
    </div>
  );
};

export default UsersPage; 