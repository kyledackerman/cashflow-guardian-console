import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LoginDialog } from "./components/auth/LoginDialog";
import Index from "./pages/Index";
import PettyCash from "./pages/PettyCash";
import Employees from "./pages/Employees";
import EmployeeLoans from "./pages/EmployeeLoans";
import Garnishments from "./pages/Garnishments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="petty-cash" element={<PettyCash />} />
            <Route path="employees" element={<Employees />} />
            <Route path="loans" element={<EmployeeLoans />} />
            <Route path="garnishments" element={<Garnishments />} />
          </Route>
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
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
