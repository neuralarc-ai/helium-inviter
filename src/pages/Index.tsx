import { DashboardStats } from "@/components/DashboardStats";
import { InviteCodeGenerator } from "@/components/InviteCodeGenerator";
import { InviteCodeTable } from "@/components/InviteCodeTable";
import { Separator } from "@/components/ui/separator";

const Index = () => {

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold neon-blue">
            Helium Invite Management
          </h1>
          <p className="text-lg text-white/70">
            Generate, manage, and track invite codes for Helium Beta
          </p>
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
      </div>
    </div>
  );
};

export default Index;
