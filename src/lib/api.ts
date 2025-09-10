// API configuration and types
export interface DatabaseInviteCode {
  id: string;
  code: string;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
  max_uses: number;
  current_uses: number;
  email_sent_to: string[] | null;
  user_profiles?: {
    full_name: string | null;
    preferred_name: string | null;
  } | null;
}

export interface InviteCode {
  id: string;
  code: string;
  dateGenerated: Date;
  expiryDate: Date;
  status: "Used" | "Not Used";
  emailSentTo?: string[];
  maxUses: number;
  currentUses: number;
  usedBy?: string;
  usedAt?: Date;
  recipientEmail?: string;
  recipientName?: string;
}

export interface DatabaseWaitlistEntry {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  reference: string | null;
  referral_source: string | null;
  referral_source_other: string | null;
  user_agent: string | null;
  ip_address: string | null;
  joined_at: string;
  notified_at: string | null;
  is_notified: boolean;
  phone_number: string;
  country_code: string;
}

export interface WaitlistEntry {
  id: string;
  fullName: string;
  email: string;
  company: string | null;
  reference: string | null;
  referralSource: string | null;
  referralSourceOther: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  joinedAt: Date;
  notifiedAt: Date | null;
  isNotified: boolean;
  phoneNumber: string;
  countryCode: string;
}

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Service role client for bypassing RLS when needed
const supabaseService = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Transform database schema to component interface
function transformInviteCode(dbCode: DatabaseInviteCode): InviteCode {
  return {
    id: dbCode.id,
    code: dbCode.code,
    dateGenerated: new Date(dbCode.created_at),
    expiryDate: dbCode.expires_at ? new Date(dbCode.expires_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days if null
    status: dbCode.is_used ? "Used" : "Not Used",
    maxUses: dbCode.max_uses,
    currentUses: dbCode.current_uses,
    usedBy: dbCode.used_by || undefined,
    usedAt: dbCode.used_at ? new Date(dbCode.used_at) : undefined,
    emailSentTo: dbCode.email_sent_to || [],
  };
}


// API functions using Supabase client
export const inviteCodeApi = {
  // Fetch all invite codes
  async getAllInviteCodes(): Promise<InviteCode[]> {
    const { data, error } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch invite codes: ${error.message}`);
    }

    // Fetch user profiles for used codes
    const usedByUserIds = data
      .filter(code => code.is_used && code.used_by)
      .map(code => code.used_by);

    let userProfiles: Record<string, { full_name: string | null; preferred_name: string | null }> = {};
    
    if (usedByUserIds.length > 0) {
      // Use service role client to bypass RLS for user profiles
      const client = supabaseService || supabase;
      const { data: profiles, error: profileError } = await client
        .from('user_profiles')
        .select('user_id, full_name, preferred_name')
        .in('user_id', usedByUserIds);

      if (profileError) {
        console.warn('Failed to fetch user profiles:', profileError.message);
        // Continue without user profiles
      } else if (profiles) {
        userProfiles = profiles.reduce((acc, profile) => {
          acc[profile.user_id] = {
            full_name: profile.full_name,
            preferred_name: profile.preferred_name
          };
          return acc;
        }, {} as Record<string, { full_name: string | null; preferred_name: string | null }>);
      }
    }

    // Transform data with user profiles
    return data.map(dbCode => ({
      ...transformInviteCode(dbCode),
      recipientName: dbCode.used_by && userProfiles[dbCode.used_by] 
        ? (userProfiles[dbCode.used_by].preferred_name || userProfiles[dbCode.used_by].full_name)
        : undefined
    }));
  },

  // Create a new invite code
  async createInviteCode(data: {
    code: string;
    expiresAt?: string;
    maxUses?: number;
  }): Promise<InviteCode> {
    const insertData = {
      code: data.code,
      expires_at: data.expiresAt,
      max_uses: data.maxUses || 1,
      current_uses: 0,
      is_used: false,
    };
    
    const { data: dbCode, error } = await supabase
      .from('invite_codes')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Invite code already exists');
      }
      throw new Error(`Failed to create invite code: ${error.message}`);
    }

    return transformInviteCode(dbCode);
  },

  // Update invite code status
  async updateInviteCode(id: string, updates: {
    isUsed?: boolean;
    usedBy?: string;
  }): Promise<InviteCode> {
    const updateData: any = {};
    
    if (typeof updates.isUsed === 'boolean') {
      updateData.is_used = updates.isUsed;
      if (updates.isUsed) {
        updateData.used_at = new Date().toISOString();
        updateData.current_uses = 1;
      } else {
        updateData.used_at = null;
        updateData.current_uses = 0;
      }
    }

    if (updates.usedBy) {
      updateData.used_by = updates.usedBy;
    }

    const { data: dbCode, error } = await supabase
      .from('invite_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update invite code: ${error.message}`);
    }

    if (!dbCode) {
      throw new Error('Invite code not found');
    }

    return transformInviteCode(dbCode);
  },

  // Send invite email
  async sendInviteEmail(data: {
    email: string;
    inviteCode: string;
    firstName: string;
  }): Promise<{ success: boolean; messageId?: string; message: string }> {
    const response = await fetch('/api/send-invite-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        inviteCode: data.inviteCode,
        firstName: data.firstName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    const result = await response.json();

    // If email was sent successfully, update the invite code to track the email
    if (result.success) {
      try {
        // Find the invite code by code string
        const { data: inviteCodes, error: findError } = await supabase
          .from('invite_codes')
          .select('id, email_sent_to')
          .eq('code', data.inviteCode)
          .single();

        if (!findError && inviteCodes) {
          // Get existing emails or initialize empty array
          const existingEmails = inviteCodes.email_sent_to || [];
          
          // Add the new email if it's not already in the list
          if (!existingEmails.includes(data.email)) {
            const updatedEmails = [...existingEmails, data.email];
            
            // Update the invite code with the new email
            await supabase
              .from('invite_codes')
              .update({ email_sent_to: updatedEmails })
              .eq('id', inviteCodes.id);
          }
        }
      } catch (trackingError) {
        // Don't fail the email send if tracking fails
        console.warn('Failed to track email send:', trackingError);
      }
    }

    return result;
  },

  // Send reminder email
  async sendReminderEmail(data: {
    email: string;
    inviteCode: string;
    firstName: string;
  }): Promise<{ success: boolean; messageId?: string; message: string }> {
    const response = await fetch('/api/send-reminder-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        inviteCode: data.inviteCode,
        firstName: data.firstName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send reminder email');
    }

    const result = await response.json();

    // If reminder email was sent successfully, update the invite code to track the email
    if (result.success) {
      try {
        // Find the invite code by code string
        const { data: inviteCodes, error: findError } = await supabase
          .from('invite_codes')
          .select('id, email_sent_to')
          .eq('code', data.inviteCode)
          .single();

        if (!findError && inviteCodes) {
          // Get existing emails or initialize empty array
          const existingEmails = inviteCodes.email_sent_to || [];
          
          // Add the new email if it's not already in the list
          if (!existingEmails.includes(data.email)) {
            const updatedEmails = [...existingEmails, data.email];
            
            // Update the invite code with the new email
            await supabase
              .from('invite_codes')
              .update({ email_sent_to: updatedEmails })
              .eq('id', inviteCodes.id);
          }
        }
      } catch (trackingError) {
        // Don't fail the email send if tracking fails
        console.warn('Failed to track reminder email send:', trackingError);
      }
    }

    return result;
  },

  // Waitlist API functions
  async getAllWaitlistEntries(): Promise<WaitlistEntry[]> {
    const { data, error } = await supabase
      .from('waitlist')
      .select('*')
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch waitlist entries: ${error.message}`);
    }

    return data.map(transformWaitlistEntry);
  },

  async updateWaitlistEntry(id: string, updates: Partial<WaitlistEntry>): Promise<WaitlistEntry> {
    const updateData: any = {};
    
    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.company !== undefined) updateData.company = updates.company;
    if (updates.reference !== undefined) updateData.reference = updates.reference;
    if (updates.referralSource !== undefined) updateData.referral_source = updates.referralSource;
    if (updates.referralSourceOther !== undefined) updateData.referral_source_other = updates.referralSourceOther;
    if (updates.isNotified !== undefined) updateData.is_notified = updates.isNotified;
    if (updates.notifiedAt !== undefined) updateData.notified_at = updates.notifiedAt?.toISOString();
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;
    if (updates.countryCode !== undefined) updateData.country_code = updates.countryCode;

    const { data: dbEntry, error } = await supabase
      .from('waitlist')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update waitlist entry: ${error.message}`);
    }

    if (!dbEntry) {
      throw new Error('Waitlist entry not found');
    }

    return transformWaitlistEntry(dbEntry);
  },

  async deleteWaitlistEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('waitlist')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete waitlist entry: ${error.message}`);
    }
  },

  // Delete expired invite codes
  async deleteExpiredCodes(): Promise<{ deletedCount: number }> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('invite_codes')
      .delete()
      .lt('expires_at', now)
      .select('id');

    if (error) {
      throw new Error(`Failed to delete expired invite codes: ${error.message}`);
    }

    return { deletedCount: data?.length || 0 };
  },
};

// Helper function to transform database waitlist entry to frontend format
function transformWaitlistEntry(dbEntry: DatabaseWaitlistEntry): WaitlistEntry {
  return {
    id: dbEntry.id,
    fullName: dbEntry.full_name,
    email: dbEntry.email,
    company: dbEntry.company,
    reference: dbEntry.reference,
    referralSource: dbEntry.referral_source,
    referralSourceOther: dbEntry.referral_source_other,
    userAgent: dbEntry.user_agent,
    ipAddress: dbEntry.ip_address,
    joinedAt: new Date(dbEntry.joined_at),
    notifiedAt: dbEntry.notified_at ? new Date(dbEntry.notified_at) : null,
    isNotified: dbEntry.is_notified,
    phoneNumber: dbEntry.phone_number,
    countryCode: dbEntry.country_code,
  };
}
