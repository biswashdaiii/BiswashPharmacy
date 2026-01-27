import React, { useContext } from "react";
import { AdminContext } from "../context/AdminContext";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";

const Sidebar = () => {
  const { aToken } = useContext(AdminContext);

  return (
    <div className="min-h-screen w-[250px] bg-white border-r">
      {/* Admin Sidebar */}
      {aToken && (
        <ul className="text-[#515151] mt-5">
          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 cursor-pointer w-full ${isActive ? "bg-[#F2F3FF] border-r-4 border-primary" : ""
              }`
            }
            to={"/add-items"}
          >
            <img src={assets.add_icon} alt="" />
            <p>Add Items</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 cursor-pointer w-full ${isActive ? "bg-[#F2F3FF] border-r-4 border-primary" : ""
              }`
            }
            to={"/list-items"}
          >
            <img src={assets.order_icon} alt="" />
            <p>List Items</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 cursor-pointer w-full ${isActive ? "bg-[#F2F3FF] border-r-4 border-primary" : ""
              }`
            }
            to={"/orders"}
          >
            <img src={assets.order_icon} alt="" />
            <p>Orders</p>
          </NavLink>

          <NavLink
            className={({ isActive }) =>
              `flex items-center gap-3 py-3.5 px-3 md:px-9 cursor-pointer w-full ${isActive ? "bg-[#F2F3FF] border-r-4 border-primary" : ""
              }`
            }
            to={"/security-logs"}
          >
            <div className="w-6 h-6 flex items-center justify-center bg-zinc-100 rounded">🔐</div>
            <p>Security Logs</p>
          </NavLink>
        </ul>
      )}
    </div>
  );
};

export default Sidebar;
