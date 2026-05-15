import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
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
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />
            <Route path="delivery-notes" element={<DeliveryList />} />
            <Route path="delivery-notes/new" element={<DeliveryForm />} />
            <Route path="delivery-notes/:id" element={<DeliveryDetail />} />
            <Route path="billing" element={<Billing />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
