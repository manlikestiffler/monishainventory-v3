import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useAuthStore } from './stores/authStore';

// Initialize the first user check
const initializeApp = async () => {
  try {
    // Check if this is the first user registration
    await useAuthStore.getState().initializeFirstUserCheck();
    
    // Proceed with rendering the app
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Error initializing app:', error);
    
    // Render the app anyway, even if initialization failed
    ReactDOM.createRoot(document.getElementById('root')).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
};

// Start the initialization process
initializeApp();
