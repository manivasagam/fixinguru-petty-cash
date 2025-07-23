import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExpenseWithDetails } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ReceiptModal } from "@/components/ReceiptModal";
import { useState } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  DollarSign, 
  Users, 
  AlertCircle,
  ArrowLeft 
} from "lucide-react";
import { Link } from "wouter";

export default function Approvals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedExpenseId, setSelectedExpenseId] = useState<number | null>(null);

  const { data: expenses, isLoading } = useQuery<ExpenseWithDetails[]>({
    queryKey: ["/api/expenses", { status: "pending" }],
    queryFn: async () => {
      const response = await fetch("/api/expenses?status=pending", {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending expenses');
      }
      
      return response.json();
    },
  });

  const approveExpenseMutation = useMutation({
    mutationFn: async (expenseId: number) => {
      return await apiRequest("PUT", `/api/expenses/${expenseId}/status`, {
        status: "approved",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense approved successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to approve expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const rejectExpenseMutation = useMutation({
    mutationFn: async ({ expenseId, reason }: { expenseId: number; reason: string }) => {
      return await apiRequest("PUT", `/api/expenses/${expenseId}/status`, {
        status: "rejected",
        rejectionReason: reason,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense rejected successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setRejectionReason("");
      setSelectedExpenseId(null);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to reject expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (expenseId: number) => {
    approveExpenseMutation.mutate(expenseId);
  };

  const handleReject = (expenseId: number, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    rejectExpenseMutation.mutate({ expenseId, reason });
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  if (user?.role === 'staff') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Only managers and administrators can access the approvals section.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  const pendingExpenses = expenses || [];
  const totalPendingAmount = pendingExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pending Approvals</h1>
          <p className="text-gray-600">
            Review and approve expense requests
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className="px-4 py-2">
            {pendingExpenses.length} pending
          </Badge>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Requests
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingExpenses.length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(totalPendingAmount)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Unique Employees
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {new Set(pendingExpenses.map(e => e.userId)).size}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approvals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses Awaiting Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={expense.user?.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(expense.user?.firstName || null, expense.user?.lastName || null)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {expense.user?.firstName && expense.user?.lastName
                            ? `${expense.user.firstName} ${expense.user.lastName}`
                            : expense.user?.email || 'Unknown User'
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {expense.user?.department || ''}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{expense.category?.name || 'Unknown'}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {expense.description}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    {expense.receiptUrl && (
                      <img
                        src={expense.receiptUrl}
                        alt="Receipt"
                        className="receipt-preview w-16 h-16"
                        onClick={() => setSelectedReceipt(expense.receiptUrl)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(expense.id)}
                        disabled={approveExpenseMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExpenseId(expense.id)}
                          >
                            <XCircle className="h-4 w-4 text-red-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reject Expense</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                              Please provide a reason for rejecting this expense:
                            </p>
                            <Textarea
                              placeholder="Enter rejection reason..."
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              rows={3}
                            />
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" onClick={() => {
                                setRejectionReason("");
                                setSelectedExpenseId(null);
                              }}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => selectedExpenseId && handleReject(selectedExpenseId, rejectionReason)}
                                disabled={rejectExpenseMutation.isPending}
                              >
                                {rejectExpenseMutation.isPending ? (
                                  <div className="loading mr-2" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-2" />
                                )}
                                Reject
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pendingExpenses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p>All expenses have been processed!</p>
              <p className="text-sm">No pending approvals at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        receiptUrl={selectedReceipt}
      />
    </div>
  );
}
