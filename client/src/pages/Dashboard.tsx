import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { DashboardStats, ExpenseWithDetails } from "@/types";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, subMonths } from "date-fns";

interface UserStats {
  userId: string;
  userName: string;
  email: string;
  cashIn: number;
  amountSpent: number;
  balance: number;
  pendingExpenses: number;
}

interface DashboardStatsWithUsers extends DashboardStats {
  userBreakdown?: UserStats[];
}
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  FileText, 
  PlusCircle, 
  Wallet, 
  Download,
  CalendarIcon
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  // Date range state
  const [dateRange, setDateRange] = useState<string>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  
  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'last7Days':
        return {
          startDate: format(subDays(now, 7), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd')
        };
      case 'thisMonth':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      case 'lastMonth':
        const lastMonth = subMonths(now, 1);
        return {
          startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        };
      case 'custom':
        return {
          startDate: customStartDate ? format(customStartDate, 'yyyy-MM-dd') : undefined,
          endDate: customEndDate ? format(customEndDate, 'yyyy-MM-dd') : undefined
        };
      default:
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(endOfMonth(now), 'yyyy-MM-dd')
        };
    }
  };
  
  const { startDate, endDate } = getDateRange();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStatsWithUsers>({
    queryKey: ["/api/dashboard/stats", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/dashboard/stats?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const { data: recentExpenses, isLoading: expensesLoading } = useQuery<ExpenseWithDetails[]>({
    queryKey: ["/api/expenses", startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(`/api/expenses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      return response.json();
    },
    select: (data) => data?.slice(0, 5) || [],
  });

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
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

  if (statsLoading || expensesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user?.firstName || 'User'}!
          </p>
        </div>
        <Link href="/submit-expense">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Expense
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Link href="/submit-expense">
          <div className="quick-action-btn quick-action-primary p-3">
            <PlusCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Submit Expense</span>
          </div>
        </Link>
        {user?.role === 'admin' && (
          <Link href="/topup">
            <div className="quick-action-btn quick-action-success p-3">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium">Top Up Cash</span>
            </div>
          </Link>
        )}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <Link href="/reports">
            <div className="quick-action-btn quick-action-warning p-3">
              <Download className="h-5 w-5" />
              <span className="text-sm font-medium">Export Reports</span>
            </div>
          </Link>
        )}
      </div>

      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Date Range:</span>
          </div>
          
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last7Days">Last 7 Days</SelectItem>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          {dateRange === 'custom' && (
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32 justify-start text-left font-normal">
                    {customStartDate ? format(customStartDate, 'MMM dd, yyyy') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-gray-500">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-32 justify-start text-left font-normal">
                    {customEndDate ? format(customEndDate, 'MMM dd, yyyy') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {dateRange !== 'custom' && (
            <span className="text-sm text-gray-500">
              {dateRange === 'last7Days' && `${format(subDays(new Date(), 7), 'MMM dd')} - ${format(new Date(), 'MMM dd, yyyy')}`}
              {dateRange === 'thisMonth' && `${format(startOfMonth(new Date()), 'MMM dd')} - ${format(endOfMonth(new Date()), 'MMM dd, yyyy')}`}
              {dateRange === 'lastMonth' && (() => {
                const lastMonth = subMonths(new Date(), 1);
                return `${format(startOfMonth(lastMonth), 'MMM dd')} - ${format(endOfMonth(lastMonth), 'MMM dd, yyyy')}`;
              })()}
            </span>
          )}
        </div>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">
                {user?.role === 'staff' ? 'My Cash-In' : 'Total Cash-In'}
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(stats?.totalCashIn || 0)}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">
                {user?.role === 'staff' ? 'My Amount Spent' : 'Total Amount Spent'}
              </p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(stats?.totalSpent || 0)}
              </p>
              <p className="text-xs text-gray-500">Inc. pending</p>
            </div>
            <div className="p-2 bg-red-100 rounded-full">
              <TrendingUp className="h-4 w-4 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">
                {user?.role === 'staff' ? 'My Balance' : 'Total Balance'}
              </p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(stats?.totalBalance || 0)}
              </p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">
                {user?.role === 'staff' ? 'My Pending' : 'Total Pending'}
              </p>
              <p className="text-lg font-bold text-yellow-600">
                {formatCurrency(stats?.pendingExpenses || 0)}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-full">
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentExpenses?.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{expense.description}</p>
                      <p className="text-xs text-gray-600">
                        {expense.category?.name || 'Unknown Category'} • {new Date(expense.expenseDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-2">
                      <span className="font-semibold text-sm">
                        {formatCurrency(expense.amount)}
                      </span>
                      <Badge className={`expense-status ${getStatusColor(expense.status)} text-xs px-2 py-1`}>
                        {expense.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {(!recentExpenses || recentExpenses.length === 0) && (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No recent expenses found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {stats.categoryBreakdown.slice(0, 5).map((category: any) => (
                    <div key={category.categoryId} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{category.categoryName}</div>
                        <div className="text-xs text-gray-500">{category.expenseCount} expense{category.expenseCount !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">{formatCurrency(category.totalSpent)}</div>
                      </div>
                    </div>
                  ))}
                  {stats.categoryBreakdown.length > 5 && (
                    <div className="text-center pt-2">
                      <Link href="/reports">
                        <Button variant="outline" size="sm">
                          View All Categories
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm text-gray-600">
                    No expenses recorded yet
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* User-wise breakdown for Admin/Manager */}
      {(user?.role === 'admin' || user?.role === 'manager') && stats?.userBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>User-wise Cash Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-right py-3 px-4">Cash In</th>
                    <th className="text-right py-3 px-4">Amount Spent</th>
                    <th className="text-right py-3 px-4">Pending</th>
                    <th className="text-right py-3 px-4">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.userBreakdown.map((userStat) => (
                    <tr key={userStat.userId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{userStat.userName}</div>
                          <div className="text-sm text-gray-500">{userStat.email}</div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-green-600">
                        {formatCurrency(userStat.cashIn)}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-red-600">
                        {formatCurrency(userStat.amountSpent)}
                      </td>
                      <td className="text-right py-3 px-4 font-medium text-yellow-600">
                        {formatCurrency(userStat.pendingExpenses)}
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        <span className={userStat.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(userStat.balance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
