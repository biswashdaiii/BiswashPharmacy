import React, { useState, useContext } from "react";
import { assets } from "../assets/assets";
import { NavLink, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { ShoppingCart } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { token, setToken, getCartCount } = useContext(ShopContext);

  const [showMenu, setShowMenu] = useState(false);

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
  };

  return (
    <div className="flex items-center justify-between text-sm py-2 mb-5 border-b-2 border-slate-100 sticky top-0 bg-white z-50 px-4 md:px-14 shadow-sm">
      <img
        onClick={() => navigate("/")}
        className="w-24 cursor-pointer"
        src={assets.logo}
        alt=""
      />
      <ul className="hidden md:flex items-center gap-6 font-semibold text-slate-800">
        <NavLink to="/">
          <li className="py-1 hover:text-primary transition-colors">Home</li>
          <hr className="border-none outline-none h-1 bg-primary w-full m-auto hidden" />
        </NavLink>
        <NavLink to='/collection'>
          <li className='py-1 uppercase text-zinc-800 font-bold'>All Items</li>
          <hr className='border-none h-[1.5px] bg-primary w-3/5 m-auto hidden' />
        </NavLink>
        <NavLink to="/about">
          <li className="py-1 hover:text-primary transition-colors">About</li>
          <hr className="border-none outline-none h-1 bg-primary w-full m-auto hidden" />
        </NavLink>
      </ul>

      <div className="flex items-center gap-4">
        <NavLink to="/cart" className="relative group">
          <ShoppingCart className="w-6 h-6 text-slate-800 group-hover:text-primary transition-colors" />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">{getCartCount()}</p>
        </NavLink>
        {token && (
          <div className="flex items-center gap-2 cursor-pointer group relative">
            <img className="w-8 rounded-full" src={assets.profile_pic} alt="" />
            <img className="w-2.5" src={assets.dropdown_icon} alt="" />
            <div className="absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 z-20 hidden group-hover:block">
              <div className="min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4">
                <p
                  onClick={() => navigate("/my-profile")}
                  className="hover:text-black cursor-pointer"
                >
                  My Profile
                </p>
                <p
                  onClick={() => navigate("/orders")}
                  className="hover:text-black cursor-pointer"
                >
                  Orders
                </p>
                <p
                  onClick={logout}
                  className="hover:text-black cursor-pointer"
                >
                  Log Out
                </p>
              </div>
            </div>
          </div>
        )}

        {!token && (
          <button
            onClick={() => navigate("/login")}
            className="bg-primary text-white px-6 py-2 rounded-full font-light hidden md:block"
          >
            Create Account
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;
