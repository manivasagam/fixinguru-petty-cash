import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExpenseWithDetails } from "@/types";
import { 
  X, 
  User, 
  Calendar, 
  DollarSign, 
  Tag, 
  FileText, 
  MessageSquare,
  Receipt,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseWithDetails | null;
  onViewReceipt?: (receiptUrl: string) => void;
}

export function ExpenseModal({ isOpen, onClose, expense, onViewReceipt }: ExpenseModalProps) {
  if (!expense) return null;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Expense Details</span>
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={expense.user.profileImageUrl || undefined} />
                <AvatarFallback>
                  {getInitials(expense.user.firstName, expense.user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {expense.user.firstName && expense.user.lastName
                    ? `${expense.user.firstName} ${expense.user.lastName}`
                    : expense.user.email
                  }
                </p>
                <p className="text-sm text-gray-500">{expense.user.department}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{formatCurrency(expense.amount)}</p>
              <Badge className={`expense-status ${getStatusColor(expense.status)} flex items-center gap-1`}>
                {getStatusIcon(expense.status)}
                {expense.status}
              </Badge>
            </div>
          </div>

          {/* Expense Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Expense Date</p>
                  <p>{new Date(expense.expenseDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Tag className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p>{expense.category?.name || 'Unknown Category'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p>{formatCurrency(expense.amount)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p>{expense.description}</p>
                </div>
              </div>

              {expense.remarks && (
                <div className="flex items-start space-x-3">
                  <MessageSquare className="h-5 w-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium">Remarks</p>
                    <p>{expense.remarks}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Receipt */}
          {expense.receiptUrl && (
            <div className="space-y-2">
              <p className="text-sm font-medium flex items-center">
                <Receipt className="h-4 w-4 mr-2" />
                Receipt
              </p>
              <div className="flex items-center space-x-4">
                <img
                  src={expense.receiptUrl}
                  alt="Receipt"
                  className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80"
                  onClick={() => onViewReceipt?.(expense.receiptUrl!)}
                />
                <Button
                  variant="outline"
                  onClick={() => onViewReceipt?.(expense.receiptUrl!)}
                >
                  View Full Size
                </Button>
              </div>
            </div>
          )}

          {/* Approval Info */}
          {expense.status !== 'pending' && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Approval Information</h4>
              <div className="space-y-2">
                {expense.approver && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {expense.status === 'approved' ? 'Approved by' : 'Rejected by'}:{' '}
                      {expense.approver.firstName && expense.approver.lastName
                        ? `${expense.approver.firstName} ${expense.approver.lastName}`
                        : expense.approver.email
                      }
                    </span>
                  </div>
                )}
                {expense.approvedAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {expense.status === 'approved' ? 'Approved on' : 'Rejected on'}:{' '}
                      {new Date(expense.approvedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {expense.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{expense.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Timeline</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">
                  Created on {new Date(expense.createdAt).toLocaleDateString()}
                </span>
              </div>
              {expense.approvedAt && (
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    expense.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm">
                    {expense.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                    {new Date(expense.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
