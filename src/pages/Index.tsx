import { DashboardStats } from "@/components/DashboardStats";
import { InviteCodeGenerator } from "@/components/InviteCodeGenerator";
import { InviteCodeTable } from "@/components/InviteCodeTable";
import { WaitlistTable } from "@/components/WaitlistTable";
import { UserMenu } from "@/components/UserMenu";
import { Separator } from "@/components/ui/separator";

const Index = () => {

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-4xl font-bold neon-blue">
              Helium Invite Management
            </h1>
            <p className="text-lg text-white/70">
              Generate, manage, and track invite codes for Helium Beta
            </p>
          </div>
          <UserMenu />
        </div>

        <Separator className="bg-white/20" />

        {/* Dashboard Stats */}
        <DashboardStats />

        <Separator className="bg-white/20" />

        {/* Invite Code Generator */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold neon-cyan">Generate New Invite Code</h2>
          <InviteCodeGenerator />
        </div>

        <Separator className="bg-white/20" />

        {/* Invite Codes Table */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold neon-green">Invite Code Reports</h2>
          <InviteCodeTable />
        </div>

        <Separator className="bg-white/20" />

        {/* Waitlist Management */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold neon-purple">Waitlist Management</h2>
          <WaitlistTable />
        </div>
      </div>
    </div>
  );
};

export default Index;
