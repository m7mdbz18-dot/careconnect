import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import PatientPage from './pages/PatientPage'
import VisitorPage from './pages/VisitorPage'
import LaundryRequest from './pages/LaundryRequest'
import HousekeepingRequest from './pages/HousekeepingRequest'
import VendorListPage from './pages/VendorListPage'
import VendorPage from './pages/VendorPage'
import HousekeepingDashboard from './pages/HousekeepingDashboard'
import LaundryDashboard from './pages/LaundryDashboard'
import QRGenerator from './pages/QRGenerator'
import AdminPage from './pages/AdminPage'
import LoginPage from './pages/LoginPage'
import Protected from './pages/Protected'
import VendorManager from './pages/VendorManager'
import VendorOptionsManager from './pages/VendorOptionsManager'
import OrderTrackingPage from './pages/OrderTrackingPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Patient & visitor (public, no login) */}
        <Route path="/q/:ward/:room/:bed" element={<WelcomePage />} />
        <Route path="/q/:ward/:room/:bed/patient" element={<PatientPage />} />
        <Route path="/q/:ward/:room/:bed/visitor" element={<VisitorPage />} />
        <Route path="/q/:ward/:room/:bed/vendors" element={<VendorListPage />} />
        <Route path="/q/:ward/:room/:bed/vendors/:vendorId" element={<VendorPage />} />
        <Route path="/q/:ward/:room/:bed/laundry" element={<LaundryRequest />} />
        <Route path="/q/:ward/:room/:bed/housekeeping" element={<HousekeepingRequest />} />

        {/* Order tracking (device-private) */}
        <Route path="/order/:orderId" element={<OrderTrackingPage />} />

        {/* Login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Staff (protected) */}
        <Route path="/staff/housekeeping" element={<Protected allow="housekeeping"><HousekeepingDashboard /></Protected>} />
        <Route path="/staff/laundry" element={<Protected allow="laundry"><LaundryDashboard /></Protected>} />

        {/* Admin (protected) */}
        <Route path="/admin" element={<Protected allow="admin"><AdminPage /></Protected>} />
        <Route path="/admin/qr" element={<Protected allow="admin"><QRGenerator /></Protected>} />
        <Route path="/admin/vendors" element={<Protected allow="admin"><VendorManager /></Protected>} />
        <Route path="/admin/vendors/:vendorId" element={<Protected allow="admin"><VendorOptionsManager /></Protected>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
