import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import TodosPage from './pages/TodosPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import ShopPage from './pages/ShopPage'
import SignInPage from './pages/SignInPage'
import CheckoutPage from './pages/CheckoutPage'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/todos" replace />} />
        <Route path="/todos" element={<TodosPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/:id" element={<UserDetailPage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
