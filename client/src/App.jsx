import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import PublicLayout from './layouts/PublicLayout';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Home from './pages/public/Home';
import Collection from './pages/public/Collection';
import Cart from './pages/public/Cart';
import Product from './pages/public/Product';
import PlaceOrder from './pages/public/PlaceOrder';
import Payment from './pages/public/Payment';
import Orders from './pages/public/Orders';
import OrderDetails from './pages/public/OrderDetails';
import Account from './pages/public/Account';
import Wishlist from './pages/public/Wishlist';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import NotFound from './pages/public/NotFound';

import Login from './pages/auth/Login';

import DashboardHome from './pages/admin/DashboardHome';
import ListProduct from './pages/admin/ListProduct';
import ProductForm from './pages/admin/ProductForm';
import OrdersProduct from './pages/admin/OrdersProduct';
import Categories from './pages/admin/Categories';
import Customers from './pages/admin/Customers';
import AdminReviews from './pages/admin/AdminReviews';
import Reports from './pages/admin/Reports';

import ScrollToTop from './common/ScrollToTop';
import AdminRoute from './routes/AdminRoute';
import ProtectedRoute from './routes/ProtectedRoute';

const signedIn = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

const App = () => {
  return (
    <>
      <Toaster position="top-center" />

      <ScrollToTop />

      <Routes>
        {/* Store */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="collection" element={<Collection />} />
          <Route path="offers" element={<Collection offers />} />
          <Route path="product/:slug" element={<Product />} />
          <Route path="cart" element={<Cart />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="place-order" element={signedIn(<PlaceOrder />)} />
          <Route path="orders" element={signedIn(<Orders />)} />
          <Route path="orders/:orderId" element={signedIn(<OrderDetails />)} />
          <Route path="orders/:orderId/pay" element={signedIn(<Payment />)} />
          <Route path="account" element={signedIn(<Account />)} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin */}
        <Route path="/dashboard" element={<AdminRoute><DashboardLayout /></AdminRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="list" element={<ListProduct />} />
          <Route path="list/edit/:productId" element={<ProductForm />} />
          <Route path="add" element={<ProductForm />} />
          <Route path="stock" element={<ListProduct stockMode />} />
          <Route path="categories" element={<Categories />} />
          <Route path="orders" element={<OrdersProduct />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="reports" element={<Reports />} />
        </Route>

        {/* Sign in */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
