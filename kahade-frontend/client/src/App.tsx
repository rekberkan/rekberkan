import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

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

function Router() {
  return (
    <Switch>
      {/* Landing Pages */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/contact" component={Contact} />
      
      {/* Auth Pages */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
      {/* User Dashboard - app.kahade.com */}
      <Route path="/app" component={Dashboard} />
      <Route path="/app/transactions" component={Transactions} />
      <Route path="/app/transactions/new" component={CreateTransaction} />
      <Route path="/app/transactions/:id" component={TransactionDetail} />
      <Route path="/app/wallet" component={Wallet} />
      <Route path="/app/notifications" component={Notifications} />
      <Route path="/app/profile" component={Profile} />
      <Route path="/app/settings" component={Settings} />
      
      {/* Admin Dashboard */}
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/transactions" component={AdminTransactions} />
      <Route path="/admin/disputes" component={AdminDisputes} />
      <Route path="/admin/audit-logs" component={AdminAuditLogs} />
      <Route path="/admin/settings" component={AdminSettings} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system">
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
