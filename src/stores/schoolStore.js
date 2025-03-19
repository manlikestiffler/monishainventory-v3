import { create } from 'zustand';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../config/firebase';

const useSchoolStore = create((set, get) => ({
  schools: [],
  uniforms: [],
  loading: false,
  error: null,
  lastFetch: null,

  fetchSchools: async (force = false) => {
    // If we have data and it's less than 5 minutes old, don't fetch again
    const now = Date.now();
    if (!force && get().schools.length > 0 && get().lastFetch && now - get().lastFetch < 300000) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const querySnapshot = await getDocs(collection(db, 'schools'));
      const schools = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      set({ schools, loading: false, lastFetch: now });
    } catch (error) {
      console.error('Error fetching schools:', error);
      // Check if it's a network error
      const errorMessage = error.code === 'unavailable' 
        ? 'Network error. Please check your connection.'
        : error.message;
      set({ error: errorMessage, loading: false });
      // If we have cached data, keep using it
      if (get().schools.length > 0) {
        console.log('Using cached school data');
      }
    }
  },

  fetchUniforms: async (force = false) => {
    // If we have data and it's less than 5 minutes old, don't fetch again
    const now = Date.now();
    if (!force && get().uniforms.length > 0 && get().lastFetch && now - get().lastFetch < 300000) {
      console.log('Using cached uniforms:', get().uniforms);
      return get().uniforms;
    }

    try {
      const uniformsRef = collection(db, 'uniforms');
      const snapshot = await getDocs(uniformsRef);
      const uniforms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched fresh uniforms:', uniforms);
      set({ uniforms, lastFetch: now });
      return uniforms;
    } catch (error) {
      console.error('Error fetching uniforms:', error);
      // If we have cached data, keep using it
      if (get().uniforms.length > 0) {
        console.log('Using cached uniforms due to error');
        return get().uniforms;
      }
      return [];
    }
  },

  getAvailableUniforms: async (force = false) => {
    // Simply call fetchUniforms to get the uniforms
    return await get().fetchUniforms(force);
  },

  getSchoolById: async (id) => {
    try {
      if (!id) {
        console.error('No school ID provided');
        return null;
      }
      
      // First check if we have it in the store
      const cachedSchool = get().schools.find(school => school.id === id);
      if (cachedSchool) {
        return cachedSchool;
      }

      const docRef = doc(db, 'schools', id.toString());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const schoolData = { id: docSnap.id, ...docSnap.data() };
        // Update the store with this school data
        set(state => ({
          schools: state.schools.map(s => s.id === id ? schoolData : s)
        }));
        return schoolData;
      }
      return null;
    } catch (error) {
      console.error('Error getting school:', error);
      // If we have it in cache, return that
      const cachedSchool = get().schools.find(school => school.id === id);
      if (cachedSchool) {
        console.log('Using cached school data');
        return cachedSchool;
      }
      throw error;
    }
  },

  addSchool: async (schoolData) => {
    set({ loading: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'schools'), {
        ...schoolData,
        status: 'active',
        createdAt: new Date().toISOString()
      });
      const newSchool = {
        id: docRef.id,
        ...schoolData,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      set(state => ({
        schools: [...state.schools, newSchool],
        loading: false
      }));
      return newSchool;
    } catch (error) {
      console.error('Error adding school:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateSchool: async (schoolId, schoolData) => {
    set({ loading: true, error: null });
    try {
      if (!schoolId || typeof schoolId !== 'string') {
        throw new Error('Invalid school ID');
      }

      const docRef = doc(db, 'schools', schoolId.toString());
      
      // Ensure we're not losing any existing data
      const currentSchool = await getDoc(docRef);
      const currentData = currentSchool.data();
      
      const updatedData = {
        ...currentData,
        ...schoolData,
        updatedAt: new Date().toISOString(),
        uniformRequirements: {
          ...(currentData?.uniformRequirements || {}),
          ...(schoolData?.uniformRequirements || {})
        }
      };
      
      await updateDoc(docRef, updatedData);
      
      set(state => ({
        schools: state.schools.map(school =>
          school.id === schoolId ? { ...school, ...updatedData } : school
        ),
        loading: false
      }));
      
      return updatedData;
    } catch (error) {
      console.error('Error updating school:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSchool: async (id) => {
    set({ loading: true, error: null });
    try {
      await deleteDoc(doc(db, 'schools', id));
      set(state => ({
        schools: state.schools.filter(school => school.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting school:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  addStudent: async (schoolId, studentData) => {
    set({ loading: true, error: null });
    try {
      const school = await get().getSchoolById(schoolId);
      if (!school) throw new Error('School not found');

      const newStudent = {
        id: Date.now().toString(),
        ...studentData,
        createdAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'schools', schoolId), {
        students: arrayUnion(newStudent)
      });

      set(state => ({
        schools: state.schools.map(school =>
          school.id === schoolId
            ? {
                ...school,
                students: [...(school.students || []), newStudent]
              }
            : school
        ),
        loading: false
      }));

      return newStudent;
    } catch (error) {
      console.error('Error adding student:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateStudent: async (schoolId, studentData) => {
    set({ loading: true, error: null });
    try {
      const school = await get().getSchoolById(schoolId);
      if (!school) throw new Error('School not found');

      const updatedStudent = {
        ...studentData,
        updatedAt: new Date().toISOString()
      };

      const updatedStudents = (school.students || []).map(student =>
        student.id === studentData.id ? updatedStudent : student
      );

      await updateDoc(doc(db, 'schools', schoolId), {
        students: updatedStudents
      });

      set(state => ({
        schools: state.schools.map(school =>
          school.id === schoolId
            ? { ...school, students: updatedStudents }
            : school
        ),
        loading: false
      }));

      return updatedStudent;
    } catch (error) {
      console.error('Error updating student:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteStudent: async (schoolId, studentId) => {
    set({ loading: true, error: null });
    try {
      const school = await get().getSchoolById(schoolId);
      if (!school) throw new Error('School not found');

      const studentToRemove = school.students.find(student => student.id === studentId);
      if (!studentToRemove) throw new Error('Student not found');

      await updateDoc(doc(db, 'schools', schoolId), {
        students: arrayRemove(studentToRemove)
      });

      set(state => ({
        schools: state.schools.map(school =>
          school.id === schoolId
            ? {
                ...school,
                students: school.students.filter(student => student.id !== studentId)
              }
            : school
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting student:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateUniformRequirements: async (schoolId, uniformRequirements) => {
    set({ loading: true, error: null });
    try {
      if (!schoolId || typeof schoolId !== 'string') {
        throw new Error('Invalid school ID');
      }

      const docRef = doc(db, 'schools', schoolId.toString());
      const currentSchool = await getDoc(docRef);
      
      if (!currentSchool.exists()) {
        throw new Error('School not found');
      }

      console.log('Current uniform requirements:', uniformRequirements);
      
      // Ensure proper structure and merge with uppercase categories
      const mergedUniformRequirements = {
        JUNIOR: {
          BOYS: Array.isArray(uniformRequirements.JUNIOR?.BOYS) ? 
            uniformRequirements.JUNIOR.BOYS.map(item => ({
              ...item,
              uniformId: item.uniformId || '',
              item: item.item || '',
              quantityPerStudent: item.quantityPerStudent || 1,
              required: item.required !== false
            })) : [],
          GIRLS: Array.isArray(uniformRequirements.JUNIOR?.GIRLS) ? 
            uniformRequirements.JUNIOR.GIRLS.map(item => ({
              ...item,
              uniformId: item.uniformId || '',
              item: item.item || '',
              quantityPerStudent: item.quantityPerStudent || 1,
              required: item.required !== false
            })) : []
        },
        SENIOR: {
          BOYS: Array.isArray(uniformRequirements.SENIOR?.BOYS) ? 
            uniformRequirements.SENIOR.BOYS.map(item => ({
              ...item,
              uniformId: item.uniformId || '',
              item: item.item || '',
              quantityPerStudent: item.quantityPerStudent || 1,
              required: item.required !== false
            })) : [],
          GIRLS: Array.isArray(uniformRequirements.SENIOR?.GIRLS) ? 
            uniformRequirements.SENIOR.GIRLS.map(item => ({
              ...item,
              uniformId: item.uniformId || '',
              item: item.item || '',
              quantityPerStudent: item.quantityPerStudent || 1,
              required: item.required !== false
            })) : []
        }
      };

      console.log('Merged uniform requirements:', mergedUniformRequirements);

      // Update Firestore
      await updateDoc(docRef, {
        uniformRequirements: mergedUniformRequirements,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      set(state => ({
        schools: state.schools.map(school =>
          school.id === schoolId
            ? { 
                ...school,
                uniformRequirements: mergedUniformRequirements,
                updatedAt: new Date().toISOString()
              }
            : school
        ),
        loading: false
      }));

      return mergedUniformRequirements;
    } catch (error) {
      console.error('Error updating uniform requirements:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateStudentUniform: async (schoolId, studentId, uniformInventory) => {
    set(state => ({
      schools: state.schools.map(school => {
        if (school.id === schoolId) {
          return {
            ...school,
            students: school.students.map(student => {
              if (student.id === studentId) {
                return {
                  ...student,
                  uniformInventory: {
                    ...student.uniformInventory,
                    ...uniformInventory
                  }
                };
              }
              return student;
            })
          };
        }
        return school;
      })
    }));
  }
}));

export { useSchoolStore }; 