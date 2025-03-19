import { motion } from 'framer-motion';

const RecommendationCard = ({ recommendations }) => {
  return (
    <div className="space-y-6">
      {/* Inventory Recommendations */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Stock Recommendations</h4>
        <div className="space-y-4">
          {recommendations.inventory.map((category) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">{category.category}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  category.trend === 'increasing' 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {category.trend.charAt(0).toUpperCase() + category.trend.slice(1)}
                </span>
              </div>
              <div className="space-y-3">
                {category.sizes.map((size) => (
                  <div key={size.size} className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Size {size.size}</span>
                      <p className="text-xs text-gray-500">{size.reason}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {size.suggestedStock} units
                      </div>
                      <div className={`text-xs ${
                        size.suggestedStock > size.currentStock
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {size.suggestedStock > size.currentStock ? '+' : ''}
                        {size.suggestedStock - size.currentStock} needed
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Restock Priorities */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Restock Priorities</h4>
        <div className="space-y-3">
          {recommendations.restockPriority.map((item) => (
            <motion.div
              key={item.item}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <span className="text-sm font-medium text-gray-900">{item.item}</span>
                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                  item.priority === 'High'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {item.priority}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900">
                Deficit: {item.deficit} units
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendationCard; 