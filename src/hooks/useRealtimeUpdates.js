import { useState, useEffect } from 'react';

export const useRealtimeUpdates = (initialData, endpoint) => {
  const [data, setData] = useState(initialData);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Simulate real-time updates with polling
    const interval = setInterval(() => {
      // In a real app, this would be an API call
      // For now, just update the timestamp
      setLastUpdate(new Date());
      
      // Simulate data updates
      setData(currentData => ({
        ...currentData,
        recentOrders: currentData.recentOrders.map(order => ({
          ...order,
          amount: order.amount + Math.random() * 100
        }))
      }));
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const refresh = async () => {
    setIsConnected(false);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setData(initialData);
      setLastUpdate(new Date());
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    }
  };

  return { 
    data, 
    lastUpdate, 
    isConnected,
    refresh
  };
}; 