import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import LoginPage from "@/pages/LoginPage";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import SubmitExpense from "@/pages/SubmitExpense";
import ExpenseHistory from "@/pages/ExpenseHistory";
import Approvals from "@/pages/Approvals";
import Reports from "@/pages/Reports";
import UserManagement from "@/pages/UserManagement";
import TopUpCash from "@/pages/TopUpCash";
import Transactions from "@/pages/Transactions";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LoginPage} />
        <Route path="/login" component={LoginPage} />
        <Route component={LoginPage} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" nest>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/submit-expense" component={SubmitExpense} />
            <Route path="/expenses" component={ExpenseHistory} />
            <Route path="/approvals" component={Approvals} />
            <Route path="/reports" component={Reports} />
            <Route path="/transactions" component={Transactions} />
            <Route path="/users" component={UserManagement} />
            <Route path="/topup" component={TopUpCash} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
