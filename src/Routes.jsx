import { Routes as RouterRoutes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import AddProduct from './pages/AddProduct';
import ProductDetails from './pages/ProductDetails';
import NewSchools from './pages/NewSchools';
import NewSchoolDetails from './pages/NewSchoolDetails';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import UsersPage from './pages/UsersPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import PrivateRoute from './components/PrivateRoute';
import { useAuthStore } from './stores/authStore';
import CreateBatch from './pages/CreateBatch';
import BatchInventory from './pages/BatchInventory';
import BatchInventoryDetail from './pages/BatchInventoryDetail';
import ErrorBoundary from './components/ErrorBoundary';

function Routes() {
  const { setUser } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, [setUser]);

  return (
    <RouterRoutes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout>
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </Layout>
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="inventory" element={<Outlet />}>
          <Route index element={<Inventory />} />
          <Route path="add" element={<AddProduct />} />
          <Route path=":id" element={<ProductDetails />} />
        </Route>
        <Route path="schools" element={<Outlet />}>
          <Route index element={<NewSchools />} />
          <Route path=":id" element={<NewSchoolDetails />} />
        </Route>
        <Route path="batches" element={<BatchInventory />} />
        <Route path="batches/create" element={<CreateBatch />} />
        <Route path="batches/:id" element={<BatchInventoryDetail />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="orders/*" element={<Orders />} />
        <Route path="reports/*" element={<Reports />} />
      </Route>
    </RouterRoutes>
  );
}

export default Routes; 