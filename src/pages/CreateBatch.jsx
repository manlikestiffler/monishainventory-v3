import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ArrowLeft, Package, DollarSign, Search } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuthStore } from '../stores/authStore';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const CreateBatch = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuthStore();

  // Basic batch info
  const [batchName, setBatchName] = useState('');
  const [type, setType] = useState('');
  const [typeOptions, setTypeOptions] = useState([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Variants list for the batch
  const [batchVariants, setBatchVariants] = useState([]);
  const [currentVariant, setCurrentVariant] = useState({
    name: '',
    color: '',
    price: '',
    sizes: {}
  });

  // Autocomplete options
  const [variantOptions, setVariantOptions] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [showVariantDropdown, setShowVariantDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  // New size input
  const [newSize, setNewSize] = useState('');
  const [newQuantity, setNewQuantity] = useState('');

  // Fetch existing options from database
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const batchesSnapshot = await getDocs(collection(db, 'batchInventory'));
        const types = new Set();
        const variants = new Set();
        const colors = new Set();
        const sizes = new Set();

        batchesSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.type) types.add(data.type);
          
          data.items?.forEach(item => {
            if (item.variantType) variants.add(item.variantType);
            if (item.color) colors.add(item.color);
            item.sizes?.forEach(size => {
              if (size.size) sizes.add(size.size);
            });
          });
        });

        setTypeOptions(Array.from(types));
        setVariantOptions(Array.from(variants));
        setColorOptions(Array.from(colors));
        setSizeOptions(Array.from(sizes));
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };

    fetchOptions();
  }, []);

  // Calculate totals
  const totalQuantity = batchVariants.reduce((sum, variant) => 
    sum + Object.values(variant.sizes).reduce((a, b) => a + (parseInt(b) || 0), 0), 0
  );
  const totalValue = batchVariants.reduce((sum, variant) => 
    sum + Object.values(variant.sizes).reduce((a, b) => a + ((parseInt(b) || 0) * variant.price), 0), 0
  );

  const handleAddSize = () => {
    if (!newSize || !newQuantity) return;
    
    setCurrentVariant(prev => ({
      ...prev,
      sizes: {
        ...prev.sizes,
        [newSize]: newQuantity
      }
    }));

    setNewSize('');
    setNewQuantity('');
  };

  const handleRemoveSize = (size) => {
    setCurrentVariant(prev => {
      const newSizes = { ...prev.sizes };
      delete newSizes[size];
      return { ...prev, sizes: newSizes };
    });
  };

  const handleAddVariant = () => {
    if (!currentVariant.name || !currentVariant.color || !currentVariant.price || Object.keys(currentVariant.sizes).length === 0) return;

    setBatchVariants(prev => [...prev, currentVariant]);
    setCurrentVariant({
      name: '',
      color: '',
      price: '',
      sizes: {}
    });
  };

  const handleRemoveVariant = (index) => {
    setBatchVariants(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateBatch = async () => {
    if (!type || !batchName || batchVariants.length === 0) return;

    try {
      const batchData = {
        name: batchName,
        type: type,
        items: batchVariants.map(variant => ({
          type: type,
          variantType: variant.name,
          color: variant.color,
          sizes: Object.entries(variant.sizes).map(([size, quantity]) => ({
            size,
            quantity: parseInt(quantity)
          })),
          price: parseFloat(variant.price)
        })),
        totalQuantity,
        totalValue,
        createdBy: user?.displayName || user?.email,
        createdByUid: user?.uid,
        createdByRole: userRole,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'batchInventory'), batchData);
      navigate('/batches');
    } catch (error) {
      console.error('Error creating batch:', error);
    }
  };

  // Filter options based on input
  const filteredTypeOptions = typeOptions.filter(option => 
    option.toLowerCase().includes(type.toLowerCase())
  );
  const filteredVariantOptions = variantOptions.filter(option => 
    option.toLowerCase().includes(currentVariant.name.toLowerCase())
  );
  const filteredColorOptions = colorOptions.filter(option => 
    option.toLowerCase().includes(currentVariant.color.toLowerCase())
  );
  const filteredSizeOptions = sizeOptions.filter(option => 
    option.toLowerCase().includes(newSize.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/batches')}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Batch</h1>
          <p className="text-gray-500">Add a new batch of uniforms to inventory</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="col-span-2 space-y-6">
          {/* Batch Details */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Batch Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="Enter batch name"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-red-500 transition-shadow text-sm"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <input
                  type="text"
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setShowTypeDropdown(true);
                  }}
                  onFocus={() => setShowTypeDropdown(true)}
                  placeholder="Enter uniform type (e.g., Shirts, Trousers)"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-red-500 transition-shadow text-sm"
                  required
                />
                {showTypeDropdown && filteredTypeOptions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-auto">
                    {filteredTypeOptions.map((option) => (
                      <div
                        key={option}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                        onClick={() => {
                          setType(option);
                          setShowTypeDropdown(false);
                        }}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Variants</h2>
              </div>

              {/* Current Variant Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Variant Name</label>
                    <input
                      type="text"
                      value={currentVariant.name}
                      onChange={(e) => {
                        setCurrentVariant(prev => ({ ...prev, name: e.target.value }));
                        setShowVariantDropdown(true);
                      }}
                      onFocus={() => setShowVariantDropdown(true)}
                      placeholder="e.g., Short Sleeve"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-red-500 transition-shadow text-sm"
                    />
                    {showVariantDropdown && filteredVariantOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-auto">
                        {filteredVariantOptions.map((option) => (
                          <div
                            key={option}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => {
                              setCurrentVariant(prev => ({ ...prev, name: option }));
                              setShowVariantDropdown(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                    <input
                      type="text"
                      value={currentVariant.color}
                      onChange={(e) => {
                        setCurrentVariant(prev => ({ ...prev, color: e.target.value }));
                        setShowColorDropdown(true);
                      }}
                      onFocus={() => setShowColorDropdown(true)}
                      placeholder="e.g., White"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-red-500 transition-shadow text-sm"
                    />
                    {showColorDropdown && filteredColorOptions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-auto">
                        {filteredColorOptions.map((option) => (
                          <div
                            key={option}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                            onClick={() => {
                              setCurrentVariant(prev => ({ ...prev, color: option }));
                              setShowColorDropdown(false);
                            }}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      value={currentVariant.price}
                      onChange={(e) => setCurrentVariant(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="Enter price"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-red-500 transition-shadow text-sm"
                    />
                  </div>
                </div>

                {/* Size Input */}
                <div className="space-y-4">
                  <div className="flex items-end gap-4">
                    <div className="flex-1 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <input
                        type="text"
                        value={newSize}
                        onChange={(e) => {
                          setNewSize(e.target.value);
                          setShowSizeDropdown(true);
                        }}
                        onFocus={() => setShowSizeDropdown(true)}
                        placeholder="e.g., XL, 32, etc."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-red-500 transition-shadow text-sm"
                      />
                      {showSizeDropdown && filteredSizeOptions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-auto">
                          {filteredSizeOptions.map((option) => (
                            <div
                              key={option}
                              className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                              onClick={() => {
                                setNewSize(option);
                                setShowSizeDropdown(false);
                              }}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={newQuantity}
                        onChange={(e) => setNewQuantity(e.target.value)}
                        placeholder="Enter quantity"
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border-0 focus:ring-2 focus:ring-red-500 transition-shadow text-sm"
                      />
                    </div>

                    <Button
                      onClick={handleAddSize}
                      className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-3 rounded-xl flex items-center gap-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Size
                    </Button>
                  </div>

                  {/* Size List */}
                  {Object.entries(currentVariant.sizes).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(currentVariant.sizes).map(([size, quantity]) => (
                        <div
                          key={size}
                          className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg"
                        >
                          <span className="text-sm font-medium">{size}: {quantity}</span>
                          <button
                            onClick={() => handleRemoveSize(size)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleAddVariant}
                    className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-xl flex items-center gap-2"
                    disabled={!currentVariant.name || !currentVariant.color || !currentVariant.price || Object.keys(currentVariant.sizes).length === 0}
                  >
                    <Plus className="w-4 h-4" />
                    Add Variant
                  </Button>
                </div>
              </div>

              {/* Variants List */}
              {batchVariants.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Added Variants</h3>
                  <div className="space-y-3">
                    {batchVariants.map((variant, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 p-4 rounded-xl"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {variant.name} - {variant.color}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Price: ${variant.price} | Sizes: {Object.entries(variant.sizes).map(([size, qty]) => `${size}(${qty})`).join(', ')}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveVariant(index)}
                            className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-gray-200/50 shadow-sm space-y-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900">Batch Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Variants</span>
                <span className="font-medium text-gray-900">{batchVariants.length}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Total Quantity</span>
                <span className="font-medium text-gray-900">{totalQuantity} pcs</span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Total Value</span>
                <span className="font-medium text-gray-900">${totalValue.toFixed(2)}</span>
              </div>
            </div>

            <Button
              onClick={handleCreateBatch}
              className="w-full bg-red-600 text-white hover:bg-red-700 py-3 rounded-xl flex items-center justify-center gap-2"
              disabled={!type || !batchName || batchVariants.length === 0}
            >
              <Package className="w-5 h-5" />
              Create Batch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBatch; 