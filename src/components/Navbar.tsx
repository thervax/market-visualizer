import React from "react";
import { NavLink } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-900 text-white p-4 flex justify-between items-center shadow-md">
      <div className="text-xl font-bold">Market Visualizer</div>
      <div className="space-x-6">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "text-blue-400 font-semibold" : "hover:text-blue-300"
          }
        >
          Home
        </NavLink>
        <NavLink
          to="/pumpfun"
          className={({ isActive }) =>
            isActive ? "text-blue-400 font-semibold" : "hover:text-blue-300"
          }
        >
          PumpFun
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar;
