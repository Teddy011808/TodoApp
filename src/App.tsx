import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import TodosPage from './pages/TodosPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import ShopPage from './pages/ShopPage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ProtectedRoute from './components/ProtectedRoute'
import CheckoutPage from './pages/CheckoutPage'
import NotFound from './pages/NotFound'

/**
 * The one lazy route. Measured by lazy-loading every page: Habits came out at
 * ~41 kB (avatar upload + Storage client, offline queue, stats) while every
 * other page is under 4 kB. Splitting those would add a request to save ~1 kB;
 * splitting Habits keeps Storage and the tracker out of the bundle a
 * signed-out visitor downloads just to see /login.
 */
const HabitsPage = lazy(() => import('./pages/HabitsPage'))

function PageLoading() {
  return (
    <p className="page page-sub" role="status">
      Loading your habits…
    </p>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/habits" replace />} />
        <Route
          path="/habits"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoading />}>
                <HabitsPage />
              </Suspense>
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
