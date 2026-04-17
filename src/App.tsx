import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "./pages/Dashboard";
import KanbanPage from "./pages/KanbanPage";
import LeadsPage from "./pages/LeadsPage";
import CasasPage from "./pages/CasasPage";
import PaineisPage from "./pages/PaineisPage";
import DepositosPage from "./pages/DepositosPage";
import CpaPage from "./pages/CpaPage";
import CustosPage from "./pages/CustosPage";
import ResumoCasasPage from "./pages/ResumoCasasPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<KanbanPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/casas" element={<CasasPage />} />
            <Route path="/paineis" element={<PaineisPage />} />
            <Route path="/depositos" element={<DepositosPage />} />
            <Route path="/cpa" element={<CpaPage />} />
            <Route path="/custos" element={<CustosPage />} />
            <Route path="/resumo-casas" element={<ResumoCasasPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
