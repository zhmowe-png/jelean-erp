import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { CustomerList } from "./pages/CustomerList";
import { CustomerDetail } from "./pages/CustomerDetail";
import { DeliveryList } from "./pages/DeliveryList";
import { DeliveryForm } from "./pages/DeliveryForm";
import { DeliveryDetail } from "./pages/DeliveryDetail";
import { Billing } from "./pages/Billing";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="delivery-notes" element={<DeliveryList />} />
              <Route path="delivery-notes/new" element={<DeliveryForm />} />
              <Route path="delivery-notes/:id/edit" element={<DeliveryForm />} />
              <Route path="delivery-notes/:id" element={<DeliveryDetail />} />
              <Route path="billing" element={<Billing />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
