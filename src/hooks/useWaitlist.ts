import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { inviteCodeApi, WaitlistEntry } from '@/lib/api';

export function useWaitlist() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all waitlist entries
  const { data: waitlistEntries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['waitlistEntries'],
    queryFn: inviteCodeApi.getAllWaitlistEntries,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update waitlist entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<WaitlistEntry> }) =>
      inviteCodeApi.updateWaitlistEntry(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlistEntries'] });
      toast({
        title: "Waitlist entry updated successfully!",
        description: "The entry has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update waitlist entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete waitlist entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: inviteCodeApi.deleteWaitlistEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlistEntries'] });
      toast({
        title: "Waitlist entry deleted successfully!",
        description: "The entry has been removed from the waitlist.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete waitlist entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark as notified mutation
  const markAsNotifiedMutation = useMutation({
    mutationFn: (id: string) =>
      inviteCodeApi.updateWaitlistEntry(id, { 
        isNotified: true, 
        notifiedAt: new Date() 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waitlistEntries'] });
      toast({
        title: "Entry marked as notified!",
        description: "The waitlist entry has been marked as notified.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark as notified",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    waitlistEntries,
    isLoading,
    error,
    refetch,
    updateEntry: updateEntryMutation.mutate,
    deleteEntry: deleteEntryMutation.mutate,
    markAsNotified: markAsNotifiedMutation.mutate,
    isUpdating: updateEntryMutation.isPending,
    isDeleting: deleteEntryMutation.isPending,
    isMarkingNotified: markAsNotifiedMutation.isPending,
  };
}
