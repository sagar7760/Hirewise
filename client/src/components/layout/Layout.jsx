import React from 'react';
import Navbar from '../common/Navbar';
import Footer from '../common/Footer';

const Layout = ({ children, showFooter = true }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
