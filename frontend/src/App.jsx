import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomeInfo from './pages/HomeInfo';
import DisasterNews from './pages/DisasterNews';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportDisaster from './pages/ReportDisaster';
import MyReports from './pages/MyReports';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <div className="flex-grow-1 container-fluid mt-4 pb-5">
          <Routes>
            <Route path="/" element={<HomeInfo />} />
            <Route path="/news" element={<DisasterNews />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/report" element={<ProtectedRoute roles={['USER', 'ADMIN']}><ReportDisaster /></ProtectedRoute>} />
            <Route path="/my-reports" element={<ProtectedRoute roles={['USER', 'ADMIN']}><MyReports /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
export default App;
