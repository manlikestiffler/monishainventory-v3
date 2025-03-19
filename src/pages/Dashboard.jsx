import { useState } from 'react';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import AnimatedCard from '../components/ui/AnimatedCard';
import AdvancedFilterSystem from '../components/filters/AdvancedFilterSystem';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line
} from 'recharts';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Button from '../components/ui/Button';
import ModernSelect from '../components/ui/ModernSelect';
import RecentOrders from '../components/dashboard/RecentOrders';
import DetailedInventoryFilters from '../components/dashboard/DetailedInventoryFilters';
import MobileOptimizedChart from '../components/dashboard/MobileOptimizedChart';
import DetailedInventoryAnalysis from '../components/dashboard/DetailedInventoryAnalysis';

const calculateTotals = (inventory) => {
  const totals = {};
  Object.entries(inventory).forEach(([type, variants]) => {
    totals[type] = {
      total: 0,
      variants: {}
    };
    Object.entries(variants).forEach(([variant, sizes]) => {
      totals[type].variants[variant] = sizes.reduce((sum, size) => sum + size.quantity, 0);
      totals[type].total += totals[type].variants[variant];
    });
  });
  return totals;
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const MOCK_DATA = {
  revenueStats: {
    monthly: [
      { month: 'Jan', revenue: 125000, orders: 156, profit: 45000 },
      { month: 'Feb', revenue: 145000, orders: 178, profit: 52000 },
      { month: 'Mar', revenue: 165000, orders: 192, profit: 58000 },
      { month: 'Apr', revenue: 155000, orders: 185, profit: 54000 },
      { month: 'May', revenue: 180000, orders: 205, profit: 62000 },
      { month: 'Jun', revenue: 172000, orders: 195, profit: 59000 }
    ],
    total: 942000,
    trend: 12.5
  },
  topSchools: [
    { name: 'Washington High', revenue: 180000, orders: 245 },
    { name: 'St. John Prep', revenue: 145000, orders: 189 },
    { name: 'Modern Academy', revenue: 125000, orders: 156 },
    { name: 'City International', revenue: 135000, orders: 178 }
  ],
  productPerformance: [
    { name: 'Summer Sets', value: 35 },
    { name: 'Winter Wear', value: 25 },
    { name: 'Sports Kits', value: 20 },
    { name: 'Accessories', value: 20 }
  ],
  recentOrders: [
    {
      id: 'ORD001',
      school: 'Washington High',
      items: 3,
      amount: 12500,
      status: 'completed',
      date: '2024-01-15'
    },
    {
      id: 'ORD002',
      school: 'St. John Prep',
      items: 5,
      amount: 18900,
      status: 'processing',
      date: '2024-01-14'
    },
    {
      id: 'ORD003',
      school: 'Modern Academy',
      items: 2,
      amount: 8500,
      status: 'pending',
      date: '2024-01-13'
    }
  ],
  inventoryStats: {
    totalItems: 2850,
    lowStock: 5,
    outOfStock: 2,
    trend: 8
  },
  orderStats: {
    total: 1156,
    completed: 890,
    processing: 245,
    pending: 21,
    trend: 8
  },
  inventoryBySchool: {
    schools: [
      {
        id: 'S1',
        name: 'Washington High',
        type: 'Secondary',
        uniformPolicy: 'Strict',
        inventory: {
          Shirts: {
            'White Long Sleeve Premium': [
              { size: 'S', quantity: 140, allocated: 90, reorder: 50, color: 'White', 
                seasonality: 'All Year', lastRestocked: '2024-01-15', turnoverRate: 0.8 },
              { size: 'M', quantity: 170, allocated: 110, reorder: 50, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-15', turnoverRate: 0.85 },
              // ... more sizes
            ],
            'White Short Sleeve Premium': [/* similar structure */],
            'Blue Pinstripe Long Sleeve': [/* similar structure */],
            'House Color Polo': [/* similar structure */]
          },
          Trousers: {
            'Grey Classic Fit': [/* similar structure */],
            'Grey Slim Fit': [/* similar structure */],
            'Black Classic Fit': [/* similar structure */]
          },
          Blazers: {
            'Navy Classic Cut': [/* similar structure */],
            'Navy Fitted': [/* similar structure */],
            'Sixth Form Black': [/* similar structure */]
          }
        },
        customRequirements: {
          embroidery: true,
          nameTapes: true,
          houseBadges: true
        },
        orderPatterns: {
          peakSeason: ['July', 'August'],
          regularRestock: ['January', 'April'],
          averageOrderSize: 85
        }
      },
      {
        id: 'S2',
        name: "St. Mary's International",
        type: 'All-Through',
        uniformPolicy: 'Moderate',
        inventory: {
          Shirts: {
            'White Oxford Premium': [
              { size: 'S', quantity: 130, allocated: 85, reorder: 45, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.82 },
              { size: 'M', quantity: 160, allocated: 105, reorder: 45, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.85 },
              { size: 'L', quantity: 100, allocated: 65, reorder: 45, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.80 }
            ],
            'Blue Oxford Premium': [
              { size: 'S', quantity: 120, allocated: 80, reorder: 40, color: 'Blue',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.78 },
              { size: 'M', quantity: 150, allocated: 95, reorder: 40, color: 'Blue',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.82 },
              { size: 'L', quantity: 90, allocated: 60, reorder: 40, color: 'Blue',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.75 }
            ],
            'White Peter Pan Collar': [
              { size: 'S', quantity: 110, allocated: 75, reorder: 35, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.72 },
              { size: 'M', quantity: 140, allocated: 90, reorder: 35, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.75 },
              { size: 'L', quantity: 85, allocated: 55, reorder: 35, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-12', turnoverRate: 0.70 }
            ]
          },
          Dresses: {
            'Summer Gingham': [
              { size: 'S', quantity: 100, allocated: 70, reorder: 30, color: 'Blue',
                seasonality: 'Summer', lastRestocked: '2024-01-12', turnoverRate: 0.85 },
              { size: 'M', quantity: 130, allocated: 85, reorder: 30, color: 'Blue',
                seasonality: 'Summer', lastRestocked: '2024-01-12', turnoverRate: 0.88 },
              { size: 'L', quantity: 80, allocated: 50, reorder: 30, color: 'Blue',
                seasonality: 'Summer', lastRestocked: '2024-01-12', turnoverRate: 0.82 }
            ],
            'Winter Pinafore': [
              { size: 'S', quantity: 90, allocated: 60, reorder: 30, color: 'Grey',
                seasonality: 'Winter', lastRestocked: '2024-01-12', turnoverRate: 0.75 },
              { size: 'M', quantity: 120, allocated: 80, reorder: 30, color: 'Grey',
                seasonality: 'Winter', lastRestocked: '2024-01-12', turnoverRate: 0.78 },
              { size: 'L', quantity: 75, allocated: 45, reorder: 30, color: 'Grey',
                seasonality: 'Winter', lastRestocked: '2024-01-12', turnoverRate: 0.72 }
            ]
          }
        },
        customRequirements: {
          embroidery: true,
          nameTapes: true,
          houseBadges: true
        },
        orderPatterns: {
          peakSeason: ['June', 'July', 'August'],
          regularRestock: ['January', 'April'],
          averageOrderSize: 95
        }
      },
      {
        id: 'S3',
        name: 'Greenwood Academy',
        type: 'Primary',
        uniformPolicy: 'Relaxed',
        inventory: {/* similar structure */}
      },
      {
        id: 'S4',
        name: 'Riverside International',
        type: 'All-Through',
        uniformPolicy: 'Premium',
        inventory: {
          Shirts: {
            'Premium White Oxford': [
              { size: 'S', quantity: 160, allocated: 100, reorder: 60, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-10', turnoverRate: 0.9 },
              { size: 'M', quantity: 190, allocated: 120, reorder: 60, color: 'White',
                seasonality: 'All Year', lastRestocked: '2024-01-10', turnoverRate: 0.92 }
            ],
            'Premium Blue Oxford': [/* similar structure */],
            'House Polo (Red)': [/* similar structure */],
            'House Polo (Blue)': [/* similar structure */]
          },
          Blazers: {
            'Premium Navy with Gold Trim': [/* similar structure */],
            'Sixth Form Black with Silver Trim': [/* similar structure */]
          },
          Sportswear: {
            'Performance Polo': [/* similar structure */],
            'Track Jacket': [/* similar structure */],
            'Sports Shorts': [/* similar structure */]
          }
        },
        customRequirements: {
          embroidery: true,
          nameTapes: true,
          houseBadges: true,
          specialLabels: true
        },
        orderPatterns: {
          peakSeason: ['June', 'July', 'August'],
          regularRestock: ['January', 'April', 'October'],
          averageOrderSize: 120,
          specialOrders: {
            frequency: 'Monthly',
            averageSize: 25
          }
        },
        analytics: {
          popularSizes: ['M', 'L'],
          stockTurnover: 0.85,
          reorderFrequency: 45, // days
          seasonalDemand: {
            summer: 1.5, // demand multiplier
            winter: 1.2
          }
        }
      },
      {
        id: 'S5',
        name: 'Elite Preparatory Academy',
        type: 'Secondary',
        uniformPolicy: 'Traditional',
        // ... similar detailed structure
      },
      {
        id: 'S6',
        name: 'Global International School',
        type: 'All-Through',
        uniformPolicy: 'Modern',
        // ... similar detailed structure
      }
    ],
    
    metrics: {
      stockLevels: {
        total: 25000,
        allocated: 15000,
        available: 10000,
        lowStock: 450,
        outOfStock: 50,
        overstock: 200
      },
      turnoverRates: {
        overall: 0.75,
        byCategory: {
          Shirts: 0.82,
          Trousers: 0.78,
          Blazers: 0.65,
          Sportswear: 0.95
        },
        bySchool: {
          'S1': 0.80,
          'S2': 0.75,
          'S3': 0.70,
          'S4': 0.85
        }
      },
      seasonalTrends: {
        summer: {
          topItems: ['Short Sleeve Shirts', 'Summer Dresses', 'Sports Kit'],
          averageIncrease: 85,
          peakMonths: ['June', 'July', 'August'],
          demandMultiplier: 1.8
        },
        winter: {
          topItems: ['Blazers', 'Long Sleeve Shirts', 'Sweaters'],
          averageIncrease: 45,
          peakMonths: ['November', 'December', 'January'],
          demandMultiplier: 1.4
        }
      },
      performance: {
        bestSellers: [
          { id: 'SKU001', name: 'White Oxford Shirt', sales: 1200 },
          { id: 'SKU002', name: 'Navy Blazer', sales: 800 },
          { id: 'SKU003', name: 'Grey Trousers', sales: 950 }
        ],
        stockEfficiency: {
          averageTurnover: 75, // days
          stockAccuracy: 98.5, // percentage
          fulfillmentRate: 96.8 // percentage
        },
        sizeDistribution: {
          S: 25,
          M: 35,
          L: 25,
          XL: 15
        }
      },
      forecasting: {
        nextRestock: {
          date: '2024-02-15',
          items: [
            { sku: 'SKU001', quantity: 500 },
            { sku: 'SKU002', quantity: 300 }
          ]
        },
        demandPrediction: {
          nextMonth: {
            expected: 2500,
            growth: 15
          },
          nextQuarter: {
            expected: 8500,
            growth: 12
          }
        }
      }
    }
  }
};

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EC4899'];

const StatusBadge = ({ status }) => {
  const colors = {
    completed: 'bg-green-100 text-green-800',
    processing: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const InventoryFilters = ({ 
  selectedSchool, 
  selectedType, 
  selectedVariant,
  selectedSize,
  selectedStatus,
  onSchoolChange,
  onTypeChange,
  onVariantChange,
  onSizeChange,
  onStatusChange,
  schools,
  types
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
    <Select
      value={selectedSchool}
      onChange={onSchoolChange}
      options={schools}
      className="w-full"
      placeholder="Select School"
    />
    <Select
      value={selectedType}
      onChange={onTypeChange}
      options={[
        { value: 'all', label: 'All Types' },
        ...types
      ]}
      className="w-full"
      placeholder="Select Type"
    />
    <Select
      value={selectedVariant}
      onChange={onVariantChange}
      options={[
        { value: 'all', label: 'All Variants' },
        { value: 'long_sleeve', label: 'Long Sleeve' },
        { value: 'short_sleeve', label: 'Short Sleeve' },
        { value: 'regular_fit', label: 'Regular Fit' },
        { value: 'slim_fit', label: 'Slim Fit' }
      ]}
      className="w-full"
      placeholder="Select Variant"
    />
    <Select
      value={selectedSize}
      onChange={onSizeChange}
      options={[
        { value: 'all', label: 'All Sizes' },
        { value: 'S', label: 'Small' },
        { value: 'M', label: 'Medium' },
        { value: 'L', label: 'Large' },
        { value: 'XL', label: 'Extra Large' }
      ]}
      className="w-full"
      placeholder="Select Size"
    />
    <Select
      value={selectedStatus}
      onChange={onStatusChange}
      options={[
        { value: 'all', label: 'All Status' },
        { value: 'in_stock', label: 'In Stock' },
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' }
      ]}
      className="w-full"
      placeholder="Select Status"
    />
  </div>
);

const InventoryTrends = ({ data }) => (
  <div className="bg-white rounded-lg p-4">
    <h3 className="font-semibold text-gray-900 mb-4">Stock Level Trends</h3>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="allocated" stroke="#10B981" name="Allocated" />
          <Line type="monotone" dataKey="available" stroke="#4F46E5" name="Available" />
          <Line type="monotone" dataKey="reorder" stroke="#F59E0B" name="Reorder Level" strokeDasharray="5 5" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const InventoryMetrics = ({ metrics }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {Object.entries(metrics).map(([key, value]) => (
      <div key={key} className="bg-white rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-500 capitalize">{key.replace('_', ' ')}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    ))}
  </div>
);

const StatCard = ({ title, value, trend, icon, trendLabel, color = "indigo" }) => {
  const gradients = {
    red: "from-red-500 to-rose-500",
    emerald: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-indigo-500",
    purple: "from-purple-500 to-fuchsia-500"
  };

  const iconColors = {
    red: "text-rose-100",
    emerald: "text-emerald-100",
    blue: "text-blue-100",
    purple: "text-purple-100"
  };

  return (
    <AnimatedCard delay={0.1}>
      <motion.div 
        whileHover={{ 
          scale: 1.02,
          transition: { duration: 0.2 }
        }}
        className={`relative p-6 rounded-xl overflow-hidden bg-gradient-to-br ${gradients[color]} group`}
      >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
        
        {/* Animated circles decoration */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0.3 }}
          animate={{ 
            scale: [0.8, 1.2, 0.8],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -right-6 -top-6 w-32 h-32 bg-white rounded-full opacity-30"
        />
        <motion.div 
          initial={{ scale: 0.8, opacity: 0.2 }}
          animate={{ 
            scale: [0.8, 1.1, 0.8],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute -right-8 -bottom-8 w-40 h-40 bg-white rounded-full opacity-20"
        />
        
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg bg-white bg-opacity-20 backdrop-blur-sm`}>
              <div className={`${iconColors[color]} w-6 h-6`}>
                {icon}
              </div>
            </div>
            {trend && (
              <motion.span 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-2.5 py-1 text-sm font-semibold rounded-full ${
                  trend >= 0 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-white bg-opacity-20 text-white'
                }`}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </motion.span>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-white text-opacity-80">{title}</span>
            <div className="flex items-baseline gap-2">
              <motion.h3 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-2xl font-bold text-white"
              >
                {value}
              </motion.h3>
              {trendLabel && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-white text-opacity-80"
                >
                  {trendLabel}
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatedCard>
  );
};

const Dashboard = () => {
  const { data: dashboardData, lastUpdate, isConnected } = useRealtimeUpdates(MOCK_DATA, 'dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState('6m');
  const [filters, setFilters] = useState({
    status: null,
    type: null,
    size: null
  });

  // Add filter configurations
  const filterConfig = [
    {
      id: 'school',
      label: 'School',
      options: dashboardData.inventoryBySchool.schools.map(school => ({
        value: school.id,
        label: school.name
      }))
    },
    {
      id: 'type',
      label: 'Uniform Type',
      options: [
        { value: 'shirts', label: 'Shirts' },
        { value: 'trousers', label: 'Trousers' },
        { value: 'blazers', label: 'Blazers' },
        { value: 'sportswear', label: 'Sportswear' }
      ]
    },
    {
      id: 'status',
      label: 'Stock Status',
      options: [
        { value: 'in_stock', label: 'In Stock' },
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' }
      ]
    }
  ];

  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  return (
    <motion.div
      key="dashboard-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(dashboardData.revenueStats.total)}
          trend={dashboardData.revenueStats.trend}
          trendLabel="vs last month"
          color="red"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Total Orders"
          value={dashboardData.orderStats.total.toLocaleString()}
          trend={8}
          trendLabel="vs last month"
          color="emerald"
          icon={
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />

        <StatCard
          title="Active Schools"
          value={dashboardData.inventoryBySchool.schools.length}
          trend={5}
          trendLabel="new this month"
          color="blue"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />

        <StatCard
          title="Inventory Value"
          value={formatCurrency(1250000)}
          trend={-2.5}
          trendLabel="since last month"
          color="purple"
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      {/* Advanced Filtering System */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <AdvancedFilterSystem
          filters={filterConfig}
          onFilterChange={(id, value) => {
            setActiveFilters(prev => ({
              ...prev,
              [id]: value
            }));
          }}
          onSearch={setSearchQuery}
          activeFilters={activeFilters}
          onClearFilters={() => setActiveFilters({})}
        />
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MobileOptimizedChart title="Revenue Analytics" description="Monthly revenue breakdown">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Revenue Analytics</h2>
                <p className="text-sm text-gray-500">Monthly revenue breakdown</p>
              </div>
              <ModernSelect
                value={timeRange}
                onChange={setTimeRange}
                options={[
                  { value: '6m', label: 'Last 6 months' },
                  { value: '1y', label: 'Last year' },
                  { value: 'all', label: 'All time' }
                ]}
                className="min-w-[150px]"
              />
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardData.revenueStats.monthly}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                  <XAxis 
                    dataKey="month" 
                    tick={{fill: '#6B7280'}} 
                    axisLine={false} 
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    tick={{fill: '#6B7280'}} 
                    axisLine={false} 
                    tickLine={false}
                    dx={-10}
                    tickFormatter={value => `$${value/1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={value => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4F46E5"
                    strokeWidth={2}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </MobileOptimizedChart>

        <MobileOptimizedChart title="Product Distribution" description="Sales by category">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Product Distribution</h2>
                <p className="text-sm text-gray-500">Sales by category</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.productPerformance}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {dashboardData.productPerformance.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={value => [`${value}%`, 'Sales']}
                  />
                  <Legend
                    verticalAlign="middle"
                    align="right"
                    layout="vertical"
                    iconType="circle"
                    wrapperStyle={{
                      paddingLeft: '32px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </MobileOptimizedChart>
      </div>

      {/* Recent Orders */}
      <AnimatedCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
              <p className="text-sm text-gray-500">Latest uniform orders and their status</p>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <span>View All Orders</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
          <div className="divide-y divide-gray-100">
            {dashboardData.recentOrders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                      <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{order.school}</p>
                      <p className="text-sm text-gray-500">Order #{order.id} • {order.items} items</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(order.amount)}
                    </span>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedCard>

      {/* Detailed Inventory Analysis */}
      <AnimatedCard>
        <DetailedInventoryAnalysis
          data={dashboardData.inventoryBySchool}
          filters={filters}
          searchQuery={searchQuery}
        />
      </AnimatedCard>

      {/* Connection Status Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`fixed bottom-4 right-4 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-colors ${
          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}
      >
        {isConnected ? 'Live Updates Active' : 'Connecting...'}
      </motion.div>
    </motion.div>
  );
};

export default Dashboard; 