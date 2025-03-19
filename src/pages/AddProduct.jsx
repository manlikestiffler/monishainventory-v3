import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import SchoolSelect from '../components/SchoolSelect';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UNIFORM_CATEGORIES,
  UNIFORM_TYPES,
  SIZES,
  GENDERS,
} from '../constants/uniforms';
import { useDropzone } from 'react-dropzone';
import Select from '../components/ui/Select';
import { useAuthStore } from '../stores/authStore';

const LEVELS = ['Junior', 'Senior'];

const PRODUCT_TYPES = {
  UNIFORM: 'uniform',
  RAW_MATERIAL: 'raw_material'
};

const RAW_MATERIAL_TYPES = [
  'Fabric',
  'Thread',
  'Buttons',
  'Zippers',
  'Elastic',
  'Labels',
  'Packaging'
];

const DEFAULT_PRODUCT_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png';

const LEVEL_OPTIONS = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'SENIOR', label: 'Senior' }
];

const GENDER_OPTIONS = [
  { value: 'Boys', label: 'Boys' },
  { value: 'Girls', label: 'Girls' },
  { value: 'Unisex', label: 'Unisex' }
];

const ImageUpload = ({ onImageUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', '49fd62a7b8b71432b636b1d7bb3df6e1');

    try {
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onImageUpload(data.data.url);
      } else {
        throw new Error(data.error?.message || 'Failed to upload image');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: false
  });

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-900">
        Product Image
      </label>
      <div
        {...getRootProps()}
        className={`
          relative cursor-pointer border-2 border-dashed rounded-xl p-6
          transition-all duration-200 hover:border-red-500
          ${isDragActive ? 'bg-gray-50 border-red-500' : 'bg-white border-gray-300'}
          ${error ? 'border-red-500' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="mt-4 flex text-sm text-gray-600 justify-center">
            <p className="pl-1">
              {isDragActive
                ? 'Drop the image here'
                : 'Drag and drop an image, or click to select'}
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
        </div>
        
        {uploading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce" />
              <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-4 h-4 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [productType, setProductType] = useState(PRODUCT_TYPES.UNIFORM);
  const [batchInventory, setBatchInventory] = useState([]);
  const [availableVariants, setAvailableVariants] = useState({});
  const [availableColors, setAvailableColors] = useState({});
  const [availableTypes, setAvailableTypes] = useState([]);
  const [originalQuantities, setOriginalQuantities] = useState({});
  const [selectedQuantities, setSelectedQuantities] = useState({});
  
  // Uniform state
  const [uniformData, setUniformData] = useState({
    name: '',
    school: '',
    category: '',
    type: '',
    gender: 'Unisex',
    level: 'JUNIOR',
    description: '',
    variants: [{
      variantType: '',
      color: '',
      sizes: [{
        size: '',
        quantity: ''
      }]
    }]
  });

  // Raw Material state
  const [rawMaterialData, setRawMaterialData] = useState({
    name: '',
    type: RAW_MATERIAL_TYPES[0],
    quantity: '',
    description: ''
  });

  const [uploadStatus, setUploadStatus] = useState('idle');
  const [uploadError, setUploadError] = useState('');
  const [imageUrl, setImageUrl] = useState(DEFAULT_PRODUCT_IMAGE);

  // Add state for original batch quantities
  const [batchQuantities, setBatchQuantities] = useState({});

  // Fetch available types and inventory from batch inventory
  useEffect(() => {
    const fetchBatchInventory = async () => {
      try {
        const batchQuery = query(collection(db, 'batchInventory'));
        const snapshot = await getDocs(batchQuery);
        const batches = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('Fetched batches:', batches); // Debug log
        setBatchInventory(batches);

        // Get unique types
        const types = new Set();
        const variants = {};
        const colors = {};
        const quantities = {};
        
        batches.forEach(batch => {
          if (batch.type) {
            types.add(batch.type);
          }
          
          // Process variants and colors
          if (batch.items) {
            batch.items.forEach(item => {
              const batchType = batch.type;
              const variantType = item.variantType;
              const color = item.color;

              // Initialize structures if they don't exist
              if (!variants[batchType]) variants[batchType] = new Set();
              if (!colors[batchType]) colors[batchType] = {};
              if (!colors[batchType][variantType]) colors[batchType][variantType] = new Set();
              if (!quantities[batchType]) quantities[batchType] = {};
              if (!quantities[batchType][variantType]) quantities[batchType][variantType] = {};
              if (!quantities[batchType][variantType][color]) quantities[batchType][variantType][color] = {};

              variants[batchType].add(variantType);
              colors[batchType][variantType].add(color);

              // Process sizes and quantities
              if (item.sizes) {
                item.sizes.forEach(sizeData => {
                  const size = sizeData.size;
                  const qty = sizeData.quantity || 0;
                  
                  if (!quantities[batchType][variantType][color][size]) {
                    quantities[batchType][variantType][color][size] = 0;
                  }
                  quantities[batchType][variantType][color][size] += qty;
                });
              }
            });
          }
        });

        console.log('Processed quantities:', quantities); // Debug log
        setOriginalQuantities(quantities);
        setAvailableTypes(Array.from(types));
        
        // Convert Sets to arrays
        const processedVariants = {};
        const processedColors = {};
        
        Object.keys(variants).forEach(type => {
          processedVariants[type] = Array.from(variants[type]);
          processedColors[type] = {};
          
          variants[type].forEach(variant => {
            processedColors[type][variant] = Array.from(colors[type][variant] || []);
          });
        });
        
        setAvailableVariants(processedVariants);
        setAvailableColors(processedColors);
        
      } catch (error) {
        console.error('Error fetching batch inventory:', error);
      }
    };

    fetchBatchInventory();
  }, []);

  // Update getAvailableSizes function
  const getAvailableSizes = (type, variantType, color) => {
    if (!type || !variantType || !color) return [];
    
    const availableSizes = new Map(); // Using Map to track quantities per size
    
    batchInventory.forEach(batch => {
      if (batch.type === type && batch.items) {
        batch.items.forEach(item => {
          if (item.variantType === variantType && item.color === color) {
            item.sizes?.forEach(sizeData => {
              const currentQty = availableSizes.get(sizeData.size) || 0;
              availableSizes.set(sizeData.size, currentQty + (parseInt(sizeData.quantity) || 0));
            });
          }
        });
      }
    });

    // Convert to array and sort numerically, only include sizes with quantity > 0
    return Array.from(availableSizes.entries())
      .filter(([_, qty]) => qty > 0)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([size]) => size);
  };

  // Update getAvailableQuantity function
  const getAvailableQuantity = (type, variantType, color, size) => {
    if (!type || !variantType || !color || !size) return 0;
    
    let totalQuantity = 0;
    
    batchInventory.forEach(batch => {
      if (batch.type === type && batch.items) {
        batch.items.forEach(item => {
          if (item.variantType === variantType && item.color === color) {
            const sizeData = item.sizes?.find(s => s.size === size);
            if (sizeData) {
              totalQuantity += parseInt(sizeData.quantity) || 0;
            }
          }
        });
      }
    });
    
    return totalQuantity;
  };

  // Update handleVariantChange
  const handleVariantChange = (index, field, value) => {
    setUniformData(prev => {
      const newVariants = [...prev.variants];
      const currentVariant = newVariants[index];

      if (field === 'variantType') {
        currentVariant.variantType = value;
        currentVariant.color = '';
        currentVariant.sizes = [{
          size: '',
          quantity: ''
        }];
      } else if (field === 'color') {
        currentVariant.color = value;
        currentVariant.sizes = [{
          size: '',
          quantity: ''
        }];
      } else {
        currentVariant[field] = value;
      }

      return { ...prev, variants: newVariants };
    });
  };

  // Update handleQuantityChange
  const handleQuantityChange = (variantIndex, sizeIndex, value) => {
    const variant = uniformData.variants[variantIndex];
    const sizeData = variant.sizes[sizeIndex];
    
    const availableQty = getAvailableQuantity(
      uniformData.type,
      variant.variantType,
      variant.color,
      sizeData.size
    );

    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= availableQty)) {
    setUniformData(prev => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex].sizes[sizeIndex].quantity = value;
        return { ...prev, variants: newVariants };
      });
    }
  };

  // Update handleSubmit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (productType === PRODUCT_TYPES.UNIFORM) {
        // Update batch inventory quantities
        for (const variant of uniformData.variants) {
          for (const size of variant.sizes) {
            const quantity = parseInt(size.quantity);
            if (!quantity) continue;

            // Find relevant batches
            const relevantBatches = batchInventory.filter(batch => 
              batch.type === uniformData.type && 
              batch.items?.some(item => 
                item.variantType === variant.variantType && 
                item.color === variant.color &&
                item.sizes?.some(s => s.size === size.size && s.quantity > 0)
              )
            );

            let remainingQuantity = quantity;

            // Update each batch
            for (const batch of relevantBatches) {
              if (remainingQuantity <= 0) break;

              const batchRef = doc(db, 'batchInventory', batch.id);
              const updatedItems = batch.items.map(item => {
                if (item.variantType === variant.variantType && item.color === variant.color) {
                  const updatedSizes = item.sizes.map(s => {
                    if (s.size === size.size && s.quantity > 0) {
                      const deduction = Math.min(remainingQuantity, s.quantity);
                      remainingQuantity -= deduction;
                      return { ...s, quantity: s.quantity - deduction };
                    }
                    return s;
                  });
                  return { ...item, sizes: updatedSizes };
                }
                return item;
              });

              await updateDoc(batchRef, { items: updatedItems });
            }

            if (remainingQuantity > 0) {
              throw new Error(`Insufficient stock for ${variant.variantType} ${variant.color} size ${size.size}`);
            }
          }
        }
      }

      // Add the product to inventory
      const data = productType === PRODUCT_TYPES.UNIFORM ? uniformData : rawMaterialData;
      console.log('Saving product with data:', data); // Debug log
      const docRef = await addDoc(collection(db, productType === PRODUCT_TYPES.UNIFORM ? 'uniforms' : 'raw_materials'), {
        ...data,
        school: data.school, // Use school instead of schoolId for consistency
        imageUrl: imageUrl === DEFAULT_PRODUCT_IMAGE ? null : imageUrl,
        type: productType,
        createdBy: user?.displayName || user?.email,
        createdByUid: user?.uid,
        createdByRole: userRole,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('Product saved with ID:', docRef.id); // Debug log

      navigate('/inventory');
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Update the Add Variant button to not use SIZES
  const addVariant = () => {
    setUniformData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        variantType: '',
        color: '',
        sizes: [{
          size: '',
          quantity: ''
        }]
      }]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Form Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="mt-2 text-lg text-gray-600">Fill in the details to add a new product to inventory</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              <p className="mt-1 text-sm text-gray-600">Add the product details and image</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Image Upload */}
                <div>
                  <ImageUpload onImageUpload={setImageUrl} />
                  {imageUrl && (
                    <div className="mt-4 relative">
                      <img
                        src={imageUrl}
                        alt="Product preview"
                        className="w-full h-64 object-contain rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                      {imageUrl !== DEFAULT_PRODUCT_IMAGE && (
            <button
                          type="button"
                          onClick={() => setImageUrl(DEFAULT_PRODUCT_IMAGE)}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-gray-500 hover:text-red-500 shadow-lg hover:shadow-xl transition-all duration-200"
            >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
                      )}
          </div>
                  )}
        </div>

                {/* Right Column - Product Type Selection */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Product Type
                  </label>
                    <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => setProductType(PRODUCT_TYPES.UNIFORM)}
                        className={`w-full p-4 rounded-xl border-2 text-left ${
                    productType === PRODUCT_TYPES.UNIFORM
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <div className="text-lg font-semibold text-gray-900">Uniform</div>
                  <div className="mt-1 text-sm text-gray-500">Add a new uniform product</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProductType(PRODUCT_TYPES.RAW_MATERIAL)}
                        className={`w-full p-4 rounded-xl border-2 text-left ${
                    productType === PRODUCT_TYPES.RAW_MATERIAL
                            ? 'border-red-500 bg-red-50 ring-2 ring-red-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <div className="text-lg font-semibold text-gray-900">Raw Material</div>
                  <div className="mt-1 text-sm text-gray-500">Add a new raw material</div>
                </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Rest of the form (Uniform/Raw Material specific fields) */}
          <AnimatePresence mode="wait">
            {productType === PRODUCT_TYPES.UNIFORM ? (
              <motion.div
                key="uniform"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Uniform Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-8 space-y-8">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          School
                        </label>
                        <SchoolSelect
                          value={uniformData.school}
                          onChange={(e) => setUniformData(prev => ({ ...prev, school: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                          required
                        />
                      </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Product Name
                </label>
                <input
                  type="text"
                          value={uniformData.name}
                          onChange={(e) => setUniformData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                  placeholder="Enter product name"
                          required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Category
                </label>
                <select
                          value={uniformData.category}
                          onChange={(e) => setUniformData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                  required
                >
                  <option value="">Select Category</option>
                  {UNIFORM_CATEGORIES.map((category) => (
                            <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Type
                </label>
                <select
                          value={uniformData.type}
                          onChange={(e) => setUniformData(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                  required
                >
                  <option value="">Select Type</option>
                  {availableTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Gender
                </label>
                <Select
                  value={uniformData.gender}
                  onChange={(value) => setUniformData(prev => ({ ...prev, gender: value }))}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                  Level
                </label>
                <Select
                  value={uniformData.level}
                  onChange={(value) => setUniformData(prev => ({ ...prev, level: value }))}
                  options={LEVEL_OPTIONS.map(option => ({
                    value: option.value,
                    label: option.label
                  }))}
                  required
                />
              </div>

                      <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-900">
                          Description
                        </label>
                        <textarea
                          value={uniformData.description}
                          onChange={(e) => setUniformData(prev => ({ ...prev, description: e.target.value }))}
                          rows={4}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                          placeholder="Enter product description"
                        />
                      </div>
                    </div>

                    {/* Variants Section */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">Variants & Sizes</h3>
                        <button
                          type="button"
                          onClick={addVariant}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Variant
                        </button>
                      </div>

                      <div className="space-y-4">
                        {uniformData.variants.map((variant, variantIndex) => (
                          <motion.div
                            key={variantIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-xl border border-gray-200"
                          >
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-sm font-medium text-gray-900">Variant {variantIndex + 1}</h4>
                              {uniformData.variants.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setUniformData(prev => ({
                                    ...prev,
                                    variants: prev.variants.filter((_, i) => i !== variantIndex)
                                  }))}
                                  className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Variant Type
                                </label>
                                <select
                                  value={variant.variantType}
                                  onChange={(e) => handleVariantChange(variantIndex, 'variantType', e.target.value)}
                                  className="w-full h-9 rounded-lg border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                  required
                                >
                                  <option value="">Select variant type</option>
                                  {availableVariants[uniformData.type]?.map((type) => (
                                    <option key={type} value={type}>
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {variant.variantType && (
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Color
                                  </label>
                                  <select
                                    value={variant.color}
                                    onChange={(e) => handleVariantChange(variantIndex, 'color', e.target.value)}
                                    className="w-full h-9 rounded-lg border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                    required
                                  >
                                    <option value="">Select color</option>
                                    {availableColors[uniformData.type]?.[variant.variantType]?.map((color) => (
                                      <option key={color} value={color}>
                                        {color}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Size Selection */}
                              {variant.variantType && variant.color && (
                                <div className="mt-4 space-y-3">
                                  {variant.sizes.map((sizeData, sizeIndex) => (
                                    <motion.div 
                                      key={sizeIndex}
                                      initial={{ x: -20, opacity: 0 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      className="flex items-center gap-4 mt-3"
                                    >
                                      <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Size
                                        </label>
                                        <select
                                          value={sizeData.size}
                                          onChange={(e) => setUniformData(prev => {
                                            const newVariants = [...prev.variants];
                                            newVariants[variantIndex].sizes[sizeIndex] = {
                                              size: e.target.value,
                                              quantity: ''
                                            };
                                            return { ...prev, variants: newVariants };
                                          })}
                                          className="w-full h-9 rounded-lg border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                          required
                                        >
                                          <option value="">Select size</option>
                                          {getAvailableSizes(
                                            uniformData.type,
                                            variant.variantType,
                                            variant.color
                                          ).map((size) => {
                                            const availableQty = getAvailableQuantity(
                                              uniformData.type,
                                              variant.variantType,
                                              variant.color,
                                              size
                                            );
                                            return availableQty > 0 ? (
                                              <option 
                                                key={size} 
                                                value={size}
                                              >
                                                Size {size} ({availableQty} available)
                                              </option>
                                            ) : null;
                                          })}
                                        </select>
                                      </div>

                                      <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                          Quantity
                                        </label>
                                        <div className="relative">
                                          <input
                                            type="number"
                                            value={sizeData.quantity}
                                            onChange={(e) => handleQuantityChange(variantIndex, sizeIndex, e.target.value)}
                                            placeholder="Enter quantity"
                                            className="w-full h-9 px-3 rounded-lg border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                                            required
                                            min="0"
                                            max={getAvailableQuantity(
                                              uniformData.type,
                                              variant.variantType,
                                              variant.color,
                                              sizeData.size
                                            )}
                                          />
                                          <div className="absolute right-0 top-0 h-full flex items-center pr-2 text-sm text-gray-500">
                                            / {getAvailableQuantity(
                                              uniformData.type,
                                              variant.variantType,
                                              variant.color,
                                              sizeData.size
                                            )} available
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setUniformData(prev => {
                                          const newVariants = [...prev.variants];
                                          newVariants[variantIndex].sizes = newVariants[variantIndex].sizes.filter((_, i) => i !== sizeIndex);
                                          return { ...prev, variants: newVariants };
                                        })}
                                        className="mt-6 p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </motion.div>
                                  ))}

                                  {/* Add Size Button */}
                                  <button
                                    type="button"
                                    onClick={() => setUniformData(prev => {
                                      const newVariants = [...prev.variants];
                                      newVariants[variantIndex].sizes.push({
                                        size: '',
                                        quantity: ''
                                      });
                                      return { ...prev, variants: newVariants };
                                    })}
                                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Size
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="raw-material"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Raw Material Form */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Material Name
                        </label>
                        <input
                          type="text"
                          value={rawMaterialData.name}
                          onChange={(e) => setRawMaterialData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                          placeholder="Enter material name"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Material Type
                        </label>
                        <select
                          value={rawMaterialData.type}
                          onChange={(e) => setRawMaterialData(prev => ({ ...prev, type: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                          required
                        >
                          {RAW_MATERIAL_TYPES.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

            <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-900">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={rawMaterialData.quantity}
                          onChange={(e) => setRawMaterialData(prev => ({ ...prev, quantity: e.target.value }))}
                          className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                          placeholder="Enter quantity"
                          min="0"
                          required
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-gray-900">
                Description
              </label>
              <textarea
                          value={rawMaterialData.description}
                          onChange={(e) => setRawMaterialData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-shadow duration-200"
                          placeholder="Enter material description"
              />
            </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

            {/* Submit Button */}
          <div className="flex justify-end">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Adding Product...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Product
                  </>
                )}
              </motion.button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default AddProduct; 