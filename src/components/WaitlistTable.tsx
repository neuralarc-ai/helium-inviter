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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWaitlist } from "@/hooks/useWaitlist";
import { 
  Users, 
  Search, 
  FileText, 
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  Trash2,
  Mail,
  Phone,
  Building,
  Globe
} from "lucide-react";
import { format } from "date-fns";
import { WaitlistEntry } from "@/lib/api";

interface WaitlistTableProps {}

export const WaitlistTable = ({}: WaitlistTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "notified" | "not-notified">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const { toast } = useToast();
  const { 
    waitlistEntries, 
    isLoading, 
    error, 
    updateEntry, 
    deleteEntry, 
    markAsNotified,
    isUpdating, 
    isDeleting, 
    isMarkingNotified 
  } = useWaitlist();

  // Filter entries based on search term and status filter
  const filteredEntries = useMemo(() => {
    let filtered = waitlistEntries.filter(entry => {
      // Text search filter
      const matchesSearch = entry.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.company && entry.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.reference && entry.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (entry.referralSource && entry.referralSource.toLowerCase().includes(searchTerm.toLowerCase())) ||
        entry.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter === "notified") {
        matchesStatus = entry.isNotified;
      } else if (statusFilter === "not-notified") {
        matchesStatus = !entry.isNotified;
      }
      
      return matchesSearch && matchesStatus;
    });
    
    // Sort by join date (newest first)
    return filtered.sort((a, b) => {
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    });
  }, [waitlistEntries, searchTerm, statusFilter]);

  // Pagination calculations
  const totalItems = filteredEntries.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEntries = filteredEntries.slice(startIndex, endIndex);

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

  const handleDeleteEntry = (entry: WaitlistEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEntry) {
      deleteEntry(selectedEntry.id);
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    }
  };

  const handleMarkAsNotified = (id: string) => {
    markAsNotified(id);
  };

  const getStatusBadge = (entry: WaitlistEntry) => {
    if (entry.isNotified) {
      return <Badge className="bg-neon-green text-white">Notified</Badge>;
    }
    return <Badge className="bg-neon-yellow text-black">Pending</Badge>;
  };

  const getTotalStats = () => {
    const total = waitlistEntries.length;
    const notified = waitlistEntries.filter(entry => entry.isNotified).length;
    const pending = total - notified;
    
    return { total, notified, pending };
  };

  const getFilteredStats = () => {
    const total = filteredEntries.length;
    const notified = filteredEntries.filter(entry => entry.isNotified).length;
    const pending = total - notified;
    
    return { total, notified, pending };
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
            <Users className="h-5 w-5 text-primary" />
            Waitlist Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading waitlist entries...</span>
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
            <Users className="h-5 w-5 text-primary" />
            Waitlist Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>Failed to load waitlist entries. Please try again.</span>
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
            <Users className="h-5 w-5 neon-blue" />
            Waitlist Management
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-2xl neon-blue">{stats.total}</div>
              <div className="text-black/70">{statusFilter === "all" ? "Total" : "Filtered"}</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl neon-green">{stats.notified}</div>
              <div className="text-black/70">Notified</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl neon-yellow">{stats.pending}</div>
              <div className="text-black/70">Pending</div>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 neon-cyan" />
            <Input
              placeholder="Search waitlist entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 input-neon"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value: "all" | "notified" | "not-notified") => setStatusFilter(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entries</SelectItem>
              <SelectItem value="notified">Notified Only</SelectItem>
              <SelectItem value="not-notified">Pending Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-white/10">
                <TableHead className="font-semibold neon-blue">Name</TableHead>
                <TableHead className="font-semibold neon-blue">Email</TableHead>
                <TableHead className="font-semibold neon-blue">Company</TableHead>
                <TableHead className="font-semibold neon-blue">Reference</TableHead>
                <TableHead className="font-semibold neon-blue">Phone</TableHead>
                <TableHead className="font-semibold neon-blue">Referral Source</TableHead>
                <TableHead className="font-semibold neon-blue">Joined</TableHead>
                <TableHead className="font-semibold neon-blue">Status</TableHead>
                <TableHead className="font-semibold neon-blue">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-white/70">
                    {searchTerm ? "No waitlist entries match your search" : "No waitlist entries found"}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEntries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-white/5 transition-smooth">
                    <TableCell>
                      <div className="font-medium text-white">{entry.fullName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-neon-cyan" />
                        <span className="text-white">{entry.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.company ? (
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-neon-purple" />
                          <span className="text-white">{entry.company}</span>
                        </div>
                      ) : (
                        <span className="text-white/50 italic">No company</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.reference ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-neon-orange" />
                          <span className="text-white">{entry.reference}</span>
                        </div>
                      ) : (
                        <span className="text-white/50 italic">No reference</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-neon-green" />
                        <span className="text-white">{entry.countryCode} {entry.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.referralSource ? (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-neon-yellow" />
                          <span className="text-white">{entry.referralSource}</span>
                        </div>
                      ) : (
                        <span className="text-white/50 italic">Direct</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-white">{format(entry.joinedAt, "MMM dd, yyyy")}</span>
                    </TableCell>
                    <TableCell>{getStatusBadge(entry)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!entry.isNotified && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsNotified(entry.id)}
                            className="text-xs btn-neon-green h-8 w-8 p-0"
                            disabled={isMarkingNotified}
                          >
                            {isMarkingNotified ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry)}
                          className="text-xs btn-neon-pink h-8 w-8 p-0"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
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
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Waitlist Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this waitlist entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="py-4">
              <div className="space-y-2">
                <div><strong>Name:</strong> {selectedEntry.fullName}</div>
                <div><strong>Email:</strong> {selectedEntry.email}</div>
                <div><strong>Company:</strong> {selectedEntry.company || "N/A"}</div>
                <div><strong>Joined:</strong> {format(selectedEntry.joinedAt, "MMM dd, yyyy")}</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedEntry(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Entry
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
