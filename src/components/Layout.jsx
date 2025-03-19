import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import Logo from './ui/Logo';
import MobileMenu from './navigation/MobileMenu';
import {
  DashboardIcon,
  InventoryIcon,
  ManufacturingIcon,
  OrdersIcon,
  SchoolsIcon,
  ReportsIcon,
  NotificationIcon,
  MenuIcon
} from './icons';
import { FiUsers, FiUser, FiSettings, FiLogOut, FiTrash2, FiShield, FiChevronDown } from 'react-icons/fi';

const Layout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isManager, userProfile, userRole, deleteAccount } = useAuthStore();

  // Get user's full name
  const getUserFullName = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }
    
    return 'User';
  };

  // Get initials from user information
  const getUserInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    
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

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/inventory', label: 'Inventory', icon: <InventoryIcon /> },
    { path: '/batches', label: 'Batch Inventory', icon: <ManufacturingIcon /> },
    { path: '/orders', label: 'Orders', icon: <OrdersIcon /> },
    { path: '/schools', label: 'Schools', icon: <SchoolsIcon /> },
    { path: '/reports', label: 'Reports', icon: <ReportsIcon /> },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsProfileOpen(false);
  };

  const handleDeleteAccount = () => {
    // This will be implemented in the authStore
    // For now just toggle the confirmation dialog
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = async () => {
    try {
      await deleteAccount();
      // Wait a moment to show the modal with confirmation before redirecting
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.message}`);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
          isScrolled ? 'bg-white shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <Link to="/dashboard" className="flex items-center">
                <Logo size="sm" />
                <span className="ml-2 text-xl font-bold text-brand-600 hidden sm:inline-block">
                  Monisha
                  <span className="text-gray-500 font-medium">IMS</span>
                </span>
              </Link>

              <div className="hidden md:ml-10 md:flex md:space-x-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      location.pathname.startsWith(link.path)
                        ? 'text-brand-600 bg-brand-50'
                        : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
                    }`}
                  >
                    {link.icon}
                    <span className="ml-2">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-4">
              <button className="p-1 rounded-full text-gray-400 hover:text-brand-600 focus:outline-none">
                <span className="sr-only">View notifications</span>
                <NotificationIcon />
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-sm focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center overflow-hidden">
                    {userProfile?.photoURL ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt="Profile" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                    <span className="text-brand-700 font-medium">
                        {getUserInitials()}
                    </span>
                    )}
                  </div>
                  <FiChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100"
                    >
                      {/* User Info Section */}
                      <div className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {getUserFullName()}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user?.email}
                        </p>
                        <div className="mt-2 flex items-center text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded-full ${
                            userRole === 'manager' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            <FiShield className="inline-block mr-1" />
                            {userRole === 'manager' ? 'Manager' : 'Staff'}
                          </span>
                          {userProfile?.emailVerified && (
                            <span className="ml-2 px-2 py-1 rounded-full bg-green-100 text-green-800">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions Section */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiUser className="mr-3 h-4 w-4" />
                          View Profile
                        </Link>
                        {isManager() && (
                          <Link
                            to="/users"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <FiUsers className="mr-3 h-4 w-4" />
                            User Management
                          </Link>
                        )}
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <FiSettings className="mr-3 h-4 w-4" />
                          Account Settings
                        </Link>
                      </div>
                      
                      {/* Logout and Delete Section */}
                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-600"
                        >
                          <FiLogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <FiTrash2 className="mr-3 h-4 w-4" />
                          Delete Account
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-brand-600 hover:bg-brand-50 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <span className="sr-only">Open menu</span>
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
        navLinks={navLinks}
        isManager={isManager()}
      />

      {/* Main content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Account</h2>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout; 