import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, Mail, Clock } from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  dateGenerated: Date;
  expiryDate: Date;
  status: "Used" | "Not Used";
  emailSentTo?: string[];
}

interface DashboardStatsProps {
  inviteCodes: InviteCode[];
}

export const DashboardStats = ({ inviteCodes }: DashboardStatsProps) => {
  const getTotalStats = () => {
    const total = inviteCodes.length;
    const used = inviteCodes.filter(code => code.status === "Used").length;
    const expired = inviteCodes.filter(code => 
      new Date() > code.expiryDate && code.status === "Not Used"
    ).length;
    const active = total - used - expired;
    const emailsSent = inviteCodes.reduce((acc, code) => 
      acc + (code.emailSentTo?.length || 0), 0
    );
    
    const usageRate = total > 0 ? (used / total) * 100 : 0;
    
    return { total, used, expired, active, emailsSent, usageRate };
  };

  const stats = getTotalStats();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-card transition-smooth hover:shadow-elegant bg-gradient-subtle">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Generated codes
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card transition-smooth hover:shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Usage Rate</CardTitle>
          <Users className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-success">{stats.usageRate.toFixed(1)}%</div>
          <div className="mt-2">
            <Progress value={stats.usageRate} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {stats.used} of {stats.total} codes used
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card transition-smooth hover:shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Codes</CardTitle>
          <Clock className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-warning">{stats.active}</div>
          <p className="text-xs text-muted-foreground">
            Ready to use
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-card transition-smooth hover:shadow-elegant">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
          <Mail className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">{stats.emailsSent}</div>
          <p className="text-xs text-muted-foreground">
            Total invitations
          </p>
        </CardContent>
      </Card>
    </div>
  );
};