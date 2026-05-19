import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };
  
  // Get display name based on role
  const getDisplayName = () => {
    if (user.role === 'admin') return 'Admin';
    return user.name || 'User';
  };
  
  // Get avatar color based on role
  const getAvatarColor = () => {
    if (user.role === 'admin') return 'from-red-500 to-pink-500';
    return 'from-blue-500 to-indigo-500';
  };
  
  // Get role badge color
  const getRoleBadgeColor = () => {
    if (user.role === 'admin') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
  };
  
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              TaskManager
            </Link>
            
            <div className="flex space-x-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/projects" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Projects
              </Link>
              <Link to="/tasks" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Tasks
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 bg-gradient-to-r ${getAvatarColor()} rounded-full flex items-center justify-center`}>
                <span className="text-white font-semibold text-sm">
                  {getDisplayName().charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-700">{getDisplayName()}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeColor()}`}>
                  {user.role === 'admin' ? 'Administrator' : 'Team Member'}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;