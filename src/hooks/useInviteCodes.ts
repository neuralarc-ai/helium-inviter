import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteCodeApi, InviteCode } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function useInviteCodes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all invite codes
  const {
    data: inviteCodes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inviteCodes'],
    queryFn: inviteCodeApi.getAllInviteCodes,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update invite code mutation
  const updateCodeMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<InviteCode> }) => {
      return inviteCodeApi.updateInviteCode(id, {
        isUsed: updates.status === 'Used',
        usedBy: updates.usedBy,
      });
    },
    onSuccess: (updatedCode) => {
      // Update the cache
      queryClient.setQueryData(['inviteCodes'], (oldData: InviteCode[] | undefined) => {
        if (!oldData) return [updatedCode];
        return oldData.map(code => 
          code.id === updatedCode.id ? updatedCode : code
        );
      });
      
      toast({
        title: "Status Updated",
        description: "Invite code status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update invite code status",
        variant: "destructive",
      });
    },
  });

  // Create invite code mutation
  const createCodeMutation = useMutation({
    mutationFn: inviteCodeApi.createInviteCode,
    onSuccess: (newCode) => {
      // Add to cache
      queryClient.setQueryData(['inviteCodes'], (oldData: InviteCode[] | undefined) => {
        if (!oldData) return [newCode];
        return [newCode, ...oldData];
      });
      
      toast({
        title: "Code Generated",
        description: `Invite code ${newCode.code} created successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create invite code: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete invite code mutation
  const deleteCodeMutation = useMutation({
    mutationFn: inviteCodeApi.deleteInviteCode,
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.setQueryData(['inviteCodes'], (oldData: InviteCode[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(code => code.id !== deletedId);
      });
      
      toast({
        title: "Code Deleted",
        description: "Invite code deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete invite code",
        variant: "destructive",
      });
    },
  });

  // Send invite email mutation
  const sendEmailMutation = useMutation({
    mutationFn: inviteCodeApi.sendInviteEmail,
    onSuccess: (result) => {
      // Refresh the invite codes data to show updated email tracking
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
      
      toast({
        title: "Email sent successfully!",
        description: result.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send reminder email mutation
  const sendReminderEmailMutation = useMutation({
    mutationFn: inviteCodeApi.sendReminderEmail,
    onSuccess: (result) => {
      // Refresh the invite codes data to show updated email tracking
      queryClient.invalidateQueries({ queryKey: ['inviteCodes'] });
      
      toast({
        title: "Reminder email sent successfully!",
        description: result.message,
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send reminder email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    inviteCodes,
    isLoading,
    error,
    refetch,
    updateCode: updateCodeMutation.mutate,
    createCode: createCodeMutation.mutate,
    deleteCode: deleteCodeMutation.mutate,
    sendEmail: sendEmailMutation.mutate,
    sendReminderEmail: sendReminderEmailMutation.mutate,
    isUpdating: updateCodeMutation.isPending,
    isCreating: createCodeMutation.isPending,
    isDeleting: deleteCodeMutation.isPending,
    isSendingEmail: sendEmailMutation.isPending,
    isSendingReminder: sendReminderEmailMutation.isPending,
  };
}
