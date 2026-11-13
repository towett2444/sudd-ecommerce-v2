import { Outlet } from 'react-router-dom';
import Navbar from '../components/public/Navbar';
import Footer from '../components/public/Footer';

const PublicLayout = () => {
  return (
    <div className="flex min-h-screen flex-col px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
export default PublicLayout;

/* 
className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]"
*/
