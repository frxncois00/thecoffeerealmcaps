import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import CustomerLayout from './components/customer/CustomerLayout'
import CustomerPageMotion from './components/customer/CustomerPageMotion'
import './customer-motion.css'
import CustomerProtectedRoute from './routes/CustomerProtectedRoute'
import AdminDashboard from './pages/AdminDashboard'
import CashierPage from './pages/CashierPage'
import CustomerLoginPage from './pages/CustomerLoginPage'
import CustomerOAuthCallbackPage from './pages/CustomerOAuthCallbackPage'
import CustomerOnboardingPage from './pages/CustomerOnboardingPage'
import HomePage from './pages/HomePage'
import LegalPage from './pages/LegalPage'
import HelpPage from './pages/customer/HelpPage'
import ContactPage from './pages/customer/ContactPage'
import BenefitsPage from './pages/customer/BenefitsPage'
import RealmPassportPage from './pages/customer/RealmPassportPage'
import InventoryStockPage from './pages/InventoryStockPage'
import ManageMenuPage from './pages/ManageMenuPage'
import OrderPreparationPage from './pages/OrderPreparationPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import PortalLoginPage from './pages/PortalLoginPage'
import AdminMfaPage from './pages/AdminMfaPage'
import StaffDashboard from './pages/StaffDashboard'
import StaffSettingsPage from './pages/StaffSettingsPage'
import TransactionsPage from './pages/TransactionsPage'
import RaimuWidget from './components/RaimuWidget'
import {
  AboutPage,
  CheckoutPage,
  MenuPage,
  MyOrdersPage,
  NotFoundPage,
  OrderConfirmationPage,
  OrderReviewPage,
  PayMongoSuccessPage,
  ProductPage,
  ProfilePage,
} from './pages/customer/CustomerPages'

const protect = (page) => <CustomerProtectedRoute>{page}</CustomerProtectedRoute>

export default function App() {
  return (
    <>
      <CustomerPageMotion />
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/menu/:slug" element={<ProductPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<LegalPage />} />
          <Route path="/terms-of-use" element={<LegalPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/checkout" element={protect(<CheckoutPage />)} />
          <Route path="/checkout/review" element={protect(<OrderReviewPage />)} />
          <Route path="/checkout/paymongo/success" element={protect(<PayMongoSuccessPage />)} />
          <Route path="/orders" element={protect(<MyOrdersPage />)} />
          <Route path="/orders/:id/confirmation" element={protect(<OrderConfirmationPage />)} />
          <Route path="/orders/:id/track" element={protect(<Navigate to="/orders" replace />)} />
          <Route path="/profile" element={protect(<ProfilePage />)} />
          <Route path="/realm-passport" element={protect(<RealmPassportPage />)} />
          <Route path="/complete-profile" element={protect(<CustomerOnboardingPage />)} />
          <Route path="/profile/benefits" element={protect(<BenefitsPage />)} />
          <Route path="/addresses" element={<Navigate to="/profile" replace />} />
          <Route path="/settings" element={<Navigate to="/profile" replace />} />
        </Route>

        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/register" element={<CustomerLoginPage initialMode="register" />} />
        <Route path="/auth/callback" element={<CustomerOAuthCallbackPage />} />
        <Route path="/portal" element={<PortalLoginPage />} />
        <Route path="/admin/mfa" element={<ProtectedRoute allowedRoles={['admin']} allowMfaPending><AdminMfaPage /></ProtectedRoute>} />

        <Route
          path="/cashier"
          element={<ProtectedRoute allowedRoles={['cashier']}><CashierPage /></ProtectedRoute>}
        />

        <Route
          path="/admin/*"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
        />

        <Route
          path="/staff"
          element={<ProtectedRoute allowedRoles={['staff', 'operational_staff']}><OrderPreparationPage /></ProtectedRoute>}
        />
        <Route
          path="/staff/inventory"
          element={<ProtectedRoute allowedRoles={['staff', 'operational_staff']}><InventoryStockPage /></ProtectedRoute>}
        />
        <Route
          path="/staff/purchase-orders"
          element={<ProtectedRoute allowedRoles={['staff', 'operational_staff']}><PurchaseOrdersPage role="staff" /></ProtectedRoute>}
        />
        <Route
          path="/staff/menu"
          element={<ProtectedRoute allowedRoles={['staff', 'operational_staff']}><ManageMenuPage /></ProtectedRoute>}
        />
        <Route
          path="/staff/reports"
          element={<ProtectedRoute allowedRoles={['staff', 'operational_staff']}><StaffDashboard /></ProtectedRoute>}
        />
        <Route
          path="/staff/transactions"
          element={<ProtectedRoute allowedRoles={['staff', 'operational_staff']}><TransactionsPage /></ProtectedRoute>}
        />
        <Route
          path="/staff/settings"
          element={<ProtectedRoute allowedRoles={['staff', 'operational_staff']}><StaffSettingsPage /></ProtectedRoute>}
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <RaimuWidget />
    </>
  )
}
