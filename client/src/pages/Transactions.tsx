import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, Calendar, DollarSign, User as UserIcon, Wallet, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

type CashTopUpHistory = {
  id: number;
  amount: string;
  createdAt: Date;
  recipientName: string;
  addedByName: string;
};

export default function Transactions() {
  const [filters, setFilters] = useState({
    search: "",
    startDate: "",
    endDate: "",
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<CashTopUpHistory[]>({
    queryKey: ["/api/transactions"],
  });

  const resetFilters = () => {
    setFilters({
      search: "",
      startDate: "",
      endDate: "",
    });
  };

  // Filter transactions based on search and date range
  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = !filters.search || 
      transaction.recipientName.toLowerCase().includes(filters.search.toLowerCase()) ||
      transaction.addedByName.toLowerCase().includes(filters.search.toLowerCase());
    
    const transactionDate = new Date(transaction.createdAt);
    const matchesStartDate = !filters.startDate || transactionDate >= new Date(filters.startDate);
    const matchesEndDate = !filters.endDate || transactionDate <= new Date(filters.endDate);
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  }) || [];

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Cash Transactions</h1>
          <p className="text-xs text-gray-600">Cash received by workers</p>
        </div>
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-xs">Search User</Label>
              <Input
                id="search"
                placeholder="Search by name..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-xs">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-xs">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>
          
          <Button onClick={resetFilters} variant="outline" size="sm" className="h-8 text-xs">
            Clear Filters
          </Button>
        </CardContent>
      </Card>

      {/* Cash Transactions List */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-sm">Cash Top-up History</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : filteredTransactions && filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id} className="p-4 border-l-4 border-l-green-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <UserIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {transaction.recipientName}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Cash Recipient</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          ${parseFloat(transaction.amount).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Cash received</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {format(new Date(transaction.createdAt), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Given by: {transaction.addedByName}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No cash transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}