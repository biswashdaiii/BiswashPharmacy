import React, { useState, useContext } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { useAuthStore } from "../store/useAuthStore";
import { ShoppingCart, Search } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, setToken, getCartCount, setUserData, setShowSearch } = useContext(ShopContext);
  const { disconnectSocket, setAuthUser } = useAuthStore();

  const [showMenu, setShowMenu] = useState(false);

  const logout = () => {
    // Clear all authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth-storage"); // Clear Zustand persisted data

    // Reset all state
    setToken(null);
    setUserData(null);
    setAuthUser(null);
    disconnectSocket();

    // Navigate to login
    navigate('/login');
  };

  return (
    <nav className="flex items-center justify-between py-3 mb-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-md z-50 px-6 md:px-14 transition-all duration-300">
      <div className="flex items-center">
        <img
          onClick={() => navigate("/")}
          className="w-24 cursor-pointer hover:opacity-80 transition-opacity"
          src={assets.logo}
          alt="Medinest Logo"
        />
      </div>

      <div className="flex items-center gap-6 md:gap-10">
        <ul className="hidden md:flex items-center gap-8 font-medium text-gray-500 text-[13px] tracking-wide">
          <NavLink to="/" className="relative py-1 group">
            <li className="hover:text-primary transition-colors">Home</li>
            <div className="absolute bottom-0 left-0 w-0 group-[.active]:w-full h-[2px] bg-primary transition-all duration-300"></div>
          </NavLink>
          <NavLink to='/collection' className="relative py-1 group">
            <li className='hover:text-primary transition-colors'>Collection</li>
            <div className="absolute bottom-0 left-0 w-0 group-[.active]:w-full h-[2px] bg-primary transition-all duration-300"></div>
          </NavLink>
          <NavLink to="/about" className="relative py-1 group">
            <li className="hover:text-primary transition-colors">About</li>
            <div className="absolute bottom-0 left-0 w-0 group-[.active]:w-full h-[2px] bg-primary transition-all duration-300"></div>
          </NavLink>
        </ul>

        <div className="flex items-center gap-4 border-l border-gray-100 pl-6 md:pl-10 ml-0">
          {/* Search */}
          <div
            onClick={() => { setShowSearch(true); navigate('/collection'); }}
            className="p-1.5 cursor-pointer hover:text-primary text-gray-600 transition-colors"
            title="Search"
          >
            <Search className="w-[18px] h-[18px]" />
          </div>

          {/* Cart */}
          <NavLink to="/cart" className="relative p-1.5 hover:text-primary text-gray-600 transition-colors">
            <ShoppingCart className="w-[18px] h-[18px]" />
            <p className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-primary text-white font-medium rounded-full text-[9px] shadow-sm">
              {getCartCount()}
            </p>
          </NavLink>

          {/* User Account */}
          {token ? (
            <div className="flex items-center gap-2 cursor-pointer group relative ml-1">
              <img className="w-8 h-8 rounded-full border border-gray-100 group-hover:border-primary transition-all" src={assets.profile_pic} alt="User" />
              <img className="w-2 opacity-50 group-hover:opacity-100 transition-opacity" src={assets.dropdown_icon} alt="" />

              <div className="absolute top-8 right-0 pt-4 text-[13px] font-medium text-gray-600 z-30 hidden group-hover:block animate-fadeIn">
                <div className="min-w-44 bg-white rounded-lg flex flex-col py-2 shadow-xl border border-gray-100 overflow-hidden">
                  <p
                    onClick={() => navigate("/my-profile")}
                    className="hover:bg-gray-50 hover:text-primary px-4 py-2 cursor-pointer transition-all"
                  >
                    My Profile
                  </p>
                  <p
                    onClick={() => navigate("/orders")}
                    className="hover:bg-gray-50 hover:text-primary px-4 py-2 cursor-pointer transition-all"
                  >
                    My Orders
                  </p>
                  <div className="my-1 border-t border-gray-100"></div>
                  <p
                    onClick={logout}
                    className="hover:bg-red-50 text-red-500 px-4 py-2 cursor-pointer transition-all font-semibold"
                  >
                    Logout
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="text-[13px] font-semibold text-white bg-primary px-6 py-1.5 rounded-full hover:bg-opacity-90 transition-all shadow-sm active:scale-95"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;