import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordRequestPage from './pages/auth/ForgotPasswordRequestPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import ResetPasswordWithOTPPage from './pages/auth/ResetPasswordWithOTPPage';
import RequestVerificationPage from './pages/auth/RequestVerificationPage';

// Customer pages
import DashboardPage from './pages/dashboard/DashboardPage';
import ProfilePage from './pages/profile/ProfilePage';
import MenuPage from './pages/menu/MenuPage';
import OrderPage from './pages/order/OrderPage';
import BookTablePage from './pages/tables/BookTablePage';
import TableFloorPlanPage from './pages/tables/TableFloorPlanPage';
import TableBookingPage from './pages/tables/TableBookingPage';
import MyBookingsPage from './pages/tables/MyBookingsPage';
import LoyaltyPage from './pages/loyalty/LoyaltyPage';
import KitchenDisplayPage from './pages/kitchen/KitchenDisplayPage';

// Admin pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import TableManagementPage from './pages/admin/TableManagementPage';
import AdminTablesPage from './pages/tables/AdminTablesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import BillingPage from './pages/admin/BillingPage';
import InventoryManagementPage from './pages/admin/InventoryManagementPage';
import LoyaltyManagementPage from './pages/admin/LoyaltyManagementPage';
import TopPicksPage from './pages/admin/TopPicksPage';
import StaffManagement from './pages/admin/StaffManagement';
import Settings from './pages/admin/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordRequestPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/reset-password" element={<ResetPasswordWithOTPPage />} />
          <Route path="/verify-email" element={<RequestVerificationPage />} />

          {/* Protected customer routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/order" element={<OrderPage />} />
            <Route path="/tables" element={<BookTablePage />} />
            <Route path="/tables/floor-plan" element={<TableFloorPlanPage />} />
            <Route path="/tables/book" element={<TableBookingPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/kitchen" element={<KitchenDisplayPage />} />
          </Route>

          {/* Protected admin routes */}
          <Route element={<ProtectedAdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="menu" element={<MenuManagementPage />} />
              <Route path="tables" element={<TableManagementPage />} />
              <Route path="tables/admin" element={<AdminTablesPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="inventory" element={<InventoryManagementPage />} />
              <Route path="loyalty" element={<LoyaltyManagementPage />} />
              <Route path="top-picks" element={<TopPicksPage />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
