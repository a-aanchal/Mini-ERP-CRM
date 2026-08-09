import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleGuard } from './components/RoleGuard';
import { Layout } from './components/Layout';
import { Role } from './types';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerFormPage } from './pages/CustomerFormPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductFormPage } from './pages/ProductFormPage';
import { InventoryPage } from './pages/InventoryPage';
import { ChallansPage } from './pages/ChallansPage';
import { ChallanFormPage } from './pages/ChallanFormPage';
import { ChallanDetailPage } from './pages/ChallanDetailPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />

                    {/* Customers Routes */}
                    <Route
                      path="/customers"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.SALES, Role.ACCOUNTS]}>
                          <CustomersPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="/customers/new"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.SALES]}>
                          <CustomerFormPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="/customers/:id"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.SALES, Role.ACCOUNTS]}>
                          <CustomerDetailPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="/customers/:id/edit"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.SALES]}>
                          <CustomerFormPage />
                        </RoleGuard>
                      }
                    />

                    {/* Products Routes */}
                    <Route
                      path="/products"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]}>
                          <ProductsPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="/products/new"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.WAREHOUSE]}>
                          <ProductFormPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="/products/:id/edit"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.WAREHOUSE]}>
                          <ProductFormPage />
                        </RoleGuard>
                      }
                    />

                    {/* Inventory Routes */}
                    <Route
                      path="/inventory"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.WAREHOUSE, Role.ACCOUNTS]}>
                          <InventoryPage />
                        </RoleGuard>
                      }
                    />

                    {/* Sales Challan Routes */}
                    <Route
                      path="/challans"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]}>
                          <ChallansPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="/challans/new"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.SALES]}>
                          <ChallanFormPage />
                        </RoleGuard>
                      }
                    />
                    <Route
                      path="/challans/:id"
                      element={
                        <RoleGuard roles={[Role.ADMIN, Role.SALES, Role.WAREHOUSE, Role.ACCOUNTS]}>
                          <ChallanDetailPage />
                        </RoleGuard>
                      }
                    />

                    {/* Default Fallback Redirect */}
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
