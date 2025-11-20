import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Employees from "./pages/Employees";
import AttendanceReport from "./pages/AttendanceReport";
import MarkAttendance from "./pages/MarkAttendance";
import FuelEntry from "./pages/FuelEntry";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <>
              <Navigation />
              <Index />
            </>
          } />
          <Route path="/employees" element={
            <>
              <Navigation />
              <Employees />
            </>
          } />
          <Route path="/reports" element={
            <>
              <Navigation />
              <AttendanceReport />
            </>
          } />
          <Route path="/mark-attendance" element={
            <>
              <Navigation />
              <MarkAttendance />
            </>
          } />
          <Route path="/fuel" element={
            <>
              <Navigation />
              <FuelEntry />
            </>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
