import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Copy, Mail, Search, FileText } from "lucide-react";
import { format } from "date-fns";

interface InviteCode {
  id: string;
  code: string;
  dateGenerated: Date;
  expiryDate: Date;
  status: "Used" | "Not Used";
  emailSentTo?: string[];
}

interface InviteCodeTableProps {
  inviteCodes: InviteCode[];
  onUpdateCode: (id: string, updates: Partial<InviteCode>) => void;
}

export const InviteCodeTable = ({ inviteCodes, onUpdateCode }: InviteCodeTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const filteredCodes = inviteCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    code.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const markAsUsed = (id: string) => {
    onUpdateCode(id, { status: "Used" });
    toast({
      title: "Status Updated",
      description: "Invite code marked as used",
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: `Code ${code} copied to clipboard`,
    });
  };

  const isExpired = (expiryDate: Date) => {
    return new Date() > expiryDate;
  };

  const getStatusBadge = (code: InviteCode) => {
    if (code.status === "Used") {
      return <Badge className="bg-success text-success-foreground">Used</Badge>;
    }
    
    if (isExpired(code.expiryDate)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    return <Badge className="bg-warning text-warning-foreground">Not Used</Badge>;
  };

  const getTotalStats = () => {
    const total = inviteCodes.length;
    const used = inviteCodes.filter(code => code.status === "Used").length;
    const expired = inviteCodes.filter(code => isExpired(code.expiryDate) && code.status === "Not Used").length;
    const active = total - used - expired;
    
    return { total, used, expired, active };
  };

  const stats = getTotalStats();

  return (
    <Card className="shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invite Code Reports
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-2xl text-primary">{stats.total}</div>
              <div className="text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-success">{stats.used}</div>
              <div className="text-muted-foreground">Used</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-warning">{stats.active}</div>
              <div className="text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl text-destructive">{stats.expired}</div>
              <div className="text-muted-foreground">Expired</div>
            </div>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invite codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Invite Code</TableHead>
                <TableHead className="font-semibold">Date Generated</TableHead>
                <TableHead className="font-semibold">Expiry Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No invite codes match your search" : "No invite codes generated yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredCodes.map((code) => (
                  <TableRow key={code.id} className="hover:bg-muted/30 transition-smooth">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-primary">{code.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyCode(code.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{format(code.dateGenerated, "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <span className={isExpired(code.expiryDate) ? "text-destructive" : ""}>
                        {format(code.expiryDate, "MMM dd, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(code)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {code.status === "Not Used" && !isExpired(code.expiryDate) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsUsed(code.id)}
                              className="text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Mark Used
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              <Mail className="h-3 w-3 mr-1" />
                              Send Email
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};