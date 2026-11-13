import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import DashboardNavbar from '../components/admin/DashboardNavbar';
import DashboardSidebar from '../components/admin/DashboardSidebar';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <DashboardNavbar onMenuClick={openSidebar} />

      {/* Dashboard */}
      <div className="flex min-h-[calc(100vh-72px)]">
        {/* Sidebar */}
        <DashboardSidebar open={sidebarOpen} onClose={closeSidebar} />

        {/* Page content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
