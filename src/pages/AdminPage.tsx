import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import AdminLayout from "@/admin/AdminLayout";
import AdminDashboard from "@/admin/AdminDashboard";
import AdminUsers from "@/admin/AdminUsers";
import AdminServices from "@/admin/AdminServices";
import AdminPayments from "@/admin/AdminPayments";
import AdminDisputes from "@/admin/AdminDisputes";
import AdminNotifications from "@/admin/AdminNotifications";
import AdminSettings from "@/admin/AdminSettings";

const AdminPage = () => {
  const { user, loading, roles } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !roles.includes("admin")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="font-display text-xl font-bold text-foreground">Access Denied</h1>
          <p className="text-sm text-muted-foreground">You need admin privileges to access this page.</p>
          <a href="/" className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium">
            Go Home
          </a>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <AdminDashboard />;
      case "users": return <AdminUsers />;
      case "services": return <AdminServices />;
      case "payments": return <AdminPayments />;
      case "disputes": return <AdminDisputes />;
      case "notifications": return <AdminNotifications />;
      case "settings": return <AdminSettings />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onNavigate={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPage;
