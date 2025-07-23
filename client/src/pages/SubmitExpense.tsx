import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Category } from "@/types";
import { ArrowLeft, Upload, DollarSign, FileText, Calendar, Tag, MessageSquare } from "lucide-react";
import { Link } from "wouter";

const expenseSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  amount: z.string().min(1, "Amount is required").refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  description: z.string().min(1, "Description is required"),
  remarks: z.string().optional(),
  expenseDate: z.string().min(1, "Expense date is required"),
  hasGst: z.boolean().default(false),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

export default function SubmitExpense() {
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      categoryId: "",
      amount: "",
      description: "",
      remarks: "",
      expenseDate: new Date().toISOString().split('T')[0],
      hasGst: false,
    },
  });

  const submitExpenseMutation = useMutation({
    mutationFn: async (data: ExpenseFormData) => {
      const formData = new FormData();
      formData.append('categoryId', data.categoryId);
      formData.append('amount', data.amount);
      formData.append('description', data.description);
      formData.append('remarks', data.remarks || '');
      formData.append('expenseDate', data.expenseDate);
      formData.append('hasGst', data.hasGst.toString());
      
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const response = await fetch('/api/expenses', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Expense submitted successfully - amount deducted from balance",
      });
      form.reset();
      setReceiptFile(null);
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
        description: "Failed to submit expense. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    submitExpenseMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit for PDFs, 5MB for images)
      const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: file.type === 'application/pdf' 
            ? "PDF file size must be less than 10MB" 
            : "Image file size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Only JPEG, PNG, GIF, and PDF files are allowed",
          variant: "destructive",
        });
        return;
      }
      
      setReceiptFile(file);
    }
  };

  if (categoriesLoading) {
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
          <h1 className="text-3xl font-bold">Submit Expense</h1>
          <p className="text-gray-600">
            Submit a new expense request for approval
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="categoryId">
                      <Tag className="h-4 w-4 inline mr-2" />
                      Category
                    </Label>
                    <Select
                      value={form.watch("categoryId") || ""}
                      onValueChange={(value) => form.setValue("categoryId", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.categoryId && (
                      <p className="text-sm text-red-600">
                        {form.formState.errors.categoryId.message}
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasGst"
                    checked={form.watch("hasGst")}
                    onCheckedChange={(checked) => form.setValue("hasGst", !!checked)}
                  />
                  <Label htmlFor="hasGst" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Include GST (9%)
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    <FileText className="h-4 w-4 inline mr-2" />
                    Description
                  </Label>
                  <Input
                    id="description"
                    placeholder="Brief description of the expense"
                    {...form.register("description")}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">
                    <MessageSquare className="h-4 w-4 inline mr-2" />
                    Remarks (Optional)
                  </Label>
                  <Textarea
                    id="remarks"
                    placeholder="Additional details or justification"
                    rows={3}
                    {...form.register("remarks")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expenseDate">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Expense Date
                  </Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    {...form.register("expenseDate")}
                  />
                  {form.formState.errors.expenseDate && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.expenseDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt">
                    <Upload className="h-4 w-4 inline mr-2" />
                    Receipt/Invoice (Optional)
                  </Label>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-gray-600">
                    Upload receipt or invoice (JPG, PNG, GIF, PDF - Max 5MB for images, 10MB for PDF)
                  </p>
                  {receiptFile && (
                    <p className="text-sm text-green-600">
                      Selected: {receiptFile.name}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Reset
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitExpenseMutation.isPending}
                  >
                    {submitExpenseMutation.isPending ? (
                      <div className="loading mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Submit Expense
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Guidelines */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Submission Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-sm">Include clear receipt images or PDF invoices</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-sm">Provide detailed descriptions</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-sm">Submit within 30 days</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-sm">Select appropriate category</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <p className="text-sm">Maximum amount: $500</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
