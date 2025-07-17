import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AuthErrorBoundary } from "./components/auth/AuthErrorBoundary";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AuthPage } from "./components/auth/AuthPage";
import Index from "./pages/Index";
import PettyCash from "./pages/PettyCash";
import Users from "./pages/Users";
import EmployeeLoans from "./pages/EmployeeLoans";
import EmployeeLoanRequest from "./pages/EmployeeLoanRequest";
import Garnishments from "./pages/Garnishments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Index />} />
            <Route path="petty-cash" element={<PettyCash />} />
            <Route path="users" element={<Users />} />
            <Route path="loans" element={<EmployeeLoans />} />
            <Route path="garnishments" element={<Garnishments />} />
          </Route>
          <Route path="loan-request" element={
            <ProtectedRoute>
              <EmployeeLoanRequest />
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <SupabaseAuthProvider>
        <AuthErrorBoundary>
          <AppContent />
        </AuthErrorBoundary>
      </SupabaseAuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;