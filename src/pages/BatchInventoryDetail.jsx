import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, DollarSign, Calendar, User, Tag } from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { useBatchStore } from '../stores/batchStore';

function BatchInventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getBatch } = useBatchStore();
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBatch = async () => {
      try {
        const batchData = await getBatch(id);
        setBatch(batchData);
      } catch (error) {
        console.error('Error loading batch:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBatch();
  }, [id, getBatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Batch not found</h3>
          <p className="text-gray-500 mb-6">The batch you're looking for doesn't exist or has been deleted.</p>
          <Button
            onClick={() => navigate('/batches')}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl"
          >
            Back to Batches
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalItems = batch.items?.reduce((sum, item) => {
    const itemQuantity = item.sizes?.reduce((sizeSum, size) => sizeSum + (parseInt(size.quantity) || 0), 0) || 0;
    return sum + itemQuantity;
  }, 0) || 0;

  const totalValue = batch.items?.reduce((sum, item) => {
    const itemValue = item.sizes?.reduce((sizeSum, size) => {
      const quantity = parseInt(size.quantity) || 0;
      const unitPrice = parseFloat(item.price) || 0;
      return sizeSum + (quantity * unitPrice);
    }, 0) || 0;
    return sum + itemValue;
  }, 0) || 0;

  // Group items by variant for better organization
  const itemsByVariant = batch.items?.reduce((acc, item) => {
    const key = `${item.variantType}-${item.color}`;
    if (!acc[key]) {
      acc[key] = {
        variantType: item.variantType,
        color: item.color,
        items: [],
        totalQuantity: 0,
        totalValue: 0
      };
    }

    // Calculate item totals
    const itemQuantity = item.sizes?.reduce((sum, size) => sum + (parseInt(size.quantity) || 0), 0) || 0;
    const itemValue = item.sizes?.reduce((sum, size) => {
      const quantity = parseInt(size.quantity) || 0;
      const unitPrice = parseFloat(item.price) || 0;
      return sum + (quantity * unitPrice);
    }, 0) || 0;

    // Add the item with its size data
    acc[key].items.push({
      ...item,
      quantity: itemQuantity,
      totalPrice: itemValue
    });

    // Update variant totals
    acc[key].totalQuantity += itemQuantity;
    acc[key].totalValue += itemValue;

    return acc;
  }, {}) || {};

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/batches')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {batch.name || 'Untitled Batch'}
            </h1>
            <p className="text-gray-500 mt-1">Batch Details</p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100"
        >
          <div className="flex items-center gap-3 mb-1">
            <Package className="w-5 h-5 text-blue-600" />
            <div className="text-sm font-medium text-blue-600">Total Items</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalItems} pcs</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100"
        >
          <div className="flex items-center gap-3 mb-1">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <div className="text-sm font-medium text-emerald-600">Total Value</div>
          </div>
          <div className="text-3xl font-bold text-gray-900">${totalValue.toLocaleString()}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100"
        >
          <div className="flex items-center gap-3 mb-1">
            <User className="w-5 h-5 text-purple-600" />
            <div className="text-sm font-medium text-purple-600">Created By</div>
          </div>
          <div className="text-xl font-bold text-gray-900 truncate">{batch.createdBy || 'Unknown'}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100"
        >
          <div className="flex items-center gap-3 mb-1">
            <Calendar className="w-5 h-5 text-amber-600" />
            <div className="text-sm font-medium text-amber-600">Created Date</div>
          </div>
          <div className="text-xl font-bold text-gray-900">
            {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            }) : 'N/A'}
          </div>
        </motion.div>
      </div>

      {/* Variants Section */}
      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Variants</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {Object.values(itemsByVariant).map((variant, index) => (
            <motion.div
              key={`${variant.variantType}-${variant.color}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {variant.variantType}
                    </h3>
                    {variant.color && (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-200" 
                          style={{ 
                            backgroundColor: variant.color.toLowerCase(),
                            border: variant.color.toLowerCase() === 'white' ? '1px solid #e5e7eb' : 'none'
                          }}
                        />
                        <span className="text-gray-500">({variant.color})</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    Total Quantity: {variant.totalQuantity} pcs | Total Value: ${variant.totalValue.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Size Details */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Available Sizes</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {variant.items.map((item) => (
                    item.sizes?.map((size, sizeIndex) => (
                      <div
                        key={`${item.variantType}-${item.color}-${size.size}-${sizeIndex}`}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all"
                      >
                        <div className="text-lg font-semibold text-gray-900 mb-1">Size {size.size}</div>
                        <div className="text-sm text-gray-500">Quantity: {size.quantity} pcs</div>
                      </div>
                    ))
                  ))}
                </div>
              </div>

              {/* Price Details */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Price Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Unit Price</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${parseFloat(variant.items[0]?.price || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Total Value</div>
                    <div className="text-lg font-semibold text-gray-900">
                      ${variant.totalValue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="mt-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>Type: {variant.variantType}</span>
                </div>
                {variant.items[0]?.description && (
                  <div className="mt-2 ml-6">
                    Description: {variant.items[0].description}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-2xl border border-gray-200/50 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Batch Summary</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Variant Types</h3>
              <div className="space-y-2">
                {Array.from(new Set(Object.values(itemsByVariant).map(v => v.variantType))).map(type => (
                  <div key={type} className="flex items-center gap-2 text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    {type}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Available Colors</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(Object.values(itemsByVariant).map(v => v.color))).map(color => (
                  <div key={color} className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-200" 
                      style={{ 
                        backgroundColor: color.toLowerCase(),
                        border: color.toLowerCase() === 'white' ? '1px solid #e5e7eb' : 'none'
                      }}
                    />
                    <span className="text-sm text-gray-600">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BatchInventoryDetail; 