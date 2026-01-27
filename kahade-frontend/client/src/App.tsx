import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { getAppMode, navigateToApp, navigateToAdmin, canAccessAdmin } from "./config/app.config";
import { ReactNode, useEffect } from "react";

// Landing Pages
import Home from "./pages/Home";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// User Dashboard Pages
import Dashboard from "./pages/dashboard/Dashboard";
import Transactions from "./pages/dashboard/Transactions";
import TransactionDetail from "./pages/dashboard/TransactionDetail";
import CreateTransaction from "./pages/dashboard/CreateTransaction";
import Wallet from "./pages/dashboard/Wallet";
import Notifications from "./pages/dashboard/Notifications";
import Profile from "./pages/dashboard/Profile";
import Settings from "./pages/dashboard/Settings";

// Admin Dashboard Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";

// Protected Route Component
function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login on landing page
    window.location.href = `${import.meta.env.VITE_LANDING_URL || ''}/login`;
    return null;
  }

  return <>{children}</>;
}

// Admin Protected Route Component
function AdminProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = `${import.meta.env.VITE_LANDING_URL || ''}/login`;
    return null;
  }

  if (!canAccessAdmin(user)) {
    // Redirect non-admin users to user app
    navigateToApp();
    return null;
  }

  return <>{children}</>;
}

// Landing Router - for domain.com
function LandingRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// App Router - for app.domain.com
function AppRouter() {
  return (
    <Switch>
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/transactions">
        <ProtectedRoute>
          <Transactions />
        </ProtectedRoute>
      </Route>
      <Route path="/transactions/new">
        <ProtectedRoute>
          <CreateTransaction />
        </ProtectedRoute>
      </Route>
      <Route path="/transactions/:id">
        {(params) => (
          <ProtectedRoute>
            <TransactionDetail />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/wallet">
        <ProtectedRoute>
          <Wallet />
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <Notifications />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Admin Router - for admin.domain.com
function AdminRouter() {
  return (
    <Switch>
      <Route path="/">
        <AdminProtectedRoute>
          <AdminDashboard />
        </AdminProtectedRoute>
      </Route>
      <Route path="/users">
        <AdminProtectedRoute>
          <AdminUsers />
        </AdminProtectedRoute>
      </Route>
      <Route path="/transactions">
        <AdminProtectedRoute>
          <AdminTransactions />
        </AdminProtectedRoute>
      </Route>
      <Route path="/disputes">
        <AdminProtectedRoute>
          <AdminDisputes />
        </AdminProtectedRoute>
      </Route>
      <Route path="/audit-logs">
        <AdminProtectedRoute>
          <AdminAuditLogs />
        </AdminProtectedRoute>
      </Route>
      <Route path="/settings">
        <AdminProtectedRoute>
          <AdminSettings />
        </AdminProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Main Router - selects based on app mode
function Router() {
  const appMode = getAppMode();

  switch (appMode) {
    case 'admin':
      return <AdminRouter />;
    case 'app':
      return <AppRouter />;
    case 'landing':
    default:
      return <LandingRouter />;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster 
              position="top-right"
              toastOptions={{
                className: 'glass-card',
              }}
            />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
