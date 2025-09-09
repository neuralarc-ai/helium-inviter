import { useState, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useInviteCodes } from "@/hooks/useInviteCodes";
import { 
  CheckCircle, 
  Copy, 
  Mail, 
  Search, 
  FileText, 
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { InviteCode } from "@/lib/api";

interface InviteCodeTableProps {
  // Remove props since we'll fetch data internally
}

export const InviteCodeTable = ({}: InviteCodeTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "used" | "not-used">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<InviteCode | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const { toast } = useToast();
  const { inviteCodes, isLoading, error, updateCode, isUpdating, sendEmail, isSendingEmail, sendReminderEmail, isSendingReminder } = useInviteCodes();

  // Filter codes based on search term and status filter
  const filteredCodes = useMemo(() => {
    let filtered = inviteCodes.filter(code => {
      // Text search filter
      const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        code.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (code.recipientName && code.recipientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (code.recipientEmail && code.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (code.emailSentTo && code.emailSentTo.some(email => email.toLowerCase().includes(searchTerm.toLowerCase())));
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter === "used") {
        matchesStatus = code.status === "Used";
      } else if (statusFilter === "not-used") {
        matchesStatus = code.status === "Not Used";
      }
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort to show used codes at the top, then by date (newest first)
    return filtered.sort((a, b) => {
      // First priority: Used codes come first
      if (a.status === "Used" && b.status !== "Used") return -1;
      if (a.status !== "Used" && b.status === "Used") return 1;
      
      // Second priority: Within same status, sort by date (newest first)
      return new Date(b.dateGenerated).getTime() - new Date(a.dateGenerated).getTime();
    });
  }, [inviteCodes, searchTerm, statusFilter]);

  // Pagination calculations
  const totalItems = filteredCodes.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCodes = filteredCodes.slice(startIndex, endIndex);

  // Reset to first page when search term or status filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(1, prev - 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(totalPages, prev + 1));
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(totalPages, page)));

  const markAsUsed = (id: string) => {
    // For now, we'll mark as used without user ID since we don't have the actual user
    // In a real system, this would be handled automatically when users sign up with the code
    updateCode({ id, updates: { status: "Used" } });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: `Code ${code} copied to clipboard`,
    });
  };

  const handleSendEmail = (code: InviteCode) => {
    setSelectedCode(code);
    setEmailDialogOpen(true);
  };

  const confirmSendEmail = () => {
    if (!selectedCode || !recipientEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Extract first name from email
    const firstName = recipientEmail.split('@')[0].split('.')[0];
    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    sendEmail({
      email: recipientEmail.trim(),
      inviteCode: selectedCode.code,
      firstName: capitalizedFirstName,
    });

    // Reset form and close dialog
    setRecipientEmail("");
    setEmailDialogOpen(false);
    setSelectedCode(null);
  };

  const handleSendReminderEmail = async (code: InviteCode) => {
    if (!code.emailSentTo || code.emailSentTo.length === 0) {
      toast({
        title: "No email found",
        description: "This invite code hasn't been sent to any email address yet.",
        variant: "destructive",
      });
      return;
    }

    if (isExpired(code.expiryDate)) {
      toast({
        title: "Code expired",
        description: "Cannot send reminder for expired invite codes.",
        variant: "destructive",
      });
      return;
    }

    // For now, we'll use the first email in the list
    // In a real system, you might want to show a dialog to select which email to send to
    const email = code.emailSentTo[0];
    
    // Extract first name from email (fallback if we don't have user profile data)
    const firstName = email.split('@')[0].split('.')[0];
    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    sendReminderEmail({
      email: email,
      inviteCode: code.code,
      firstName: capitalizedFirstName,
    });
  };

  const isExpired = (expiryDate: Date) => {
    return new Date() > expiryDate;
  };

  const getStatusBadge = (code: InviteCode) => {
    if (code.status === "Used") {
      return <Badge className="bg-neon-green text-white">Used</Badge>;
    }
    
    if (isExpired(code.expiryDate)) {
      return <Badge className="bg-neon-pink text-white">Expired</Badge>;
    }
    
    return <Badge className="bg-neon-yellow text-black">Not Used</Badge>;
  };

  const getTotalStats = () => {
    const total = inviteCodes.length;
    const used = inviteCodes.filter(code => code.status === "Used").length;
    const expired = inviteCodes.filter(code => isExpired(code.expiryDate) && code.status === "Not Used").length;
    const active = total - used - expired;
    
    return { total, used, expired, active };
  };

  const getFilteredStats = () => {
    const total = filteredCodes.length;
    const used = filteredCodes.filter(code => code.status === "Used").length;
    const expired = filteredCodes.filter(code => isExpired(code.expiryDate) && code.status === "Not Used").length;
    const active = total - used - expired;
    
    return { total, used, expired, active };
  };

  const totalStats = getTotalStats();
  const filteredStats = getFilteredStats();
  const stats = statusFilter === "all" ? totalStats : filteredStats;

  // Loading state
  if (isLoading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invite Code Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading invite codes...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Invite Code Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>Failed to load invite codes. Please try again.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-neon">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 neon-blue" />
            Invite Code Reports
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-2xl neon-blue">{stats.total}</div>
              <div className="text-black/70">{statusFilter === "all" ? "Total" : "Filtered"}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl neon-green">{stats.used}</div>
              <div className="text-black/70">Used</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl neon-yellow">{stats.active}</div>
              <div className="text-black/70">Active</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl neon-pink">{stats.expired}</div>
              <div className="text-black/70">Expired</div>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 neon-cyan" />
            <Input
              placeholder="Search invite codes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-neon"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "used" | "not-used") => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Codes</SelectItem>
              <SelectItem value="used">Used Only</SelectItem>
              <SelectItem value="not-used">Not Used Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/10">
                <TableHead className="font-semibold neon-blue">Invite Code</TableHead>
                <TableHead className="font-semibold neon-blue">Date Generated</TableHead>
                <TableHead className="font-semibold neon-blue">Expiry Date</TableHead>
                <TableHead className="font-semibold neon-blue">Email Sent To</TableHead>
                <TableHead className="font-semibold neon-blue">Recipient</TableHead>
                <TableHead className="font-semibold neon-blue">Status</TableHead>
                <TableHead className="font-semibold neon-blue">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-white/70">
                    {searchTerm ? "No invite codes match your search" : "No invite codes generated yet"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCodes.map((code) => (
                  <TableRow key={code.id} className="hover:bg-white/5 transition-smooth">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold neon-green">{code.code}</span>
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
                    <TableCell>
                      {code.emailSentTo && code.emailSentTo.length > 0 ? (
                        <div className="space-y-1">
                          {code.emailSentTo.map((email, index) => (
                            <div key={index} className="text-sm text-white">
                              {email}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/50 italic">No email sent</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {code.status === "Used" && code.recipientName ? (
                        <div className="space-y-1">
                          <div className="font-medium text-white">{code.recipientName}</div>
                          <div className="text-xs text-white/70">User ID: {code.usedBy}</div>
                        </div>
                      ) : (
                        <span className="text-white/50 italic">
                          {code.status === "Used" ? "No user ID linked" : "Not used yet"}
                        </span>
                      )}
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
                              className="text-xs btn-neon-green h-8 w-8 p-0"
                              disabled={isUpdating}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs btn-neon-blue h-8 w-8 p-0"
                              onClick={() => handleSendEmail(code)}
                              disabled={isSendingEmail}
                            >
                              {isSendingEmail ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          </>
                        )}
                        {code.emailSentTo && code.emailSentTo.length > 0 && !isExpired(code.expiryDate) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs btn-neon-purple h-8 w-8 p-0"
                            onClick={() => handleSendReminderEmail(code)}
                            disabled={isSendingReminder}
                          >
                            {isSendingReminder ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Clock className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">Rows per page:</span>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/70">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                      className="h-8 w-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Invite Email</DialogTitle>
            <DialogDescription>
              Send the invite code <span className="font-mono font-semibold text-primary">{selectedCode?.code}</span> to a recipient.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmSendEmail();
                  }
                }}
              />
            </div>
            
            {recipientEmail && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Email Preview:</div>
                <div className="text-xs text-muted-foreground">
                  <div><strong>To:</strong> {recipientEmail}</div>
                  <div><strong>Subject:</strong> Your Helium Beta Invitation</div>
                  <div className="mt-2"><strong>Message:</strong></div>
                  <div className="mt-1 p-2 bg-background rounded border text-xs whitespace-pre-wrap font-mono">
                    Dear {recipientEmail.split('@')[0].split('.')[0].charAt(0).toUpperCase() + recipientEmail.split('@')[0].split('.')[0].slice(1).toLowerCase()},

Congratulations! You have been selected to join Helium — the OS for your business, in our first-ever Public Beta experience for businesses.

Your account has been credited with 1500 free Helium credits to explore and experience the power of Helium. Click below to activate your invite and get started:

{selectedCode?.code}

Helium is designed to be the operating system for business intelligence, giving you a single, seamless layer to connect data, decisions, and workflows. As this is our first public beta, you may notice minor bugs or quirks. If you do, your feedback will help us make Helium even better.

You are not just testing a product. You are helping shape the future of business intelligence.

Welcome to Helium OS. The future of work is here.

Cheers,  
Team Helium  
https://he2.ai
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEmailDialogOpen(false);
                setRecipientEmail("");
                setSelectedCode(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSendEmail}
              disabled={!recipientEmail.trim() || isSendingEmail}
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};