import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User, UserWithStats } from "@/types";
import { ArrowLeft, DollarSign, Plus, Banknote, CreditCard, User as UserIcon, Wallet, Clock, History, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Link } from "wouter";

// Cash Top-up History Component
function CashTopUpHistory() {
  const { data: topUps, isLoading } = useQuery({
    queryKey: ["/api/cash-topups-history"],
    queryFn: async () => {
      const response = await fetch("/api/cash-topups-history", {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch top-up history');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topUps && topUps.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-xs">
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Technician</th>
                <th className="text-right py-2 px-2">Amount</th>
                <th className="text-left py-2 px-2">Added By</th>
              </tr>
            </thead>
            <tbody>
              {topUps.slice(0, 10).map((topUp: any) => (
                <tr key={topUp.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-2 text-xs text-gray-600">
                    {new Date(topUp.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2 text-sm font-medium">
                    {topUp.recipientName}
                  </td>
                  <td className="text-right py-2 px-2 font-semibold text-green-600">
                    ${topUp.amount}
                  </td>
                  <td className="py-2 px-2 text-xs text-gray-600">
                    {topUp.addedByName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <History className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No cash top-ups recorded yet</p>
        </div>
      )}
    </div>
  );
}

const addCashSchema = z.object({
  userId: z.string().min(1, "User is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  date: z.date({
    required_error: "Please select a date",
  }),
});

type AddCashFormData = z.infer<typeof addCashSchema>;

export default function TopUpCash() {
  const { toast } = useToast();

  const { data: users, isLoading: usersLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/users"],
  });

  const form = useForm<AddCashFormData>({
    resolver: zodResolver(addCashSchema),
    defaultValues: {
      userId: "",
      amount: "",
      date: new Date(),
    },
  });

  const addCashMutation = useMutation({
    mutationFn: async (data: AddCashFormData) => {
      return await apiRequest("POST", "/api/add-cash", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Cash added to user successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
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
        description: error.message || "Failed to add cash",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddCashFormData) => {
    // Convert date to ISO string for API
    const submitData = {
      userId: data.userId,
      amount: data.amount,
      date: data.date.toISOString().split('T')[0] // Send as YYYY-MM-DD format
    };
    addCashMutation.mutate(submitData as any);
  };

  const staffUsers = users?.filter(user => user.role === 'staff') || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Cash Management</h1>
          <p className="text-gray-600">Add cash to technician accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Cash to User</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">
                      <UserIcon className="h-4 w-4 inline mr-2" />
                      Technician
                    </Label>
                    <Select
                      value={form.watch("userId") || ""}
                      onValueChange={(value) => form.setValue("userId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select technician" />
                      </SelectTrigger>
                      <SelectContent>
                        {staffUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user.firstName || user.lastName || user.email
                            }
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.userId && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.userId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      <DollarSign className="h-4 w-4 inline mr-2" />
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register("amount")}
                    />
                    {form.formState.errors.amount && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.amount.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    <CalendarIcon className="h-4 w-4 inline mr-2" />
                    Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("date") ? format(form.watch("date"), "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("date")}
                        onSelect={(date) => form.setValue("date", date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.date && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.date.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={addCashMutation.isPending}
                  className="w-full"
                >
                  {addCashMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Cash
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Cash Top-up History */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Recent Cash Top-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <CashTopUpHistory />
            </CardContent>
          </Card>

          {/* User Balances */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Technician Balances</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Technician</th>
                        <th className="text-right py-2 px-3">Balance</th>
                        <th className="text-center py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-blue-100 rounded-full">
                                <UserIcon className="h-3 w-3 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium text-sm">{user.firstName} {user.lastName}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-3 px-3 font-semibold">
                            ${user.balance || 0}
                          </td>
                          <td className="text-center py-3 px-3">
                            <Badge variant={user.isActive ? "default" : "secondary"} className="text-xs">
                              {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {staffUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No technicians found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Cash Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">How it works</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Add cash to technician accounts so they can submit expenses. The balance will be deducted when expenses are approved.
                </p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Team Members</h4>
                <ul className="text-sm text-green-700 mt-1 space-y-1">
                  <li>• Ali (Technician)</li>
                  <li>• Sajjad (Technician)</li>
                  <li>• Amin (Technician)</li>
                  <li>• Guna (Technician)</li>
                  <li>• Isaac (Technician)</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-900">Important</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Only add cash that has been physically allocated to the petty cash fund. All transactions are tracked and auditable.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}