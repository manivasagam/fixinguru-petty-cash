import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserWithStats } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { X, User, Mail, Building, Shield } from "lucide-react";

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["admin", "manager", "staff"]),
  department: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserWithStats | null;
  onRoleChange?: (userId: string, role: string) => void;
  onUserCreated?: () => void;
}

export function UserModal({ isOpen, onClose, user, onRoleChange, onUserCreated }: UserModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "staff",
      department: "",
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      return await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onUserCreated?.();
      onClose();
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
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role,
        department: user.department || "",
      });
      setIsEditing(false);
    } else {
      form.reset();
      setIsEditing(true);
    }
  }, [user, form]);

  const onSubmit = (data: UserFormData) => {
    if (user) {
      // Editing existing user - only update role if changed
      if (onRoleChange && data.role !== user.role) {
        onRoleChange(user.id, data.role);
      }
      onClose();
    } else {
      // Creating new user
      createUserMutation.mutate(data);
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'role-admin';
      case 'manager':
        return 'role-manager';
      case 'staff':
        return 'role-staff';
      default:
        return 'role-staff';
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>{user ? 'User Details' : 'Add New User'}</span>
            </DialogTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Header */}
          {user && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email
                    }
                  </h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={`role-badge ${getRoleColor(user.role)}`}>
                      {user.role}
                    </Badge>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? 'Cancel' : 'Edit'}
              </Button>
            </div>
          )}

          {/* User Statistics */}
          {user && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {user.totalExpenses || 0}
                </p>
                <p className="text-sm text-blue-600">Total Expenses</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {user.approvedExpenses || 0}
                </p>
                <p className="text-sm text-green-600">Approved</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">
                  {user.pendingExpenses || 0}
                </p>
                <p className="text-sm text-yellow-600">Pending</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">
                  {user.rejectedExpenses || 0}
                </p>
                <p className="text-sm text-red-600">Rejected</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">
                  <User className="h-4 w-4 inline mr-2" />
                  First Name
                </Label>
                <Input
                  id="firstName"
                  {...form.register("firstName")}
                  disabled={!isEditing}
                />
                {form.formState.errors.firstName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">
                  <User className="h-4 w-4 inline mr-2" />
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  {...form.register("lastName")}
                  disabled={!isEditing}
                />
                {form.formState.errors.lastName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-2" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                disabled={!isEditing}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">
                  <Shield className="h-4 w-4 inline mr-2" />
                  Role
                </Label>
                <Select
                  value={form.watch("role")}
                  onValueChange={(value) => form.setValue("role", value as any)}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.role.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">
                  <Building className="h-4 w-4 inline mr-2" />
                  Department
                </Label>
                <Input
                  id="department"
                  {...form.register("department")}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {/* Account Info */}
            {user && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2">
                      {new Date(user.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? 'Creating...' : (user ? 'Update User' : 'Add User')}
                </Button>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
