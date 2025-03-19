import { useState, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, getDocs, query, where, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuthStore } from '../../stores/authStore';
import { FiUser, FiUserCheck, FiKey, FiMail, FiCalendar, FiShield, FiLock, FiTag, FiClock, FiCheck, FiX } from 'react-icons/fi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const { isManager, user: currentUser, getAllStaff, getAllManagers, saveStaffProfile, saveManagerProfile } = useAuthStore();

  // Fetch all users from both collections
  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        setLoading(true);
        
        // Fetch staff from the staff collection
        const staffData = await getAllStaff();
        
        // Fetch managers from the managers collection
        const managersData = await getAllManagers();
        
        // Combine both collections
        const allUsers = [...staffData, ...managersData];
        
        // Filter out users with pending manager requests
        const regularUsers = allUsers.filter(user => !user.pendingManagerRequest);
        const requests = allUsers.filter(user => user.pendingManagerRequest);
        
        setUsers(regularUsers);
        setPendingRequests(requests);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
        setLoading(false);
      }
    };

    fetchAllUsers();
  }, [getAllStaff, getAllManagers]);

  // Handle promoting user to manager
  const handlePromoteToManager = async (userId) => {
    if (!isManager()) {
      setError('Only managers can change user roles');
      return;
    }

    try {
      // Get the user profile first to preserve data
      const userToPromote = users.find(user => user.id === userId);
      
      if (!userToPromote) {
        setError('User not found');
        return;
      }
      
      // Add to managers collection
      await saveManagerProfile(userId, {
        ...userToPromote,
        role: 'manager',
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
        pendingManagerRequest: false // Clear the pending flag
      });
      
      // Remove from staff collection
      const staffRef = doc(db, 'staff', userId);
      await deleteDoc(staffRef);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: 'manager', updatedAt: new Date().toISOString() } 
          : user
      ));

      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  // Handle approving a pending manager request
  const handleApproveRequest = async (userId) => {
    if (!isManager()) {
      setError('Only managers can approve requests');
      return;
    }

    try {
      // Get the user data
      const userRequest = pendingRequests.find(user => user.id === userId);
      
      if (!userRequest) {
        setError('Request not found');
        return;
      }
      
      // Add the user to managers collection
      await saveManagerProfile(userId, {
        ...userRequest,
        role: 'manager',
        pendingManagerRequest: false,
        requestApprovedAt: new Date().toISOString(),
        requestApprovedBy: currentUser.uid
      });
      
      // Remove from staff collection
      const staffRef = doc(db, 'staff', userId);
      await deleteDoc(staffRef);
      
      // Update local state
      const updatedRequests = pendingRequests.filter(req => req.id !== userId);
      setPendingRequests(updatedRequests);
      
      // Add to users list with manager role
      setUsers([...users, { ...userRequest, role: 'manager' }]);
    } catch (err) {
      console.error('Error approving request:', err);
      setError('Failed to approve request');
    }
  };

  // Handle rejecting a pending manager request
  const handleRejectRequest = async (userId) => {
    if (!isManager()) {
      setError('Only managers can reject requests');
      return;
    }

    try {
      // Get the user data
      const userRequest = pendingRequests.find(user => user.id === userId);
      
      if (!userRequest) {
        setError('Request not found');
        return;
      }
      
      // Update the user in staff collection to remove the pending flag
      const staffRef = doc(db, 'staff', userId);
      await updateDoc(staffRef, { 
        pendingManagerRequest: false,
        requestRejectedAt: new Date().toISOString(),
        requestRejectedBy: currentUser.uid
      });
      
      // Update local state
      const updatedRequests = pendingRequests.filter(req => req.id !== userId);
      setPendingRequests(updatedRequests);
      
      // Add to regular users list as staff
      setUsers([...users, { ...userRequest, pendingManagerRequest: false, role: 'staff' }]);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('Failed to reject request');
    }
  };

  // Handle demoting manager to staff
  const handleDemoteToStaff = async (userId) => {
    if (!isManager()) {
      setError('Only managers can change user roles');
      return;
    }

    try {
      // Get the user profile first to preserve data
      const userToDemote = users.find(user => user.id === userId);
      
      if (!userToDemote) {
        setError('User not found');
        return;
      }
      
      // Add to staff collection
      await saveStaffProfile(userId, {
        ...userToDemote,
        role: 'staff',
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      });
      
      // Remove from managers collection
      const managerRef = doc(db, 'managers', userId);
      await deleteDoc(managerRef);
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: 'staff', updatedAt: new Date().toISOString() } 
          : user
      ));

      setShowModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Clear existing likeproducts and batches
  const handleClearDatabase = async () => {
    if (!isManager()) {
      setError('Only managers can perform this action');
      return;
    }

    try {
      setLoading(true);
      
      // Clear likeproducts
      const likeproductsSnapshot = await getDocs(collection(db, 'likeproducts'));
      for (const doc of likeproductsSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      // Clear batches
      const batchesSnapshot = await getDocs(collection(db, 'batches'));
      for (const doc of batchesSnapshot.docs) {
        await deleteDoc(doc.ref);
      }
      
      setLoading(false);
      
      // Show success message
      alert('Successfully cleared likeproducts and batches from the database');
    } catch (err) {
      console.error('Error clearing database:', err);
      setError('Failed to clear database');
      setLoading(false);
    }
  };

  if (!isManager()) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 max-w-md">
          <div className="bg-red-100 text-red-600 p-4 rounded-lg mb-4 inline-flex items-center">
            <FiLock className="w-6 h-6 mr-2" />
            <span>Access Denied</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Restricted Area</h1>
          <p className="text-gray-600">
            You don't have permission to access this area. This section is only available to managers.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FiUserCheck className="mr-2 text-red-500" />
          User Management
        </h1>
        <p className="text-gray-600">Manage users and their roles</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6">
          {error}
        </div>
      )}

      {/* Database Clear Button */}
      <div className="mb-6">
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to clear likeproducts and batches from the database? This action cannot be undone.')) {
              handleClearDatabase();
            }
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
        >
          <FiX className="mr-2" />
          Clear LikeProducts and Batches
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'requests'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Manager Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Source
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName || user.email} className="h-10 w-10 rounded-full" />
                        ) : (
                          <FiUser className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.displayName || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created: {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center">
                      <FiMail className="mr-2 text-gray-400" />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'manager' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      <FiShield className="mr-1" />
                      {user.role || 'staff'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.emailVerified 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.emailVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiCalendar className="mr-2 text-gray-400" />
                      {formatDate(user.lastLogin)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <FiTag className="mr-2 text-gray-400" />
                      {user.appSource || 'inventory-app'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {currentUser?.uid !== user.id && (
                      user.role === 'manager' ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors"
                        >
                          Demote to Staff
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          Promote to Manager
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Manager Requests Table */}
      {activeTab === 'requests' && (
        <div className="overflow-x-auto">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FiClock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-xl font-medium text-gray-900">No Pending Requests</h3>
              <p className="mt-1 text-gray-500">There are no pending manager requests at this time.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          {request.photoURL ? (
                            <img src={request.photoURL} alt={request.displayName || request.email} className="h-10 w-10 rounded-full" />
                          ) : (
                            <FiUser className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {request.displayName || 'No name'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Created: {formatDate(request.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiMail className="mr-2 text-gray-400" />
                        {request.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <FiClock className="mr-2 text-gray-400" />
                        {formatDate(request.requestDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Pending Approval
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleApproveRequest(request.id)}
                          className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md hover:bg-green-100 transition-colors flex items-center"
                        >
                          <FiCheck className="mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md hover:bg-red-100 transition-colors flex items-center"
                        >
                          <FiX className="mr-1" />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Role Change</h3>
            <p className="mb-6">
              Are you sure you want to {selectedUser.role === 'manager' ? 'demote' : 'promote'} 
              <span className="font-semibold"> {selectedUser.email}</span> 
              {selectedUser.role === 'manager' 
                ? ' from manager to staff?' 
                : ' from staff to manager?'
              }
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => 
                  selectedUser.role === 'manager'
                    ? handleDemoteToStaff(selectedUser.id)
                    : handlePromoteToManager(selectedUser.id)
                }
                className={`px-4 py-2 rounded-lg text-white ${
                  selectedUser.role === 'manager'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement; 