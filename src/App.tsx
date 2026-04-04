import { forwardRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppGate } from "@/components/shared/AppGate";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import Index from "./pages/Index.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App = forwardRef<HTMLDivElement>((_, ref) => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AppGate>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ErrorBoundary>
                <div ref={ref}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/admin" element={<AdminPage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </div>
              </ErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </AppGate>
    </QueryClientProvider>
  </ErrorBoundary>
));

App.displayName = "App";

export default App;
