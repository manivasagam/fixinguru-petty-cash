import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserWithStats } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { UserModal } from "@/components/UserModal";
import { 
  Users, 
  UserPlus, 
  Edit, 
  UserCheck, 
  UserX, 
  AlertCircle,
  Shield,
  Crown,
  User,
  ArrowLeft,
  RotateCcw
} from "lucide-react";
import { Link } from "wouter";

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);

  const { data: users, isLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/users"],
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return await apiRequest("PUT", `/api/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User role updated successfully!",
      });
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
        description: "Failed to update user role. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("PUT", `/api/users/${userId}/toggle-status`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully!",
      });
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
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetCashTopUpsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/reset-cash-topups", {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All worker cash top-ups have been reset to zero!",
      });
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
        description: "Failed to reset cash top-ups. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: UserWithStats) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleUpdateRole = (userId: string, role: string) => {
    updateUserRoleMutation.mutate({ userId, role });
  };

  const handleToggleStatus = (userId: string) => {
    toggleUserStatusMutation.mutate(userId);
  };

  const handleResetCashTopUps = () => {
    if (window.confirm('Are you sure you want to reset all worker cash balances to zero? This action cannot be undone.')) {
      resetCashTopUpsMutation.mutate();
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'manager':
        return <Shield className="h-4 w-4" />;
      case 'staff':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
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

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-600">
              Only administrators can access the user management section.
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

  const activeUsers = users?.filter(u => u.isActive) || [];
  const inactiveUsers = users?.filter(u => !u.isActive) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">
            Manage system users, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={handleAddUser}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleResetCashTopUps}
            disabled={resetCashTopUpsMutation.isPending}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {resetCashTopUpsMutation.isPending ? 'Resetting...' : 'Reset Cash Top-ups'}
          </Button>
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
                  Total Users
                </p>
                <p className="text-2xl font-bold text-primary">
                  {users?.length || 0}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {activeUsers.length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Inactive Users
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {inactiveUsers.length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expenses</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((userItem) => (
                <TableRow key={userItem.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userItem.profileImageUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(userItem.firstName, userItem.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {userItem.firstName && userItem.lastName
                            ? `${userItem.firstName} ${userItem.lastName}`
                            : userItem.email
                          }
                        </p>
                        <p className="text-sm text-gray-500">
                          {userItem.department}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{userItem.email}</TableCell>
                  <TableCell>
                    <Badge className={`role-badge ${getRoleColor(userItem.role)} flex items-center gap-1`}>
                      {getRoleIcon(userItem.role)}
                      {userItem.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={userItem.isActive ? "default" : "secondary"}>
                      {userItem.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Total: {userItem.totalExpenses || 0}</div>
                      <div className="text-green-600">Approved: {userItem.approvedExpenses || 0}</div>
                      <div className="text-yellow-600">Pending: {userItem.pendingExpenses || 0}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {userItem.updatedAt
                      ? new Date(userItem.updatedAt).toLocaleDateString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditUser(userItem)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={userItem.isActive ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleToggleStatus(userItem.id)}
                        disabled={toggleUserStatusMutation.isPending}
                      >
                        {userItem.isActive ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {(!users || users.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>No users found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onRoleChange={handleUpdateRole}
        onUserCreated={() => {
          setIsUserModalOpen(false);
          setSelectedUser(null);
        }}
      />
    </div>
  );
}
