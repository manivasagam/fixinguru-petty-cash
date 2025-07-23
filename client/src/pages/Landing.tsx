import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Shield, Users, TrendingUp, CheckCircle, Clock } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary/80">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full">
                <Coins className="h-16 w-16 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Fixinguru
            </h1>
            <p className="text-xl text-white/90 mb-8">
              Petty Cash Management System
            </p>
            <Button 
              onClick={handleLogin}
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            >
              Sign In to Continue
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Role-Based Access
                </h3>
                <p className="text-white/80">
                  Secure access control for Admin, Manager, and Staff roles
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Team Management
                </h3>
                <p className="text-white/80">
                  Manage users, departments, and expense approvals
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Analytics & Reports
                </h3>
                <p className="text-white/80">
                  Comprehensive reporting and expense analytics
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Process */}
          <Card className="bg-white/10 border-white/20">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                How It Works
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Submit Expense
                  </h3>
                  <p className="text-white/80">
                    Staff submit expenses with receipts and descriptions
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Manager Review
                  </h3>
                  <p className="text-white/80">
                    Managers approve or reject expense requests
                  </p>
                </div>
                <div className="text-center">
                  <div className="p-3 bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Real-time Tracking
                  </h3>
                  <p className="text-white/80">
                    Track expenses and cash balance in real-time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-white/60">
              © 2024 Fixinguru. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
