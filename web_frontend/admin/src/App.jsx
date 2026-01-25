import React, { useContext } from 'react';
import Login from './pages/Login';

export const currency = '$';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AdminContext } from './context/AdminContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import { Routes, Route } from 'react-router-dom';

import Dashboard from './pages/Admin/Dashboard';
import AddItems from './pages/Admin/AddItems';
import ListItems from './pages/Admin/ListItems';
import Orders from './pages/Admin/Orders';
import SecurityLogs from './pages/Admin/SecurityLogs';

const App = () => {
  const { aToken } = useContext(AdminContext);

  return aToken ? (
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className="flex items-start">
        <Sidebar />
        <Routes>
          {/* Admin Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin-dashboard" element={<Dashboard />} />
          <Route path="/add-items" element={<AddItems />} />
          <Route path="/list-items" element={<ListItems />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/security-logs" element={<SecurityLogs />} />
        </Routes>
      </div>
    </div>
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  );
};

export default App;
