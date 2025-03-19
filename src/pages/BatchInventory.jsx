import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import { useBatchStore } from '../stores/batchStore';
import { useSchoolStore } from '../stores/schoolStore';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Search, Plus, Filter, FileText, Edit2, Trash2, TrendingUp, Package, DollarSign, BarChart2, X, AlertTriangle } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

const BatchInventory = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isManager } = useAuthStore();
  const { deleteBatch } = useBatchStore();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localBatches, setLocalBatches] = useState([]);

  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const batchQuery = query(collection(db, 'batchInventory'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(batchQuery);
        const batchData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));

        console.log('Fetched batch data:', batchData); // Debug log
        setBatches(batchData);
      } catch (error) {
        console.error('Error fetching batches:', error);
        setError('Failed to load batches');
      } finally {
        setLoading(false);
      }
    };

    fetchBatches();
  }, []);

  useEffect(() => {
    setLocalBatches(batches);
  }, [batches]);

  const filteredBatches = localBatches.filter(batch =>
    batch && (
      (batch?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (batch?.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (batch?.createdBy?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
  );

  const handleDeleteClick = (batch) => {
    if (!batch?.id) {
      // For undefined batches, remove them directly from local state
      setLocalBatches(prev => prev.filter(b => b !== batch));
      return;
    }
    setBatchToDelete(batch);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteBatch(batchToDelete.id);
      // Update local state immediately
      setLocalBatches(prev => prev.filter(batch => batch.id !== batchToDelete.id));
      setDeleteModalOpen(false);
      setBatchToDelete(null);
    } catch (error) {
      console.error('Error deleting batch:', error);
      // You might want to show an error message to the user here
    } finally {
      setIsDeleting(false);
    }
  };

  const analytics = {
    totalBatches: filteredBatches.length,
    totalItems: filteredBatches.reduce((sum, batch) => 
      sum + (batch?.items?.reduce((itemSum, item) => 
        itemSum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + (size?.quantity || 0), 0) || 0), 0) || 0), 0),
    totalValue: filteredBatches.reduce((sum, batch) => 
      sum + (batch?.items?.reduce((itemSum, item) => 
        itemSum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + ((size?.quantity || 0) * (item?.price || 0)), 0) || 0), 0) || 0), 0),
    averageItemsPerBatch: filteredBatches.length ? Math.round(
      filteredBatches.reduce((sum, batch) => 
        sum + (batch?.items?.reduce((itemSum, item) => 
          itemSum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + (size?.quantity || 0), 0) || 0), 0) || 0), 0) / filteredBatches.length
    ) : 0
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Batch Inventory
          </h1>
          <p className="text-gray-500 mt-1">Manage your uniform batches</p>
        </div>
        {isManager() && (
          <Button
            onClick={() => navigate('/batches/create')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Batch
          </Button>
        )}
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100"
        >
          <div className="text-sm font-medium text-blue-600 mb-1">Total Batches</div>
          <div className="text-3xl font-bold text-gray-900">{filteredBatches.length}</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100"
        >
          <div className="text-sm font-medium text-purple-600 mb-1">Total Items</div>
          <div className="text-3xl font-bold text-gray-900">
            {filteredBatches.reduce((sum, batch) => 
              sum + (batch?.items?.reduce((itemSum, item) => 
                itemSum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + (size?.quantity || 0), 0) || 0), 0) || 0), 0
            )} pcs
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100"
        >
          <div className="text-sm font-medium text-emerald-600 mb-1">Total Value</div>
          <div className="text-3xl font-bold text-gray-900">
            ${filteredBatches.reduce((sum, batch) => sum + (batch?.items?.reduce((itemSum, item) => 
              itemSum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + ((size?.quantity || 0) * (item?.price || 0)), 0) || 0), 0) || 0), 0).toLocaleString()}
          </div>
        </motion.div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search batches..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-sm"
        />
        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Delete Batch</h3>
                </div>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600">
                  Are you sure you want to delete this batch? This action cannot be undone.
                </p>
                {batchToDelete && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <p className="font-medium text-gray-900">
                      {batchToDelete.type} - {batchToDelete.variantType} ({batchToDelete.color})
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Created by {batchToDelete.createdBy} on{' '}
                      {new Date(batchToDelete.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setDeleteModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-2"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Batch
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Batch Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Total Items</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Total Value</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Created By</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-500">Created Date</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <AnimatePresence>
                {filteredBatches.map((batch) => {
                  const totalBatchItems = batch?.items?.reduce((sum, item) => 
                    sum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + (size?.quantity || 0), 0) || 0), 0) || 0;
                  const totalBatchValue = batch?.items?.reduce((sum, item) => 
                    sum + (item?.sizes?.reduce((sizeSum, size) => sizeSum + ((size?.quantity || 0) * (item?.price || 0)), 0) || 0), 0) || 0;
                  
                  return (
                    <motion.tr
                      key={`batch-${batch.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="group hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {batch.name} ({batch.type})
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700">
                          {totalBatchItems} pcs
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700">${totalBatchValue.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="text-gray-700">{batch.createdBy || 'System'}</div>
                          {batch.createdByRole === 'manager' && (
                            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                              Manager
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-700">
                          {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            onClick={() => navigate(`/batches/${batch.id}`)}
                            className="p-2 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          {isManager() && (
                            <Button
                              onClick={() => handleDeleteClick(batch)}
                              className="p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredBatches.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No batches found</h3>
              <p className="text-gray-500">Try adjusting your search or create a new batch.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchInventory; 