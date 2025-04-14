import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MainLayout from './layout/MainLayout';
import HomePage from './components/home/HomePage';
import NotFoundPage from './components/ui/NotFoundPage';
import ProductPage from './components/product/ProductPage';
import CartPage from './components/cart/CartPage';
import CheckoutPage from './components/checkout/CheckoutPage';
import LogginPage from './components/user/LogginPage';
import ProtectedRoute from './components/ui/ProtectedRoute';
import api from './api';
import { AuthProvider } from './context/AuthContext';
import UserProfilePage from './components/user/UserProfilePage';
import PaymentsStatusPage from './components/payments/PaymentsStatusPage';


const App = () => {
  const [numCartItems, setNumCartItems] = useState(0);
  const cart_code = localStorage.getItem("cart_code");

  useEffect(() => {
    if (cart_code) {
      api.get(`/get_cart_stat`, { 
        params: { cart_code }  
      })
      .then(res => {
        console.log("API Response:", res.data);
        if (res.data && typeof res.data.num_of_items === 'number') {
          setNumCartItems(res.data.num_of_items);                     
        }
      })
      .catch(err => {
        console.error("Failed to fetch cart stats:", err.message);
      });
    }
  }, [cart_code]);

  return (
    <AuthProvider> 
      <BrowserRouter>
        <Routes>
          {/* Main Layout for all pages */}
          <Route path="/" element={<MainLayout numCartItems={numCartItems} />}>
            <Route index element={<HomePage />} />
            <Route path="products/:slug" element={<ProductPage setNumCartItems={setNumCartItems} />} />
            <Route path="cart" element={<CartPage setNumCartItems={setNumCartItems} />} />
            <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="login" element={<LogginPage />} />
            <Route path="profile" element = {<UserProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path = "payment-status" element = {<PaymentsStatusPage setNumCartItems = {setNumCartItems} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
