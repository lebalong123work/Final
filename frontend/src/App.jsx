
import './App.css'
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import Header from './components/Header';
import FeaturedBanner from './components/FeaturedBanner';
import Home from './pages/Home';
import Footer from './components/Footer';
import Login from './pages/Login';
import { Route, Routes } from 'react-router-dom';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ProfileWallet from './pages/ProfileWallet';
import Dashboard from './pages/admin/Dashboard';
import AdminComics from './pages/admin/AdminComics';
import AdminLevels from './pages/admin/AdminLevels';

function App() {
 
 return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/profile" element={<ProfileWallet />} />
      <Route path="/admin" element={<Dashboard />} />
      <Route path="/admin/comics" element={<AdminComics />} />
        <Route path="/admin/levels" element={<AdminLevels />} /> 
    </Routes>
  );

  
}

export default App
