import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  Search, 
  Plus, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Eye,
  Edit2,
  Trash2,
  Filter,
  X,
  Download,
  FileSpreadsheet,
  FileText,
  Box,
  Layers
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import DetailedInventoryAnalysis from '../components/dashboard/DetailedInventoryAnalysis';
import { useInventoryStore } from '../stores/inventoryStore';
import { collection, getDocs, query, orderBy, doc, getDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getUniformIcon } from '../constants/icons';
import ExcelJS from 'exceljs';
import { PDFDocument, rgb } from 'pdf-lib';
import { useAuthStore } from '../stores/authStore';

// Get unique categories from products
const getUniqueCategories = (products) => {
  return [...new Set(products.map(product => product.category))].filter(Boolean);
};

// Enhanced helper function to calculate detailed stock status
const calculateStockStatus = (variants) => {
  if (!Array.isArray(variants)) {
    return { type: 'unknown', message: 'Status Unknown', details: [] };
  }

  let variantStatuses = [];

  variants.forEach(variant => {
    if (!variant?.sizes || !Array.isArray(variant.sizes)) return;

    const variantName = variant.variantType || 'Unknown';
    let totalQuantity = 0;
    let status = 'in_stock';

    variant.sizes.forEach(size => {
      const quantity = Number(size?.quantity) || 0;
      totalQuantity += quantity;
    });

    if (totalQuantity === 0) {
      status = 'out_of_stock';
    } else if (totalQuantity < 5) {
      status = 'low_stock';
    }

    variantStatuses.push({
      name: variantName,
      status,
      quantity: totalQuantity
    });
  });

  return {
    details: variantStatuses,
    type: variantStatuses.some(v => v.status === 'out_of_stock') ? 'out_of_stock' :
          variantStatuses.some(v => v.status === 'low_stock') ? 'low_stock' : 'in_stock'
  };
};

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
  return `https://placehold.co/400x400/${bgColor}/${textColor}?text=${encodeURIComponent(displayText)}`;
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

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [schools, setSchools] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(null);
  const [error, setError] = useState(null);
  const [schoolsMap, setSchoolsMap] = useState({});
  const { isManager } = useAuthStore();

  const { deleteProduct } = useInventoryStore();

  // Fetch schools and create a map of id to name
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsSnapshot = await getDocs(collection(db, 'schools'));
        const schoolsData = {};
        schoolsSnapshot.docs.forEach(doc => {
          schoolsData[doc.id] = doc.data().name;
        });
        setSchoolsMap(schoolsData);
        console.log('Schools map:', schoolsData); // Debug log
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    fetchSchools();
  }, []);

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const materialsSnapshot = await getDocs(collection(db, 'materials'));
        const materialsList = materialsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMaterials(materialsList);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    fetchMaterials();
  }, []);

  // Fetch batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const batchesSnapshot = await getDocs(
          query(collection(db, 'batches'), orderBy('createdAt', 'desc'))
        );
        const batchesList = batchesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBatches(batchesList);
      } catch (error) {
        console.error('Error fetching batches:', error);
      }
    };

    fetchBatches();
  }, []);

  // Fetch products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Fetch uniforms
        const uniformsQuery = query(
          collection(db, 'uniforms'),
          orderBy('createdAt', 'desc')
        );
        
        const uniformsSnapshot = await getDocs(uniformsQuery);
        console.log('Raw uniforms data:', uniformsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))); // Debug log
        
        const uniformsData = await Promise.all(uniformsSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log('Processing uniform:', { id: doc.id, ...data }); // Debug log
          
          // Fetch variants for each uniform
          const variantsQuery = query(collection(db, 'uniform_variants'));
          const variantsSnapshot = await getDocs(variantsQuery);
          const variants = variantsSnapshot.docs
            .filter(variant => variant.data().uniformId === doc.id)
            .map(variant => ({ id: variant.id, ...variant.data() }));
          
          console.log('Found variants for uniform:', variants); // Debug log
          
          return {
            id: doc.id,
            ...data,
            variants: data.variants || variants, // Use embedded variants if available
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        }));

        // Fetch raw materials
        const materialsQuery = query(
          collection(db, 'raw_materials'),
          orderBy('createdAt', 'desc')
        );
        
        const materialsSnapshot = await getDocs(materialsQuery);
        const materialsData = materialsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            variants: [], // Raw materials don't have variants
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate()
          };
        });
        
        const allProducts = [...uniformsData, ...materialsData];
        console.log('Fetched products:', allProducts); // Debug log
        setProducts(allProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    navigate(`/inventory/edit/${product.id}`);
  };

  const handleDelete = async (product) => {
    try {
      if (window.confirm('Are you sure you want to delete this product?')) {
        await deleteProduct(product.id, product.type);
        // Refresh the products list by refetching
        window.location.reload();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Export functions
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inventory');

    // Add headers
    worksheet.columns = [
      { header: 'Product Name', key: 'name', width: 30 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'School', key: 'school', width: 30 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Total Stock', key: 'stock', width: 15 },
      { header: 'Created By', key: 'creator', width: 25 },
      { header: 'Created At', key: 'date', width: 20 }
    ];

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    products.forEach(product => {
      worksheet.addRow({
        name: product.name,
        category: product.category,
        school: product.schoolName,
        type: product.type,
        status: calculateStockStatus(product.variants).type,
        stock: product.variants.reduce((total, variant) => 
          total + variant.sizes.reduce((sum, size) => sum + (size.quantity || 0), 0), 0),
        creator: product.creatorName,
        date: product.createdAt ? new Date(product.createdAt.toDate()).toLocaleDateString() : 'Unknown'
      });
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 10, 15);
    });

    // Generate and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_report.xlsx';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    // Add title
    page.drawText('Inventory Report', {
      x: 50,
      y: height - 50,
      size: 20,
      color: rgb(0, 0, 0),
    });

    // Add content
    let yOffset = height - 100;
    products.forEach((product, index) => {
      const stockStatus = calculateStockStatus(product.variants);
      const text = `${index + 1}. ${product.name} - ${product.category} - ${stockStatus.type}`;
      page.drawText(text, {
        x: 50,
        y: yOffset,
        size: 12,
        color: rgb(0, 0, 0),
      });
      yOffset -= 20;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'inventory_report.pdf';
    link.click();
  };

  // Enhanced filtering
  const filteredProducts = products.filter((product) => {
    console.log('Filtering product:', product); // Debug log for each product

    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.type?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesSchool = schoolFilter === 'all' || product.school === schoolFilter;
    
    console.log('Search match:', matchesSearch);
    console.log('Category match:', matchesCategory);
    console.log('School match:', matchesSchool);
    
    return matchesSearch && matchesCategory && matchesSchool;
  });

  console.log('Final filtered products:', filteredProducts); // Debug log for final results

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  const handleViewDetails = (product) => {
    navigate(`/inventory/${product.id}`);
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const cardVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-red-100 border-t-red-600 animate-spin mx-auto"></div>
            <div className="mt-4 text-lg font-medium text-gray-900">Loading inventory</div>
            <div className="text-sm text-gray-500">Please wait while we fetch the inventory data</div>
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
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white"
    >
      {/* ... existing breadcrumb ... */}

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-gray-900">
                  Inventory Management
                </h1>
                <p className="mt-2 text-gray-600 text-lg">
                  Track and manage your uniform inventory efficiently
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <div className="relative">
                  <Button 
                    onClick={() => document.getElementById('exportDropdown').classList.toggle('hidden')}
                    className="group bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    <span className="font-medium">Export</span>
                  </Button>
                  <div id="exportDropdown" className="hidden absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <button
                        onClick={async () => {
                          try {
                            await exportToExcel();
                          } catch (error) {
                            console.error('Error exporting to Excel:', error);
                          }
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        Export to Excel
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                      >
                        <FileText className="w-4 h-4" />
                        Export to PDF
                      </button>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => navigate('/inventory/add')} 
                  className="group bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
                >
                  <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
                  <span className="font-medium">Add New Product</span>
                </Button>
              </div>
            </div>

            {/* Stats Cards with Modal */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              <motion.div
                whileHover="hover"
                variants={cardVariants}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const allProducts = products.filter(p => !calculateStockStatus(p.variants).type.includes('out_of_stock') && !calculateStockStatus(p.variants).type.includes('low_stock'));
                  setSelectedProducts({
                    title: "Total Products",
                    products: allProducts,
                    type: "all"
                  });
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{products.length}</p>
                  </div>
                  <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Package className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover="hover"
                variants={cardVariants}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const inStockProducts = products.filter(p => !calculateStockStatus(p.variants).type.includes('out_of_stock') && !calculateStockStatus(p.variants).type.includes('low_stock'));
                  setSelectedProducts({
                    title: "In Stock Products",
                    products: inStockProducts,
                    type: "in_stock"
                  });
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">In Stock</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-600">
                      {products.filter(p => !calculateStockStatus(p.variants).type.includes('out_of_stock') && !calculateStockStatus(p.variants).type.includes('low_stock')).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover="hover"
                variants={cardVariants}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const lowStockProducts = products.filter(p => calculateStockStatus(p.variants).type.includes('low_stock'));
                  setSelectedProducts({
                    title: "Low Stock Products",
                    products: lowStockProducts,
                    type: "low_stock"
                  });
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Low Stock</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">
                      {products.filter(p => calculateStockStatus(p.variants).type.includes('low_stock')).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover="hover"
                variants={cardVariants}
                className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 cursor-pointer"
                onClick={() => {
                  const outOfStockProducts = products.filter(p => calculateStockStatus(p.variants).type.includes('out_of_stock'));
                  setSelectedProducts({
                    title: "Out of Stock Products",
                    products: outOfStockProducts,
                    type: "out_of_stock"
                  });
                  setShowModal(true);
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Out of Stock</p>
                    <p className="mt-2 text-3xl font-bold text-red-600">
                      {products.filter(p => calculateStockStatus(p.variants).type.includes('out_of_stock')).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Stock Details Modal */}
            <AnimatePresence>
              {showModal && selectedProducts && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                  onClick={() => setShowModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-3xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
                  >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedProducts.title}</h2>
                      <button
                        onClick={() => setShowModal(false)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <X className="w-6 h-6 text-gray-500" />
                      </button>
                    </div>
                    <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                      <div className="space-y-6">
                        {selectedProducts.products.map((product) => (
                          <div key={product.id} className="bg-gray-50 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <img
                                  src={getProductImage(product)}
                                  alt={product.name}
                                  className="w-16 h-16 rounded-xl object-cover"
                                />
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                                  <p className="text-sm text-gray-500">{product.type}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleViewDetails(product)}
                                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium"
                              >
                                View Details
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {product.variants.map((variant, idx) => {
                                const variantStatus = calculateStockStatus([variant]);
                                if (
                                  (selectedProducts.type === "out_of_stock" && variantStatus.type !== "out_of_stock") ||
                                  (selectedProducts.type === "low_stock" && variantStatus.type !== "low_stock") ||
                                  (selectedProducts.type === "in_stock" && (variantStatus.type === "out_of_stock" || variantStatus.type === "low_stock"))
                                ) {
                                  return null;
                                }
                                return (
                                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="font-medium text-gray-900">{variant.variantType}</span>
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        variantStatus.type === 'out_of_stock' ? 'bg-red-50 text-red-700' :
                                        variantStatus.type === 'low_stock' ? 'bg-amber-50 text-amber-700' :
                                        'bg-green-50 text-green-700'
                                      }`}>
                                        {variantStatus.details[0].quantity} in stock
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Sizes: {variant.sizes.map(s => `${s.size} (${s.quantity})`).join(', ')}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Analytics Section */}
        <AnimatePresence>
          {showAnalytics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <DetailedInventoryAnalysis 
                data={{
                  schools,
                  inventory: products,
                  materials,
                  batches
                }}
                filters={{
                  category: categoryFilter,
                  school: schoolFilter,
                  material: materialFilter,
                  batch: batchFilter
                }}
                searchQuery={searchTerm}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Filters and Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300"
                />
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="appearance-none block w-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 pr-10"
                  >
                    <option value="all">All Categories</option>
                    {getUniqueCategories(products).map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    className="appearance-none block w-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 pr-10"
                  >
                    <option value="all">All Schools</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>{school.name}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={materialFilter}
                    onChange={(e) => setMaterialFilter(e.target.value)}
                    className="appearance-none block w-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 pr-10"
                  >
                    <option value="all">All Materials</option>
                    {materials.map((material) => (
                      <option key={material.id} value={material.id}>{material.name}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="appearance-none block w-48 px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 pr-10"
                  >
                    <option value="all">All Batches</option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>Batch #{batch.batchNumber}</option>
                    ))}
                  </select>
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added By</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Added</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="group hover:bg-gray-50 transition-all duration-300"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition-colors">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors">
                        {schoolsMap[product.school] || 'Unknown School'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.createdBy || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {product.createdByRole ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            product.createdByRole === 'manager'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {product.createdByRole === 'manager' ? 'Manager' : 'Staff'}
                          </span>
                        ) : (
                          'System'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewDetails(product)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      {isManager() && (
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Batch Management Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBatchModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Batch Management</h2>
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                <div className="space-y-6">
                  {batches.map((batch) => (
                    <div key={batch.id} className="bg-gray-50 rounded-2xl p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Batch #{batch.batchNumber}</h3>
                          <p className="text-sm text-gray-500">Created on {new Date(batch.createdAt.toDate()).toLocaleDateString()}</p>
                        </div>
                        <Badge
                          variant={
                            batch.status === 'completed' ? 'success' :
                            batch.status === 'in_progress' ? 'warning' :
                            'error'
                          }
                        >
                          {batch.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {batch.products.map((product, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-900">{product.name}</span>
                              <span className="text-sm text-gray-500">Qty: {product.quantity}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              Material: {product.material}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Inventory;