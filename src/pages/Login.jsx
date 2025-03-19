import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuthStore } from '../stores/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, setUser, fetchUserProfile, saveStaffProfile } = useAuthStore();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setVerificationMessage('');
    setLoading(true);

    try {
      // Sign in the user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if email is verified
      if (!user.emailVerified) {
        // Send a new verification email
        await sendEmailVerification(user);
        
        // Set verification message
        setVerificationMessage('Your email is not verified. A new verification email has been sent. Please check your inbox and verify your email before logging in.');
        
        // Update emailVerified status in appropriate collection
        // The user could be in either staff or managers collection, so we'll use fetchUserProfile first
        const userProfile = await fetchUserProfile(user.uid);
        
        if (userProfile) {
          // Update existing profile with last login attempt
          if (userProfile.role === 'staff') {
            await saveStaffProfile(user.uid, {
              emailVerified: false,
              lastLoginAttempt: new Date().toISOString()
            });
          }
        }
        
        setLoading(false);
        return;
      }
      
      // Fetch user profile to get role information
      const userProfile = await fetchUserProfile(user.uid);
      
      // If user doesn't have a profile in either collection
      if (!userProfile) {
        setError('Account not found in the system. Please contact your administrator.');
        setLoading(false);
        return;
      }
      
      // User profile exists and email is verified, update appropriate collection
      if (userProfile.role === 'staff') {
        await saveStaffProfile(user.uid, {
          emailVerified: true,
          lastLogin: new Date().toISOString()
        });
      }
      
      // Set user in global state
      setUser(user);
      
      // Navigate to the intended destination
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.code === 'auth/invalid-credential' 
          ? 'Invalid email or password' 
          : err.code === 'auth/user-disabled'
          ? 'This account has been disabled'
          : 'An error occurred during login'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4 font-[Inter]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
          <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              duration: 1 
            }}
            className="w-24 h-24 mx-auto mb-6 relative group"
          >
            <div className="w-full h-full bg-gradient-to-tr from-red-600 to-red-500 rounded-2xl shadow-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500">
              <span className="text-5xl font-black text-white font-[Inter] tracking-tighter transform -rotate-12 group-hover:rotate-0 transition-transform duration-500" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.1)' }}>
                M
              </span>
              <div className="absolute inset-0 bg-black/10 rounded-2xl group-hover:bg-black/0 transition-colors duration-500" />
            </div>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold text-gray-900 tracking-tight"
          >
              Welcome Back
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-600 mt-3 text-lg"
          >
              Sign in to Monisha Inventory Management System
          </motion.p>
          </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white p-8 rounded-2xl shadow-xl backdrop-blur-sm backdrop-filter bg-opacity-80"
        >
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-500 p-4 rounded-xl text-sm flex items-center font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </motion.div>
            )}
            
            {verificationMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 text-yellow-700 p-4 rounded-xl text-sm flex items-start font-medium"
              >
                <svg
                  className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{verificationMessage}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="mt-1 relative group">
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-800 text-base"
                  placeholder="Enter your email"
                required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="mt-1 relative group">
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ease-in-out text-gray-800 text-base"
                  placeholder="Enter your password"
                required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg
                    className="h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded-md transition-colors duration-200"
                />
                <label className="ml-2 block text-sm text-gray-700">Remember me</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-semibold text-red-600 hover:text-red-500 transition-colors duration-200">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl text-base font-semibold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transform transition-all duration-300 ease-in-out hover:scale-[1.02] ${
                loading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-base">
                <span className="px-4 bg-white text-gray-500">Don't have an account?</span>
              </div>
            </div>

            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/signup')}
                className="w-full flex justify-center py-3.5 px-4 border-2 border-red-600 rounded-xl text-base font-semibold text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-300"
              >
                Create an account
              </motion.button>
          </div>
        </div>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-sm text-gray-600"
        >
          By signing in, you agree to our{' '}
          <a href="#" className="font-semibold text-red-600 hover:text-red-500 transition-colors duration-200">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="font-semibold text-red-600 hover:text-red-500 transition-colors duration-200">
            Privacy Policy
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login; 