import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, ArrowRightLeft, Home, Code2, LayoutDashboard } from 'lucide-react';
import WalletConnect from './WalletConnect';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/dashboard" className="text-white text-2xl font-bold">
              London Blockchain Bridge
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={20} />} text="Dashboard" />
            <NavLink to="/bridge" icon={<ArrowRightLeft size={20} />} text="Bridge" />
            <NavLink to="/pos" icon={<ShoppingCart size={20} />} text="POS" />
            <NavLink to="/soroban" icon={<Code2 size={20} />} text="Soroban" />
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, icon, text }) => (
  <Link
    to={to}
    className="flex items-center text-gray-300 hover:text-white transition duration-150 ease-in-out"
  >
    {icon}
    <span className="ml-2">{text}</span>
  </Link>
);

export default Navbar;