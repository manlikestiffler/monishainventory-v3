import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiShield, FiCalendar, FiEdit2, FiPhone, FiCreditCard, FiUpload } from 'react-icons/fi';
import { useAuthStore } from '../stores/authStore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth } from '../config/firebase';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, userProfile, userRole, saveStaffProfile, saveManagerProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || '',
    photoURL: userProfile?.photoURL || '',
    phoneNumber: userProfile?.phoneNumber || '',
    nationalId: userProfile?.nationalId || '',
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userProfile?.displayName) {
      return userProfile.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    
    return 'U';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadProgress(0);
      setLoading(true);
      setMessage({ type: 'info', text: 'Uploading profile picture...' });

      // Create a reference to the storage location
      const storage = getStorage();
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${file.name}`);
      
      // Upload the file
      const uploadTask = uploadBytes(storageRef, file);
      
      // Wait for upload to complete
      await uploadTask;
      setUploadProgress(100);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update form data with the new URL
      setFormData(prev => ({
        ...prev,
        photoURL: downloadURL
      }));
      
      setMessage({ type: 'success', text: 'Profile picture uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage({ type: 'error', text: 'Failed to upload profile picture. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        ...formData,
        updatedAt: new Date().toISOString(),
      };

      if (userRole === 'manager') {
        await saveManagerProfile(user.uid, updateData);
      } else {
        await saveStaffProfile(user.uid, updateData);
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

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
              <FiUser className="mr-3 text-red-500" />
              Profile
            </h1>
            <p className="mt-1 text-gray-500 font-light">View and manage your profile information</p>
          </div>
        </div>
        <div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiEdit2 className="mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 md:p-8">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 
              message.type === 'error' ? 'bg-red-50 text-red-800' :
              'bg-blue-50 text-blue-800'
            }`}>
              {message.text}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-start gap-8">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="h-32 w-32 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden mb-4 relative group">
                {userProfile?.photoURL ? (
                  <img 
                    src={userProfile.photoURL} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-brand-700 font-bold text-4xl">
                    {getUserInitials()}
                  </span>
                )}
                {isEditing && (
                  <div 
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={triggerFileInput}
                  >
                    <FiUpload className="text-white text-xl" />
                  </div>
                )}
              </div>
              {isEditing && (
                <>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept="image/*"
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="text-sm text-red-600 hover:text-red-700 mb-4"
                  >
                    Change Photo
                  </button>
                </>
              )}
              <div className={`px-3 py-1 rounded-full ${
                userRole === 'manager' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                <FiShield className="inline-block mr-1" />
                {userRole === 'manager' ? 'Manager' : 'Staff'}
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Your last name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Your display name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiPhone className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      National ID Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <FiCreditCard className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleInputChange}
                        className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        placeholder="Your national ID number"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{userProfile?.displayName || 'User'}</h2>
                    <div className="flex items-center mt-2">
                      <FiMail className="text-gray-500 mr-2" />
                      <span className="text-gray-600">{user?.email}</span>
                    </div>
                    
                    {userProfile?.phoneNumber && (
                      <div className="flex items-center mt-2">
                        <FiPhone className="text-gray-500 mr-2" />
                        <span className="text-gray-600">{userProfile.phoneNumber}</span>
                      </div>
                    )}
                    
                    {userProfile?.nationalId && (
                      <div className="flex items-center mt-2">
                        <FiCreditCard className="text-gray-500 mr-2" />
                        <span className="text-gray-600">ID: {userProfile.nationalId}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">Email Status</div>
                        <div className="mt-1 flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            userProfile?.emailVerified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {userProfile?.emailVerified ? 'Verified' : 'Not Verified'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">Full Name</div>
                        <div className="mt-1 text-gray-900">
                          {userProfile?.firstName && userProfile?.lastName 
                            ? `${userProfile.firstName} ${userProfile.lastName}`
                            : 'Not specified'}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">Account Created</div>
                        <div className="mt-1 text-gray-900">
                          <FiCalendar className="inline mr-1" />
                          {formatDate(userProfile?.createdAt)}
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm font-medium text-gray-500">Last Login</div>
                        <div className="mt-1 text-gray-900">
                          <FiCalendar className="inline mr-1" />
                          {formatDate(userProfile?.lastLogin)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 