import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db, storage } from '../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { HexColorPicker } from 'react-colorful';
import SchoolSelect from '../components/SchoolSelect';
import AddableSelect from '../components/AddableSelect';
import { UNIFORM_CATEGORIES, UNIFORM_TYPES, SIZES, GENDERS, SEASONS, MATERIALS, VARIANT_TYPES } from '../constants/uniforms';

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

const UNITS = [
  'Meters',
  'Yards',
  'Pieces',
  'Kilograms',
  'Grams',
  'Dozen',
  'Box'
];

const AddProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState(PRODUCT_TYPES.UNIFORM);
  const [error, setError] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(null);
  const [schools, setSchools] = useState([]);

  // Uniform specific state
  const [uniformData, setUniformData] = useState({
    name: '',
    description: '',
    category: UNIFORM_CATEGORIES[0],
    type: UNIFORM_TYPES[0],
    gender: GENDERS[0],
    material: MATERIALS[0],
    season: SEASONS[0],
    careInstructions: '',
    brand: '',
    supplier: '',
    minimumStock: '',
    reorderPoint: '',
    school: '',
    image: null,
    imageUrl: '',
    customization: {
      embroidery: false,
      printing: false,
      nameTapes: false,
      houseBadges: false
    },
    variants: [{
      variantType: VARIANT_TYPES['Shirt'][0],
      sizes: [{
        size: SIZES[0],
        quantity: '',
        price: ''
      }],
      color: '#000000',
      sku: ''
    }]
  });

  // Raw Material specific state
  const [rawMaterialData, setRawMaterialData] = useState({
    name: '',
    description: '',
    type: RAW_MATERIAL_TYPES[0],
    unit: UNITS[0],
    price: '',
    quantity: '',
    minimumStock: '',
    reorderPoint: '',
    supplier: '',
    color: '#000000',
    specifications: '',
    location: ''
  });

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsSnapshot = await getDocs(collection(db, 'schools'));
        const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSchools(schoolsList);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };
    fetchSchools();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUniformData(prev => ({
        ...prev,
        image: file,
        imageUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleUniformChange = (field, value) => {
    setUniformData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomizationChange = (field) => {
    setUniformData(prev => ({
      ...prev,
      customization: {
        ...prev.customization,
        [field]: !prev.customization[field]
      }
    }));
  };

  const handleVariantChange = (variantIndex, field, value) => {
    setUniformData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const handleSizeChange = (variantIndex, sizeIndex, field, value) => {
    setUniformData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex 
          ? {
              ...variant,
              sizes: variant.sizes.map((size, j) =>
                j === sizeIndex ? { ...size, [field]: value } : size
              )
            }
          : variant
      )
    }));
  };

  const addSize = (variantIndex) => {
    setUniformData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex
          ? {
              ...variant,
              sizes: [...variant.sizes, { size: SIZES[0], quantity: '', price: '' }]
            }
          : variant
      )
    }));
  };

  const removeSize = (variantIndex, sizeIndex) => {
    setUniformData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === variantIndex
          ? {
              ...variant,
              sizes: variant.sizes.filter((_, j) => j !== sizeIndex)
            }
          : variant
      )
    }));
  };

  const addVariant = () => {
    setUniformData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          variantType: VARIANT_TYPES[uniformData.type]?.[0] || '',
          sizes: [{
            size: SIZES[0],
            quantity: '',
            price: ''
          }],
          color: '#000000',
          sku: ''
        }
      ]
    }));
  };

  const removeVariant = (variantIndex) => {
    setUniformData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== variantIndex)
    }));
  };

  const generateSKU = (variant, variantIndex, size) => {
    const typeCode = uniformData.type.substring(0, 3).toUpperCase();
    const sizeCode = size;
    const colorCode = variant.color.substring(1, 4);
    const variantNum = (variantIndex + 1).toString().padStart(3, '0');
    return `${typeCode}-${sizeCode}-${colorCode}-${variantNum}`;
  };

  const handleRawMaterialChange = (field, value) => {
    setRawMaterialData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imageUrl = '';
      if (uniformData.image) {
        const storageRef = ref(storage, `products/${Date.now()}_${uniformData.image.name}`);
        await uploadBytes(storageRef, uniformData.image);
        imageUrl = await getDownloadURL(storageRef);
      }

      if (productType === PRODUCT_TYPES.UNIFORM) {
        if (!uniformData.school) {
          throw new Error('Please select a school');
        }

        if (!uniformData.minimumStock || Number(uniformData.minimumStock) < 0) {
          throw new Error('Please enter a valid minimum stock');
        }

        // Generate SKUs for variants
        const updatedVariants = uniformData.variants.map((variant, index) => ({
          ...variant,
          sku: generateSKU(variant, index, variant.sizes[0].size),
          quantity: Number(variant.quantity)
        }));

        await addDoc(collection(db, 'uniforms'), {
          ...uniformData,
          imageUrl: imageUrl || '/default-uniform-icon.png',
          minimumStock: Number(uniformData.minimumStock),
          reorderPoint: Number(uniformData.reorderPoint) || 0,
          variants: updatedVariants,
          type: PRODUCT_TYPES.UNIFORM,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Validate raw material data
        if (!rawMaterialData.price || Number(rawMaterialData.price) <= 0) {
          throw new Error('Please enter a valid price');
        }
        if (!rawMaterialData.quantity || Number(rawMaterialData.quantity) < 0) {
          throw new Error('Please enter a valid quantity');
        }

        await addDoc(collection(db, 'raw_materials'), {
          ...rawMaterialData,
          price: Number(rawMaterialData.price),
          quantity: Number(rawMaterialData.quantity),
          minimumStock: Number(rawMaterialData.minimumStock) || 0,
          reorderPoint: Number(rawMaterialData.reorderPoint) || 0,
          type: PRODUCT_TYPES.RAW_MATERIAL,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      navigate('/inventory');
    } catch (error) {
      console.error('Error adding product:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewCategory = async (newCategory) => {
    // In a real app, you might want to store categories in the database
    UNIFORM_CATEGORIES.push(newCategory);
    handleUniformChange('category', newCategory);
  };

  const handleAddNewType = async (newType) => {
    UNIFORM_TYPES.push(newType);
    handleUniformChange('type', newType);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto space-y-10"
      >
        {/* Header */}
        <div className="flex justify-between items-center bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Add New Product</h1>
            <p className="mt-2 text-lg text-gray-600">
              Fill in the details to add a new product to inventory
            </p>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Product Type Selection */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <h2 className="text-2xl font-bold text-gray-900">Product Type</h2>
              <p className="mt-1 text-base text-gray-600">
                Select the type of product you want to add
              </p>
            </div>
            
            <div className="p-8">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setProductType(PRODUCT_TYPES.UNIFORM)}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    productType === PRODUCT_TYPES.UNIFORM
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <div className="text-lg font-semibold text-gray-900">Uniform</div>
                  <div className="mt-1 text-sm text-gray-500">Add a new uniform product</div>
                </button>

                <button
                  type="button"
                  onClick={() => setProductType(PRODUCT_TYPES.RAW_MATERIAL)}
                  className={`flex-1 p-4 rounded-xl border-2 ${
                    productType === PRODUCT_TYPES.RAW_MATERIAL
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } transition-all duration-200`}
                >
                  <div className="text-lg font-semibold text-gray-900">Raw Material</div>
                  <div className="mt-1 text-sm text-gray-500">Add a new raw material</div>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Form Content */}
          {productType === PRODUCT_TYPES.UNIFORM ? (
            <div className="space-y-8">
              {/* Basic Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                  <p className="mt-1 text-base text-gray-600">
                    Enter the basic details of the product
                  </p>
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SchoolSelect
                      value={uniformData.school}
                      onChange={(value) => handleUniformChange('school', value)}
                      required
                    />

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={uniformData.name}
                        onChange={(e) => handleUniformChange('name', e.target.value)}
                        className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        placeholder="Enter product name"
                        required
                      />
                    </div>

                    {/* Category */}
                    <AddableSelect
                      label="Category"
                      value={uniformData.category}
                      onChange={(value) => handleUniformChange('category', value)}
                      options={UNIFORM_CATEGORIES.map(cat => ({ value: cat, label: cat }))}
                      onAddNew={handleAddNewCategory}
                      placeholder="Select category"
                      addNewPlaceholder="Enter new category"
                      required
                    />

                    {/* Type */}
                    <AddableSelect
                      label="Type"
                      value={uniformData.type}
                      onChange={(value) => handleUniformChange('type', value)}
                      options={UNIFORM_TYPES.map(type => ({ value: type, label: type }))}
                      onAddNew={handleAddNewType}
                      placeholder="Select type"
                      addNewPlaceholder="Enter new type"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-2xl font-bold text-gray-900">Product Image</h2>
                  <p className="mt-1 text-base text-gray-600">
                    Upload a high-quality image of the product
                  </p>
                </div>
                
                <div className="p-8">
                  <div className="flex items-center justify-center">
                    <div className="w-full max-w-lg">
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200">
                        {uniformData.imageUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={uniformData.imageUrl}
                              alt="Product preview"
                              className="w-full h-full object-contain rounded-2xl"
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setUniformData(prev => ({ ...prev, image: null, imageUrl: '' }));
                              }}
                              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 800x400px)</p>
                          </div>
                        )}
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageChange}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Variants Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Product Variants</h2>
                    <p className="mt-1 text-base text-gray-600">
                      Add variants with multiple sizes for this product
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Variant
                  </button>
                </div>

                <div className="p-8 space-y-6">
                  {uniformData.variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Variant {variantIndex + 1}</h3>
                        {uniformData.variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariant(variantIndex)}
                            className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Variant Type</label>
                          <select
                            value={variant.variantType}
                            onChange={(e) => handleVariantChange(variantIndex, 'variantType', e.target.value)}
                            className="block w-full px-4 py-3 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base transition-shadow duration-200"
                          >
                            {VARIANT_TYPES[uniformData.type]?.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-12 w-12 rounded-xl border-2 border-gray-300 cursor-pointer shadow-sm hover:shadow transition-shadow duration-200 flex items-center justify-center"
                              style={{ backgroundColor: variant.color }}
                              onClick={() => {
                                setSelectedVariantIndex(variantIndex);
                                setShowColorPicker(true);
                              }}
                            >
                              {showColorPicker && selectedVariantIndex === variantIndex && (
                                <div className="absolute z-50 mt-2">
                                  <div
                                    className="fixed inset-0"
                                    onClick={() => setShowColorPicker(false)}
                                  />
                                  <div className="relative">
                                    <HexColorPicker
                                      color={variant.color}
                                      onChange={(color) => handleVariantChange(variantIndex, 'color', color)}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">{variant.color}</span>
                          </div>
                        </div>
                      </div>

                      {/* Sizes Section */}
                      <div className="border-t border-gray-200 pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-base font-medium text-gray-900">Sizes</h4>
                          <button
                            type="button"
                            onClick={() => addSize(variantIndex)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-100 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Size
                          </button>
                        </div>

                        <div className="space-y-4">
                          {variant.sizes.map((sizeData, sizeIndex) => (
                            <div key={sizeIndex} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Size</label>
                                  <select
                                    value={sizeData.size}
                                    onChange={(e) => handleSizeChange(variantIndex, sizeIndex, 'size', e.target.value)}
                                    className="block w-full px-4 py-3 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base transition-shadow duration-200"
                                  >
                                    {SIZES.map((size) => (
                                      <option key={size} value={size}>{size}</option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                  <input
                                    type="number"
                                    value={sizeData.quantity}
                                    onChange={(e) => handleSizeChange(variantIndex, sizeIndex, 'quantity', e.target.value)}
                                    className="block w-full px-4 py-3 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base transition-shadow duration-200"
                                    placeholder="Enter quantity"
                                    min="0"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">Price ($)</label>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                      <span className="text-gray-500">$</span>
                                    </div>
                                    <input
                                      type="number"
                                      value={sizeData.price}
                                      onChange={(e) => handleSizeChange(variantIndex, sizeIndex, 'price', e.target.value)}
                                      className="block w-full pl-8 pr-4 py-3 rounded-xl border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-base transition-shadow duration-200"
                                      placeholder="0.00"
                                      min="0"
                                      step="0.01"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {variant.sizes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeSize(variantIndex, sizeIndex)}
                                  className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors mt-8"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Raw Material Form */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                  <h2 className="text-2xl font-bold text-gray-900">Raw Material Details</h2>
                  <p className="mt-1 text-base text-gray-600">
                    Enter the details of the raw material
                  </p>
                </div>
                
                <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Material Name
                      </label>
                      <input
                        type="text"
                        value={rawMaterialData.name}
                        onChange={(e) => handleRawMaterialChange('name', e.target.value)}
                        className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        placeholder="Enter material name"
                        required
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Material Type
                      </label>
                      <select
                        value={rawMaterialData.type}
                        onChange={(e) => handleRawMaterialChange('type', e.target.value)}
                        className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        required
                      >
                        {RAW_MATERIAL_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    {/* Unit */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Unit
                      </label>
                      <select
                        value={rawMaterialData.unit}
                        onChange={(e) => handleRawMaterialChange('unit', e.target.value)}
                        className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        required
                      >
                        {UNITS.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Price per Unit ($)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          value={rawMaterialData.price}
                          onChange={(e) => handleRawMaterialChange('price', e.target.value)}
                          className="block w-full h-12 pl-8 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={rawMaterialData.quantity}
                        onChange={(e) => handleRawMaterialChange('quantity', e.target.value)}
                        className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        placeholder="Enter quantity"
                        min="0"
                        required
                      />
                    </div>

                    {/* Minimum Stock */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Minimum Stock Level
                      </label>
                      <input
                        type="number"
                        value={rawMaterialData.minimumStock}
                        onChange={(e) => handleRawMaterialChange('minimumStock', e.target.value)}
                        className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        placeholder="Enter minimum stock level"
                        min="0"
                      />
                    </div>

                    {/* Reorder Point */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Reorder Point
                      </label>
                      <input
                        type="number"
                        value={rawMaterialData.reorderPoint}
                        onChange={(e) => handleRawMaterialChange('reorderPoint', e.target.value)}
                        className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        placeholder="Enter reorder point"
                        min="0"
                      />
                    </div>

                    {/* Supplier */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Supplier
                      </label>
                      <input
                        type="text"
                        value={rawMaterialData.supplier}
                        onChange={(e) => handleRawMaterialChange('supplier', e.target.value)}
                        className="block w-full h-12 rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        placeholder="Enter supplier name"
                      />
                    </div>

                    {/* Specifications */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Specifications
                      </label>
                      <textarea
                        value={rawMaterialData.specifications}
                        onChange={(e) => handleRawMaterialChange('specifications', e.target.value)}
                        className="block w-full rounded-xl border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-base transition-shadow duration-200"
                        placeholder="Enter material specifications"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddProduct;
