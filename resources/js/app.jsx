import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Layout
import MainLayout from './components/Layout/MainLayout';
import AdminLayout from './components/Layout/AdminLayout';

// Public pages
import HomePage from './pages/HomePage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentDetailPage from './pages/DocumentDetailPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ContactPage from './pages/ContactPage';
import FaqPage from './pages/FaqPage';

// User pages
import MyDocumentsPage from './pages/MyDocumentsPage';
import ProfilePage from './pages/ProfilePage';
import TransactionsPage from './pages/TransactionsPage';

// Payment pages
import PaymentPage from './pages/Payment/PaymentPage';
import PaymentStatusPage from './pages/Payment/PaymentStatusPage';
import DownloadSuccessPage from './pages/Payment/DownloadSuccessPage';

// Admin pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminDocuments from './pages/Admin/AdminDocuments';
import AdminTransactions from './pages/Admin/AdminTransactions';
import AdminUsers from './pages/Admin/AdminUsers';

// Guards
const PrivateRoute = ({ children }) => {
    const isAuth = useAuthStore(s => s.isAuthenticated());
    return isAuth ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin } = useAuthStore();
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (!isAdmin()) return <Navigate to="/" replace />;
    return children;
};

const GuestRoute = ({ children }) => {
    const isAuth = useAuthStore(s => s.isAuthenticated());
    return !isAuth ? children : <Navigate to="/" replace />;
};

export default function App() {
    const { token, fetchMe } = useAuthStore();

    useEffect(() => {
        if (token) fetchMe();
    }, []);

    return (
        <Routes>
            {/* Public routes */}
            <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/documents/:id" element={<DocumentDetailPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/faq" element={<FaqPage />} />
                <Route path="/download-success" element={<DownloadSuccessPage />} />

                {/* Auth */}
                <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

                {/* Protected user routes */}
                <Route path="/my-documents" element={<PrivateRoute><MyDocumentsPage /></PrivateRoute>} />
                <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
                <Route path="/transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
                <Route path="/payment/:documentId" element={<PrivateRoute><PaymentPage /></PrivateRoute>} />
                <Route path="/payment/status/:reference" element={<PrivateRoute><PaymentStatusPage /></PrivateRoute>} />
            </Route>

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="documents" element={<AdminDocuments />} />
                <Route path="transactions" element={<AdminTransactions />} />
                <Route path="users" element={<AdminUsers />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
