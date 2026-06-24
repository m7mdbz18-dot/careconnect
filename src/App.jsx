import { BrowserRouter, Routes, Route } from 'react-router-dom'
import WelcomePage from './pages/WelcomePage'
import PatientPage from './pages/PatientPage'
import VisitorPage from './pages/VisitorPage'
import MealSelection from './pages/MealSelection'
import LaundryRequest from './pages/LaundryRequest'
import HousekeepingRequest from './pages/HousekeepingRequest'
import RestaurantDashboard from './pages/RestaurantDashboard'
import HousekeepingDashboard from './pages/HousekeepingDashboard'
import LaundryDashboard from './pages/LaundryDashboard'
import QRGenerator from './pages/QRGenerator'
import AdminPage from './pages/AdminPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/q/:ward/:room/:bed" element={<WelcomePage />} />
        <Route path="/q/:ward/:room/:bed/patient" element={<PatientPage />} />
        <Route path="/q/:ward/:room/:bed/visitor" element={<VisitorPage />} />
        <Route path="/q/:ward/:room/:bed/meals" element={<MealSelection />} />
        <Route path="/q/:ward/:room/:bed/laundry" element={<LaundryRequest />} />
        <Route path="/q/:ward/:room/:bed/housekeeping" element={<HousekeepingRequest />} />
        <Route path="/staff/restaurant" element={<RestaurantDashboard />} />
        <Route path="/staff/housekeeping" element={<HousekeepingDashboard />} />
        <Route path="/staff/laundry" element={<LaundryDashboard />} />
        <Route path="/admin/qr" element={<QRGenerator />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App