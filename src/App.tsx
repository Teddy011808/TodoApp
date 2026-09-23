import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import TodosPage from './pages/TodosPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import ShopPage from './pages/ShopPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import HabitsPage from './pages/HabitsPage'
import ProtectedRoute from './components/ProtectedRoute'
import CheckoutPage from './pages/CheckoutPage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/habits" replace />} />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <HabitsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        {/* Old links still land somewhere sensible. */}
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
