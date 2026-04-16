import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import MainLayout from "components/layout/MainLayout"; // Import MainLayout

// Pages
import NotFound from "pages/NotFound";
import SearchResults from './pages/search-results';
import LifecycleDashboard from './pages/lifecycle-dashboard';
import AssetListPage from './pages/asset-list';
import AssetDetails from './pages/asset-details';
import AssetRegistration from './pages/asset-registration';
import Dashboard from './pages/dashboard';
import Login from './pages/login';
import CheckoutManagement from './pages/checkout-management';
import SupplierManagement from './pages/supplier-management';
import UserRegistration from 'pages/admin/UserRegistration';
import EmployeeManagement from 'pages/admin/EmployeeManagement';
import DepartmentManagement from 'pages/admin/DepartmentManagement';
import AllActivities from 'pages/AllActivities'; // Import AllActivities
import BulkImportTemplate from 'pages/BulkImportTemplate'; // Import BulkImportTemplate
import MfaSetup from 'pages/MfaSetup';
import WriteOffsPage from 'pages/write-offs';
import SoftwareDashboard from 'pages/software';
import SoftwareDetail from 'pages/software/SoftwareDetail';
import ScannerPage from 'pages/scanner';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* --- Public Routes --- */}
          <Route path="/login" element={<Login />} />

          {/* --- Protected Routes --- */}
          {/* All routes inside this wrapper require login and get the MainLayout */}
          <Route path="/scanner" element={<ProtectedRoute allowedRoles={['system_admin', 'manager', 'user']}><ScannerPage /></ProtectedRoute>} />
          
          <Route 
            element={
              <ProtectedRoute allowedRoles={['system_admin', 'manager', 'user']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/checkout-management" element={<CheckoutManagement />} />
            <Route path="/supplier-management" element={<SupplierManagement />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/lifecycle-planning" element={<LifecycleDashboard />} />
            <Route path="/asset-list" element={<AssetListPage />} />
            <Route path="/assets/:asset_tag" element={<AssetDetails />} />
            <Route path="/asset-registration" element={<AssetRegistration />} />
            <Route path="/bulk-import-template" element={<BulkImportTemplate />} /> {/* New route for BulkImportTemplate */}
            <Route path="/all-activities" element={<AllActivities />} /> {/* New route for AllActivities */}
            <Route path="/write-offs" element={<WriteOffsPage />} />
            <Route path="/software" element={<SoftwareDashboard />} />
            <Route path="/software/:id" element={<SoftwareDetail />} />
            <Route path="/mfa-setup" element={<MfaSetup />} />

            {/* Admin Routes */}
            <Route 
              path="/admin/user-registration" 
              element={
                <ProtectedRoute allowedRoles={['system_admin']}>
                  <UserRegistration />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/employee-management" 
              element={
                <ProtectedRoute allowedRoles={['system_admin', 'manager']}>
                  <EmployeeManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/department-management" 
              element={
                <ProtectedRoute allowedRoles={['system_admin', 'manager']}>
                  <DepartmentManagement />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;