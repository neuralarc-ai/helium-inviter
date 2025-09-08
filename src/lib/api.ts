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
}

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

    return data.map(transformInviteCode);
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

    return response.json();
  },
};
