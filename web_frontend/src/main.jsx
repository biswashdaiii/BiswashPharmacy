import React from 'react'; // It's good practice to import React
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import ShopContextProvider from './context/ShopContext.jsx'; // Correctly imported
import './index.css';

// Get the root DOM element
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);

// Render your application
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* 
        This is the only wrapper you need. It provides the context 
        to your entire application.
      */}
      <ShopContextProvider>
        <App />
      </ShopContextProvider>
    </BrowserRouter>
  </React.StrictMode>
);