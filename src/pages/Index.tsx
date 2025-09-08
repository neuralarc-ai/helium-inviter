import { useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { InviteCodeGenerator } from "@/components/InviteCodeGenerator";
import { InviteCodeTable } from "@/components/InviteCodeTable";
import { Separator } from "@/components/ui/separator";

interface InviteCode {
  id: string;
  code: string;
  dateGenerated: Date;
  expiryDate: Date;
  status: "Used" | "Not Used";
  emailSentTo?: string[];
}

const Index = () => {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([
    // Sample data
    {
      id: "1",
      code: "NABC123",
      dateGenerated: new Date(2024, 0, 15),
      expiryDate: new Date(2024, 1, 15),
      status: "Used",
      emailSentTo: ["user@example.com"],
    },
    {
      id: "2", 
      code: "NADE456",
      dateGenerated: new Date(2024, 0, 20),
      expiryDate: new Date(2024, 1, 20),
      status: "Not Used",
    },
    {
      id: "3",
      code: "NAFG789",
      dateGenerated: new Date(2024, 0, 25),
      expiryDate: new Date(2024, 1, 25),
      status: "Not Used",
    },
  ]);

  const handleCodeGenerated = (newCode: InviteCode) => {
    setInviteCodes(prev => [newCode, ...prev]);
  };

  const handleUpdateCode = (id: string, updates: Partial<InviteCode>) => {
    setInviteCodes(prev => 
      prev.map(code => 
        code.id === id ? { ...code, ...updates } : code
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Helium Invite Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Generate, manage, and track invite codes for Helium Beta
          </p>
        </div>

        <Separator />

        {/* Dashboard Stats */}
        <DashboardStats inviteCodes={inviteCodes} />

        <Separator />

        {/* Invite Code Generator */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Generate New Invite Code</h2>
          <InviteCodeGenerator onCodeGenerated={handleCodeGenerated} />
        </div>

        <Separator />

        {/* Invite Codes Table */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Invite Code Reports</h2>
          <InviteCodeTable 
            inviteCodes={inviteCodes} 
            onUpdateCode={handleUpdateCode}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
