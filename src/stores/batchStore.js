import { create } from 'zustand';
import { collection, addDoc, getDocs, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import mockApi from '../services/mockApi.js';

// Add batch data to mockApi.js
const batchData = {
  batches: [
    {
      id: 'B1',
      schoolId: 'S1',
      uniformId: '1',
      quantity: 100,
      status: 'in_production',
      expectedDeliveryDate: '2024-02-01',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'B2',
      schoolId: 'S2',
      uniformId: '2',
      quantity: 150,
      status: 'completed',
      deliveryDate: '2024-01-10',
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-10T15:00:00Z'
    }
  ]
};

export const useBatchStore = create((set, get) => ({
  batches: [],
  loading: false,
  error: null,

  fetchBatches: async () => {
    set({ loading: true });
    try {
      const batchesSnapshot = await getDocs(collection(db, 'batchInventory'));
      const batchesData = batchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      set({ batches: batchesData, loading: false });
    } catch (error) {
      console.error('Error fetching batches:', error);
      set({ error: error.message, loading: false });
    }
  },

  getBatch: async (id) => {
    try {
      const batchDoc = await getDoc(doc(db, 'batchInventory', id));
      if (batchDoc.exists()) {
        const data = batchDoc.data();
        return { 
          id: batchDoc.id, 
          ...data,
          createdAt: data.createdAt?.toDate(),
          updatedAt: data.updatedAt?.toDate()
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting batch:', error);
      throw error;
    }
  },

  addBatch: async (batch) => {
    try {
      // Add to Firebase
      const docRef = await addDoc(collection(db, 'batchInventory'), {
        ...batch,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update local state
      const newBatch = {
        id: docRef.id,
        ...batch,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      set((state) => ({
        batches: [...state.batches, newBatch]
      }));
      
      return newBatch;
    } catch (error) {
      console.error('Error adding batch:', error);
      throw error;
    }
  },

  updateBatch: async (id, data) => {
    try {
      const batchRef = doc(db, 'batchInventory', id);
      await updateDoc(batchRef, {
        ...data,
        updatedAt: new Date()
      });

      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === id ? { ...b, ...data, updatedAt: new Date() } : b
        )
      }));
    } catch (error) {
      console.error('Error updating batch:', error);
      throw error;
    }
  },

  deleteBatch: async (id) => {
    try {
      // Delete from Firebase
      await deleteDoc(doc(db, 'batchInventory', id));
      
      // Update local state
      set((state) => ({
        batches: state.batches.filter((batch) => batch.id !== id)
      }));
      
      return true;
    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  },

  updateBatchStatus: async (id, status) => {
    try {
      const updatedBatch = await mockApi.patch(`/api/batches/${id}/status`, { status });
      set((state) => ({
        batches: state.batches.map((b) =>
          b.id === id ? { ...b, status } : b
        )
      }));
      return updatedBatch;
    } catch (error) {
      throw error;
    }
  },

  getBatchesBySchool: (schoolId) => {
    const state = get();
    return state.batches.filter(b => b.schoolId === schoolId);
  },

  getBatchesByStatus: (status) => {
    const state = get();
    return state.batches.filter(b => b.status === status);
  }
})); 