import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAToken, backendUrl } = useContext(AdminContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const { data } = await axios.post(backendUrl + '/api/admin/login', {
        email,
        password,
      });
      console.log("login response data", data)
      if (data.success) {
        localStorage.setItem('aToken', data.token);
        setAToken(data.token);
        toast.success("admin logged in successfully")
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={onSubmitHandler} className="w-full max-w-sm bg-white rounded-xl shadow-md p-8 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#007E85]">
            Admin Login
          </h2>
        </div>

        <div className="flex flex-col space-y-1">
          <label htmlFor="email" className="text-gray-600 text-sm">Email</label>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            autoComplete="email"
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007E85]"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <label htmlFor="password" className="text-gray-600 text-sm">Password</label>
          <input
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            autoComplete="current-password"
            required
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#007E85]"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#007E85] text-white py-2 rounded hover:bg-[#00646a] transition duration-200"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
