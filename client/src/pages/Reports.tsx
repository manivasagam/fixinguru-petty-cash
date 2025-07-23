import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ExpenseWithDetails, Category, ReportFilters } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { 
  FileText, 
  Download, 
  BarChart3, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  ArrowLeft 
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: reportData, isLoading } = useQuery<ExpenseWithDetails[]>({
    queryKey: ["/api/reports/expenses", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.categoryId) params.append('categoryId', filters.categoryId.toString());
      if (filters.status) params.append('status', filters.status);
      
      const response = await fetch(`/api/reports/expenses?${params.toString()}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      
      return response.json();
    },
  });

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const exportCSV = () => {
    if (!reportData || reportData.length === 0) {
      toast({
        title: "No Data",
        description: "No expenses found to export with current filters",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const headers = ['Date', 'User', 'Category', 'Description', 'Amount', 'GST', 'Total', 'Status', 'Approved By', 'Approved Date'];
      const csvData = reportData.map(expense => [
        new Date(expense.expenseDate).toLocaleDateString(),
        `${expense.user.firstName || ''} ${expense.user.lastName || ''}`.trim() || expense.user.email || 'Unknown',
        expense.category?.name || 'Unknown Category',
        expense.description,
        expense.amount,
        expense.gstAmount || '0',
        (parseFloat(expense.amount) + parseFloat(expense.gstAmount || '0')).toFixed(2),
        expense.status,
        expense.approver ? `${expense.approver.firstName || ''} ${expense.approver.lastName || ''}`.trim() || expense.approver.email : '',
        expense.approvedAt ? new Date(expense.approvedAt).toLocaleDateString() : ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expense_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Exported ${reportData.length} expenses to CSV`,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export CSV file",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (user?.role === 'staff') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Only managers and administrators can access the reports section.
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

  const expenses = reportData || [];
  
  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');
  const pendingExpenses = expenses.filter(exp => exp.status === 'pending');
  const rejectedExpenses = expenses.filter(exp => exp.status === 'rejected');
  
  const approvedAmount = approvedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const pendingAmount = pendingExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const rejectedAmount = rejectedExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Category breakdown
  const categoryBreakdown = categories?.map(category => {
    const categoryExpenses = expenses.filter(exp => exp.categoryId === category.id);
    const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    return {
      category: category.name,
      amount: categoryTotal,
      count: categoryExpenses.length,
      percentage: totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0,
    };
  }).filter(item => item.amount > 0) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">
            Generate comprehensive expense reports
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={exportCSV} disabled={!reportData || reportData.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV ({reportData?.length || 0} records)
          </Button>
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
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={filters.categoryId?.toString() || ""}
                onValueChange={(value) => handleFilterChange('categoryId', value === "all" ? "" : value)}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status || ""}
                onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}
              >
                <SelectTrigger>
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
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Expenses
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Approved
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(approvedAmount)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(pendingAmount)}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Rejected
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(rejectedAmount)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <FileText className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Approved</span>
              <span className="text-sm font-bold text-green-600">
                {formatCurrency(approvedAmount)}
              </span>
            </div>
            <Progress 
              value={totalExpenses > 0 ? (approvedAmount / totalExpenses) * 100 : 0} 
              className="h-2" 
            />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Pending</span>
              <span className="text-sm font-bold text-yellow-600">
                {formatCurrency(pendingAmount)}
              </span>
            </div>
            <Progress 
              value={totalExpenses > 0 ? (pendingAmount / totalExpenses) * 100 : 0} 
              className="h-2" 
            />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Rejected</span>
              <span className="text-sm font-bold text-red-600">
                {formatCurrency(rejectedAmount)}
              </span>
            </div>
            <Progress 
              value={totalExpenses > 0 ? (rejectedAmount / totalExpenses) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoryBreakdown.map((item) => (
              <div key={item.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{item.category}</span>
                  <span className="text-sm font-bold">
                    {formatCurrency(item.amount)} ({item.count} expenses)
                  </span>
                </div>
                <Progress value={item.percentage} className="h-2" />
              </div>
            ))}
            
            {categoryBreakdown.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No expense data available for the selected period.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
