import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReportStore } from '../stores/reportStore';
import SizeDistributionChart from '../components/reports/SizeDistributionChart';
import RecommendationCard from '../components/reports/RecommendationCard';
import SchoolAnalytics from '../components/reports/SchoolAnalytics';
import ForecastCard from '../components/reports/ForecastCard';
import QualityMetricsCard from '../components/reports/QualityMetricsCard';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const {
    metrics,
    loading,
    error,
    fetchMetrics
  } = useReportStore();

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'schools', label: 'School Analytics' },
    { id: 'inventory', label: 'Inventory Analysis' },
    { id: 'quality', label: 'Quality Metrics' }
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading analytics data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600">Error loading data: {error}</div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const {
    sizeDistribution,
    recommendations,
    schoolSpecificAnalytics,
    inventoryAnalytics,
    qualityMetrics,
    forecastAnalytics,
    recentTransactions
  } = metrics;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Comprehensive analysis of inventory, schools, and quality metrics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-8">
        <nav className="flex space-x-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Size Distribution */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Size Distribution</h2>
                <div className="space-y-8">
                  {sizeDistribution && sizeDistribution.shirts && (
                    <SizeDistributionChart
                      data={sizeDistribution.shirts}
                      category="Shirts"
                    />
                  )}
                  {sizeDistribution && sizeDistribution.trousers && (
                    <SizeDistributionChart
                      data={sizeDistribution.trousers}
                      category="Trousers"
                    />
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Recommendations</h2>
                {recommendations && <RecommendationCard recommendations={recommendations} />}
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Recent Transactions</h2>
                <div className="space-y-4">
                  {recentTransactions && recentTransactions.map(transaction => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{transaction.school}</div>
                        <div className="text-sm text-gray-500">{new Date(transaction.date).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">₹{transaction.amount.toLocaleString()}</div>
                        <div className={`text-sm ${
                          transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Forecast Analytics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Forecast & Planning</h2>
                {forecastAnalytics && <ForecastCard forecast={forecastAnalytics} />}
              </div>
            </div>
          )}

          {activeTab === 'schools' && schoolSpecificAnalytics && (
            <div className="space-y-8">
              {schoolSpecificAnalytics.sizePreferences.map((schoolData) => (
                <div key={schoolData.schoolId} className="bg-white rounded-lg shadow p-6">
                  <SchoolAnalytics schoolData={schoolData} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Stock Utilization */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Stock Utilization</h2>
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Overall Utilization Rate</div>
                  <div className="text-2xl font-bold text-blue-600">{inventoryAnalytics.stockUtilization.overallRate}%</div>
                </div>
                <div className="space-y-4">
                  {inventoryAnalytics.stockUtilization.byCategory.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{item.category}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">Utilization: {item.rate}%</span>
                        <span className="text-sm text-gray-500">Value: ₹{item.value.toLocaleString()}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Warehouse Capacity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Warehouse Capacity</h2>
                <div className="mb-4">
                  <div className="text-sm text-gray-500">Total Capacity Utilization</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round((inventoryAnalytics.warehouseCapacity.used / inventoryAnalytics.warehouseCapacity.total) * 100)}%
                  </div>
                </div>
                <div className="space-y-4">
                  {inventoryAnalytics.warehouseCapacity.byLocation.map((location, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{location.location}</span>
                        <span className="text-sm font-medium text-blue-600">
                          {Math.round((location.used / location.capacity) * 100)}% Used
                        </span>
                      </div>
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(location.used / location.capacity) * 100}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                          />
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        {location.used.toLocaleString()} / {location.capacity.toLocaleString()} units
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && qualityMetrics && (
            <div className="space-y-8">
              {/* Customer Satisfaction */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Customer Satisfaction</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{qualityMetrics.satisfaction.overall}</div>
                    <div className="text-sm text-gray-500">Overall Rating</div>
                  </div>
                  {qualityMetrics.satisfaction.byCategory.map((category, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{category.rating}</div>
                      <div className="text-sm text-gray-500">{category.category}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Returns Analysis */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Returns Analysis</h2>
                <div className="mb-6">
                  <div className="text-sm text-gray-500">Overall Return Rate</div>
                  <div className="text-3xl font-bold text-blue-600">{qualityMetrics.returns.rate}%</div>
                </div>
                <div className="space-y-4">
                  {qualityMetrics.returns.topReasons.map((reason, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium text-gray-900">{reason.reason}</span>
                      <span className="text-sm text-gray-500">{reason.percentage}%</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports; 