import React from 'react';
import Navbar from './Navbar';

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-asphalt p-4 font-sans relative z-10 text-text-primary">
      <Navbar />
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}

export default Layout;
