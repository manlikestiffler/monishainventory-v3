import { create } from 'zustand';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, query, where, deleteDoc, limit } from 'firebase/firestore';

export const useAuthStore = create((set, get) => ({
  user: null,
  userRole: null,
  userProfile: null,
  error: null,
  loading: false,
  isFirstUserRegistration: false,
  
  // Initialize by checking if this is the first user
  initializeFirstUserCheck: async () => {
    try {
      // Check if any managers exist
      const managersQuery = query(collection(db, 'managers'), limit(1));
      const managersSnapshot = await getDocs(managersQuery);
      
      // Check if any staff exist
      const staffQuery = query(collection(db, 'staff'), limit(1));
      const staffSnapshot = await getDocs(staffQuery);
      
      // If both collections are empty, this is the first user
      const isFirstUser = managersSnapshot.empty && staffSnapshot.empty;
      set({ isFirstUserRegistration: isFirstUser });
      return isFirstUser;
    } catch (error) {
      console.error('Error checking for first user:', error);
      return false;
    }
  },
  
  setUser: (user) => set({ user, error: null }),
  
  clearError: () => set({ error: null }),
  
  // Save user role and profile information
  setUserRole: (role) => set({ userRole: role }),
  
  setUserProfile: (profile) => set({ userProfile: profile }),
  
  // Create or update staff profile in Firestore
  saveStaffProfile: async (uid, profileData) => {
    try {
      set({ loading: true });
      await setDoc(doc(db, 'staff', uid), {
        ...profileData,
        role: 'staff', // Ensure the role is always staff
        updatedAt: new Date().toISOString()
      }, { merge: true });
      set({ 
        userProfile: {...profileData, role: 'staff'}, 
        userRole: 'staff',
        loading: false 
      });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  // Create or update manager profile in Firestore (for admin use)
  saveManagerProfile: async (uid, profileData) => {
    try {
      set({ loading: true });
      await setDoc(doc(db, 'managers', uid), {
        ...profileData,
        role: 'manager', // Ensure the role is always manager
        updatedAt: new Date().toISOString()
      }, { merge: true });
      set({ 
        userProfile: {...profileData, role: 'manager'}, 
        userRole: 'manager',
        loading: false 
      });
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      return false;
    }
  },
  
  // Fetch user profile from both collections
  fetchUserProfile: async (uid) => {
    try {
      set({ loading: true });
      
      // First check in staff collection
      const staffDocRef = doc(db, 'staff', uid);
      const staffDocSnap = await getDoc(staffDocRef);
      
      if (staffDocSnap.exists()) {
        const profileData = staffDocSnap.data();
        set({ 
          userProfile: profileData, 
          userRole: 'staff',
          loading: false 
        });
        return { ...profileData, role: 'staff' };
      }
      
      // If not found in staff, check in managers collection
      const managerDocRef = doc(db, 'managers', uid);
      const managerDocSnap = await getDoc(managerDocRef);
      
      if (managerDocSnap.exists()) {
        const profileData = managerDocSnap.data();
        set({ 
          userProfile: profileData, 
          userRole: 'manager',
          loading: false 
        });
        return { ...profileData, role: 'manager' };
      }
      
      // User not found in either collection
      set({ userProfile: null, userRole: null, loading: false });
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      set({ error: error.message, loading: false });
      return null;
    }
  },
  
  // Get staff with pending manager requests
  getStaffWithPendingManagerRequests: async () => {
    try {
      set({ loading: true });
      const pendingRequestsQuery = query(
        collection(db, 'staff'), 
        where('pendingManagerRequest', '==', true)
      );
      const pendingSnapshot = await getDocs(pendingRequestsQuery);
      const pendingData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'staff'
      }));
      set({ loading: false });
      return pendingData;
    } catch (error) {
      console.error('Error fetching pending requests:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  // Get all staff
  getAllStaff: async () => {
    try {
      set({ loading: true });
      const staffSnapshot = await getDocs(collection(db, 'staff'));
      const staffData = staffSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'staff'
      }));
      set({ loading: false });
      return staffData;
    } catch (error) {
      console.error('Error fetching staff:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  // Get all managers
  getAllManagers: async () => {
    try {
      set({ loading: true });
      const managersSnapshot = await getDocs(collection(db, 'managers'));
      const managersData = managersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'manager'
      }));
      set({ loading: false });
      return managersData;
    } catch (error) {
      console.error('Error fetching managers:', error);
      set({ error: error.message, loading: false });
      return [];
    }
  },
  
  // Check if user is a manager
  isManager: () => {
    const state = get();
    return state.userRole === 'manager';
  },
  
  // Check if user is staff
  isStaff: () => {
    const state = get();
    return state.userRole === 'staff';
  },
  
  logout: async () => {
    try {
      await signOut(auth);
      set({ user: null, userRole: null, userProfile: null, error: null });
    } catch (error) {
      set({ error: error.message });
    }
  },
  
  // Delete user account
  deleteAccount: async () => {
    try {
      set({ loading: true });
      const { user, userRole } = get();
      
      if (!user) {
        throw new Error('No user logged in');
      }
      
      // Delete user data from appropriate collection
      if (userRole === 'manager') {
        await deleteDoc(doc(db, 'managers', user.uid));
      } else {
        await deleteDoc(doc(db, 'staff', user.uid));
      }
      
      // Delete user authentication
      await deleteUser(auth.currentUser);
      
      set({ 
        user: null, 
        userRole: null, 
        userProfile: null, 
        loading: false 
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  }
})); 