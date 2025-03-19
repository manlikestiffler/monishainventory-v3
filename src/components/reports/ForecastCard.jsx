import { motion } from 'framer-motion';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const ForecastCard = ({ forecast }) => {
  return (
    <div className="space-y-6">
      {/* Expected Demand */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700">Expected Demand</h4>
          <span className="text-sm font-medium text-gray-900">
            Total: {forecast.nextQuarter.expectedDemand.total} units
          </span>
        </div>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={forecast.nextQuarter.expectedDemand.byCategory}>
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="quantity" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                {forecast.nextQuarter.expectedDemand.byCategory.map((entry, index) => (
                  <motion.text
                    key={index}
                    x={index * 100 + 50}
                    y={200 - (entry.quantity / 20)}
                    textAnchor="middle"
                    className="text-xs font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {entry.growth}
                  </motion.text>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Suggested Preparation */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Suggested Actions</h4>
        <div className="space-y-4">
          {forecast.nextQuarter.suggestedPreparation.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{suggestion.action}</span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-gray-500">{suggestion.reason}</div>
                <div className="flex flex-wrap gap-2">
                  {suggestion.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Seasonal Planning */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-4">Seasonal Planning</h4>
        {forecast.seasonalPlanning.keyFocus.map((focus, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-900">{focus.category}</span>
              <span className="text-sm font-medium text-blue-600">
                {focus.expectedDemand} units
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Production Deadline</span>
                <span className="font-medium text-gray-900">
                  {new Date(focus.productionDeadline).toLocaleDateString()}
                </span>
              </div>
              <div className="text-sm text-gray-500">{focus.notes}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ForecastCard; 