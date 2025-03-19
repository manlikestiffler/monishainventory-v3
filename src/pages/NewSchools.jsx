import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSchoolStore } from '../stores/schoolStore';
import Button from '../components/ui/Button';
import { FiPlus, FiSearch, FiSliders, FiGrid, FiList, FiFilter } from 'react-icons/fi';
import SchoolModal from '../components/schools/SchoolModal';

const NewSchools = () => {
  const { schools, fetchSchools, addSchool, deleteSchool } = useSchoolStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    showActive: true,
    showInactive: true,
  });
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const loadSchools = async () => {
      try {
        setLoading(true);
        await fetchSchools();
      } catch (err) {
        console.error('Error fetching schools:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadSchools();
  }, [fetchSchools]);

  const handleAddSchool = async (schoolData) => {
    try {
      await addSchool(schoolData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding school:', error);
      throw error;
    }
  };

  const handleDeleteSchool = async (id) => {
    if (window.confirm('Are you sure you want to delete this school?')) {
      try {
        await deleteSchool(id);
      } catch (error) {
        console.error('Error deleting school:', error);
      }
    }
  };

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          school.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = (filterOptions.showActive && school.status !== 'inactive') ||
                          (filterOptions.showInactive && school.status === 'inactive');
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading schools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 m-4 bg-white border border-red-200 rounded-xl shadow-lg">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-red-50">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="mb-2 text-xl font-bold text-center text-gray-900">Error loading schools</h2>
        <p className="mb-6 text-center text-red-600">{error}</p>
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            onClick={() => fetchSchools()}
            className="px-6 py-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Schools</h1>
          <p className="mt-1 text-gray-500 font-light">Manage all schools and their uniform requirements</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-md"
        >
          <FiPlus className="h-5 w-5" />
          Add School
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Search schools by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r pr-3 border-gray-200">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                title="Grid view"
              >
                <FiGrid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
                title="List view"
              >
                <FiList className="h-5 w-5" />
              </button>
            </div>
            <div className="relative group">
              <button
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 flex items-center gap-2"
              >
                <FiFilter className="h-5 w-5" />
                <span className="hidden md:inline">Filters</span>
              </button>
              <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 hidden group-hover:block">
                <div className="mb-3">
                  <div className="flex items-center mb-2">
                    <input
                      id="active"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={filterOptions.showActive}
                      onChange={() => setFilterOptions(prev => ({ ...prev, showActive: !prev.showActive }))}
                    />
                    <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                      Active Schools
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="inactive"
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      checked={filterOptions.showInactive}
                      onChange={() => setFilterOptions(prev => ({ ...prev, showInactive: !prev.showInactive }))}
                    />
                    <label htmlFor="inactive" className="ml-2 block text-sm text-gray-700">
                      Inactive Schools
                    </label>
                  </div>
                </div>
                <button
                  className="w-full text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterOptions({ showActive: true, showInactive: true });
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schools Grid/List */}
      {filteredSchools.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-100">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No schools found</h2>
          <p className="text-gray-500 mb-6">
            {searchTerm || !filterOptions.showActive || !filterOptions.showInactive
              ? "Try adjusting your search or filters"
              : "Add a new school to get started"}
          </p>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700"
          >
            Add School
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((school) => (
            <div
              key={school.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100 transform hover:-translate-y-1"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{school.name}</h2>
                    <p className="mt-1 text-sm text-gray-500 font-light">{school.address}</p>
                  </div>
                  {school.status === 'inactive' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </div>
                
                <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs mb-1">Contact</p>
                    <p className="font-medium text-gray-800">{school.contact || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-500 text-xs mb-1">Students</p>
                    <p className="font-medium text-gray-800">{school.students?.length || 0}</p>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
                  <Link
                    to={`/schools/${school.id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    View Details
                  </Link>
                  <Button
                    variant="text"
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg px-3 py-2"
                    onClick={() => handleDeleteSchool(school.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSchools.map((school) => (
                <tr key={school.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{school.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{school.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{school.contact || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{school.students?.length || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {school.status === 'inactive' ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link
                        to={`/schools/${school.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Details
                      </Link>
                      <button
                        onClick={() => handleDeleteSchool(school.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add School Modal */}
      <SchoolModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddSchool}
      />
    </div>
  );
};

export default NewSchools; 