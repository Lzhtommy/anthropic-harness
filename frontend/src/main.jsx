import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProductListScreen from './screens/ProductListScreen.jsx';
import ProductDetailScreen from './screens/ProductDetailScreen.jsx';

// 路由树：所有 Screen 必须在此注册（verify.sh C2）。
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProductListScreen />} />
        <Route path="/product/:id" element={<ProductDetailScreen />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
