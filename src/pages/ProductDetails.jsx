import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, query, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { motion } from 'framer-motion';
import { 
  ChevronLeft,
  ChevronRight,
  Package,
  Tag,
  School,
  Users,
  Box,
  AlertTriangle,
  Shirt,
  Info,
  ArrowLeft,
  Calendar,
  Clock,
  Edit2
} from 'lucide-react';

const getDefaultProductImage = (name, type) => {
  const bgColors = {
    'Shirt': '4299e1',  // blue-500
    'Trouser': '48bb78', // green-500
    'Blazer': '9f7aea', // purple-500
    'Skirt': 'ed64a6',  // pink-500
    'Tie': 'f56565',    // red-500
    'default': 'a0aec0'  // gray-500
  };

  const bgColor = bgColors[type] || bgColors.default;
  const textColor = 'ffffff'; // white text
  
  // Create a more visually appealing placeholder with the product name and type
  const displayText = `${name}\n(${type})`;
  return `https://placehold.co/600x600/${bgColor}/${textColor}?text=${encodeURIComponent(displayText)}`;
};

const getProductImage = (product) => {
  if (product.imageUrl && product.imageUrl.startsWith('http')) {
    return product.imageUrl;
  }
  
  if (product.imageUrl && product.imageUrl.startsWith('gs://')) {
    // Convert Firebase Storage URL if needed
    return product.imageUrl;
  }
  
  return getDefaultProductImage(product.name, product.type);
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Try to fetch from uniforms collection first
        let docRef = doc(db, 'uniforms', id);
        let docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          // If not found in uniforms, try raw_materials
          docRef = doc(db, 'raw_materials', id);
          docSnap = await getDoc(docRef);
        }
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Fetch school name if it's a uniform
          if (data.school) {
            const schoolDoc = await getDoc(doc(db, 'schools', data.school));
            if (schoolDoc.exists()) {
              setSchoolName(schoolDoc.data().name);
            }
          }

          // Process variants directly from the uniform document
          let variants = [];
          if (data.variants && Array.isArray(data.variants)) {
            variants = data.variants.map(variant => ({
              id: `${variant.variantType}-${variant.color}`,
              variantType: variant.variantType,
              color: variant.color,
              sizes: variant.sizes || []
            }));
          }
          
          const productData = { 
            id: docSnap.id, 
            ...data,
            variants: variants,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
          
          setProduct(productData);
        } else {
          setError('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Error loading product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-red-100 border-t-red-600 animate-spin mx-auto"></div>
            <div className="mt-4 text-lg font-medium text-gray-900">Loading details</div>
            <div className="text-sm text-gray-500">Please wait while we fetch the product information</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 text-red-500 mx-auto mb-4">
            <AlertTriangle className="w-full h-full" />
          </div>
          <div className="text-lg font-medium text-gray-900">Error</div>
          <div className="text-sm text-gray-500 mt-1">{error}</div>
          <button 
            onClick={() => navigate('/inventory')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top Navigation Bar */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/inventory')}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-600" />
                </motion.button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="hover:text-red-600 cursor-pointer" onClick={() => navigate('/inventory')}>Inventory</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-red-600 font-medium">Product Details</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
              <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/inventory/edit/${product.id}`)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit</span>
              </motion.button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Image and Quick Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Product Image */}
            <motion.div
              whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
            >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-50">
                  <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getDefaultProductImage(product.name, product.type);
                    }}
                  />
                </div>
              </motion.div>

              {/* Quick Info Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Product ID</span>
                    <span className="text-sm text-gray-900">{product.id}</span>
                  </div>
                  {schoolName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-500">School</span>
                      <span className="text-sm text-gray-900">{schoolName}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">{product.createdAt?.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Last Updated</span>
                    <span className="text-sm text-gray-900">{product.updatedAt?.toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
            </div>

            {/* Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Product Header */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
              >
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>
                <div className="flex flex-wrap gap-3">
                  {product.category && (
                    <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                      {product.category}
                    </span>
                  )}
                  {product.type && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                      {product.type}
                    </span>
                  )}
                  {product.gender && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                      {product.gender}
                    </span>
                  )}
                  {product.level && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                      {product.level}
                    </span>
                  )}
                </div>
                {product.description && (
                  <p className="mt-4 text-gray-600">{product.description}</p>
                )}
              </motion.div>

              {/* Variants and Sizes */}
              {product.variants && product.variants.length > 0 && (
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Variants & Sizes</h2>
                  <div className="space-y-6">
                    {product.variants.map((variant, index) => (
                      <motion.div
                        key={variant.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-6 border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-6 h-6 rounded-full border-2 border-white shadow-sm" 
                                style={{ backgroundColor: variant.color.toLowerCase() }}
                              />
                              <span className="text-sm font-medium text-gray-600 capitalize">
                                {variant.color}
                              </span>
                            </div>
                            <div className="h-4 w-px bg-gray-300"></div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {variant.variantType}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="px-3 py-1 bg-white rounded-lg border border-gray-200">
                              <span className="text-sm text-gray-500">
                                {variant.sizes.reduce((total, size) => total + parseInt(size.quantity || 0), 0)} total pieces
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {variant.sizes.map((size) => (
                            <motion.div
                              key={size.size}
                              whileHover={{ scale: 1.05 }}
                              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                            >
                              <div className="text-center">
                                <span className="text-lg font-semibold text-gray-900">Size {size.size}</span>
                                <div className="mt-2 text-2xl font-bold text-red-600">
                                  {size.quantity}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">pieces</div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetails; 