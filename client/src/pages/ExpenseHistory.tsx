import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExpenseWithDetails, Category, ExpenseFilters, User } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { ReceiptModal } from "@/components/ReceiptModal";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Calendar,
  PlusCircle,
  ArrowLeft,
  Printer
} from "lucide-react";
import { Link } from "wouter";

export default function ExpenseHistory() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ExpenseFilters>({});
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch users for filter (only for admin/manager)
  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === 'admin' || user?.role === 'manager',
  });

  const { data: expenses, isLoading } = useQuery<ExpenseWithDetails[]>({
    queryKey: ["/api/expenses", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.userId) params.append('userId', filters.userId);
      
      const response = await fetch(`/api/expenses?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses');
      }
      
      return response.json();
    },
  });

  const handleFilterChange = (key: keyof ExpenseFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
    }).format(num);
  };

  const exportCSV = () => {
    if (!expenses || expenses.length === 0) {
      alert('No data to export');
      return;
    }

    // Define headers based on user role - include user info for managers/admins
    const headers = user?.role === 'admin' || user?.role === 'manager' 
      ? ['User', 'Date', 'Category', 'Description', 'Amount', 'GST', 'Total', 'Status', 'Receipt']
      : ['Submitted By', 'Date', 'Category', 'Description', 'Amount', 'GST', 'Total', 'Status', 'Receipt'];

    const rows = expenses.map(expense => {
      const baseAmount = parseFloat(expense.amount);
      const gstAmount = expense.hasGst ? parseFloat(expense.gstAmount || '0') : 0;
      const totalAmount = baseAmount + gstAmount;

      const commonData = [
        new Date(expense.expenseDate).toLocaleDateString(),
        expense.category?.name || 'Unknown',
        expense.description,
        formatCurrency(baseAmount),
        expense.hasGst ? formatCurrency(gstAmount) : 'No GST',
        formatCurrency(totalAmount),
        expense.status,
        expense.receiptUrl ? 'Yes' : 'No'
      ];

      // Add user information based on role
      if (user?.role === 'admin' || user?.role === 'manager') {
        const userName = expense.user 
          ? `${expense.user.firstName || ''} ${expense.user.lastName || ''}`.trim() || expense.user.email
          : 'Unknown User';
        return [userName, ...commonData];
      } else {
        const currentUserName = user 
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email
          : 'Me';
        return [currentUserName, ...commonData];
      }
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-history-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const printExpenses = () => {
    if (!expenses || expenses.length === 0) {
      alert('No data to print');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Expense History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 24px; font-weight: bold; color: #333; }
            .report-title { font-size: 18px; margin: 10px 0; }
            .date-range { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-approved { color: #22c55e; }
            .status-pending { color: #eab308; }
            .status-rejected { color: #ef4444; }
            .summary { margin-top: 20px; text-align: right; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Fixinguru</div>
            <div class="report-title">Expense History Report</div>
            <div class="date-range">Generated on ${new Date().toLocaleDateString()}</div>
            ${user?.firstName && user?.lastName ? `<div class="date-range">For: ${user.firstName} ${user.lastName}</div>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                ${user?.role === 'admin' || user?.role === 'manager' ? '<th>User</th>' : '<th>Submitted By</th>'}
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount (SGD)</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              ${expenses.map(expense => {
                const userName = user?.role === 'admin' || user?.role === 'manager' 
                  ? (expense.user ? `${expense.user.firstName || ''} ${expense.user.lastName || ''}`.trim() || expense.user.email : 'Unknown User')
                  : (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : 'Me');
                
                return `
                <tr>
                  <td>${userName}</td>
                  <td>${new Date(expense.expenseDate).toLocaleDateString()}</td>
                  <td>${expense.category?.name || 'Unknown'}</td>
                  <td>${expense.description}</td>
                  <td>${formatCurrency(expense.amount)}</td>
                  <td class="status-${expense.status}">${expense.status.toUpperCase()}</td>
                  <td>${expense.receiptUrl ? 'Yes' : 'No'}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <strong>Total Expenses: ${expenses.length}</strong><br>
            <strong>Total Amount: ${formatCurrency(expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0))}</strong>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Expense History</h1>
          <p className="text-gray-600">
            View and manage your expense records
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={printExpenses}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Link href="/submit-expense">
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Expense
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium">Category</label>
              <Select
                value={filters.categoryId?.toString() || ""}
                onValueChange={(value) => handleFilterChange('categoryId', value === "all" ? "" : value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Filter - Only for Admin/Manager */}
            {(user?.role === 'admin' || user?.role === 'manager') && (
              <div className="space-y-2">
                <label className="text-xs font-medium">User</label>
                <Select
                  value={filters.userId || ""}
                  onValueChange={(value) => handleFilterChange('userId', value === "all" ? "" : value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users?.map((userItem) => (
                      <SelectItem key={userItem.id} value={userItem.id}>
                        {userItem.firstName} {userItem.lastName} ({userItem.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-medium">Status</label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">From Date</label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="h-8"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium">To Date</label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="h-8"
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search expenses..."
                value={filters.search || ""}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full h-8"
              />
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-3">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                {(user?.role === 'admin' || user?.role === 'manager') && (
                  <TableHead className="text-xs">User</TableHead>
                )}
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Receipt</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses?.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="text-xs">
                    {new Date(expense.expenseDate).toLocaleDateString()}
                  </TableCell>
                  {(user?.role === 'admin' || user?.role === 'manager') && (
                    <TableCell className="text-xs">
                      {expense.user ? `${expense.user.firstName} ${expense.user.lastName}` : 'Unknown'}
                    </TableCell>
                  )}
                  <TableCell className="text-xs">{expense.category?.name || 'Unknown Category'}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs">
                    {expense.description}
                  </TableCell>
                  <TableCell className="font-semibold text-xs">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge className={`expense-status ${getStatusColor(expense.status)} text-xs px-2 py-1`}>
                      {expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {expense.receiptUrl && (
                      <img
                        src={expense.receiptUrl}
                        alt="Receipt"
                        className="receipt-preview w-12 h-12"
                        onClick={() => setSelectedReceipt(expense.receiptUrl)}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                        <Eye className="h-3 w-3" />
                      </Button>
                      {expense.status === 'pending' && (
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>

          {(!expenses || expenses.length === 0) && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No expenses found. 
              <Link href="/submit-expense">
                <Button variant="link" size="sm">Submit your first expense</Button>
              </Link>
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
