import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useInviteCodes } from "@/hooks/useInviteCodes";
import { Copy, Mail, Sparkles, Loader2, X } from "lucide-react";

interface InviteCodeGeneratorProps {
  // Remove props since we'll use the hook internally
}

export const InviteCodeGenerator = ({}: InviteCodeGeneratorProps) => {
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string>("");
  const [recipientEmails, setRecipientEmails] = useState<string>("");
  const [showEmailPreview, setShowEmailPreview] = useState<boolean>(false);
  const { toast } = useToast();
  const { createCode: createInviteCode, isCreating, sendEmail, isSendingEmail } = useInviteCodes();

  const generateInviteCode = () => {
    // Generate 7-character alphanumeric code starting with "NA"
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "NA";
    
    for (let i = 0; i < 5; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Set expiry date to 30 days from now
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const createData = {
      code,
      expiresAt,
      maxUses: 1,
    };
    
    createInviteCode(createData);
    
    // Set the generated code for display
    setLastGeneratedCode(code);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Invite code copied successfully",
    });
  };

  const getEmailTemplate = (code: string, email?: string) => {
    // Extract first name from email address
    const firstName = email ? email.split('@')[0].split('.')[0] : '[First Name]';
    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    
    return `Dear ${capitalizedFirstName},

Congratulations! You have been selected to join Helium — the OS for your business, in our first-ever Public Beta experience for businesses.

Your account has been credited with 1500 free Helium credits to explore and experience the power of Helium. Click below to activate your invite and get started:

${code}

Helium is designed to be the operating system for business intelligence, giving you a single, seamless layer to connect data, decisions, and workflows. As this is our first public beta, you may notice minor bugs or quirks. If you do, your feedback will help us make Helium even better.

You are not just testing a product. You are helping shape the future of business intelligence.

Welcome to Helium OS. The future of work is here.

Cheers,  
Team Helium  
https://he2.ai`;
  };

  const handleEmailPreview = () => {
    if (!lastGeneratedCode) {
      toast({
        title: "No invite code",
        description: "Please generate an invite code first",
        variant: "destructive",
      });
      return;
    }

    setShowEmailPreview(!showEmailPreview);
  };

  const handleSendEmail = () => {
    if (!lastGeneratedCode) {
      toast({
        title: "No invite code",
        description: "Please generate an invite code first",
        variant: "destructive",
      });
      return;
    }

    if (!recipientEmails.trim()) {
      toast({
        title: "No recipient",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Get single email address
    const email = recipientEmails.trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    // Extract first name from email
    const firstName = email.split('@')[0].split('.')[0];
    const capitalizedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();

    // Send email automatically
    sendEmail({
      email,
      inviteCode: lastGeneratedCode,
      firstName: capitalizedFirstName,
    });

    // Clear the email field after sending
    setRecipientEmails("");
  };

  return (
    <Card className="shadow-card transition-smooth hover:shadow-elegant max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Invite Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Section - Generate Button */}
          <div className="space-y-4 flex flex-col justify-center items-center mr-auto mb-4">
            <div className="text-center">
              <Button 
                onClick={generateInviteCode} 
                disabled={isCreating}
                className="bg-gradient-primary hover:opacity-90 transition-smooth shadow-elegant"
                size="lg"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate New Code"
                )}
              </Button>
            </div>
          </div>

          {/* Right Section - Generated Code Display */}
          <div className="flex flex-col justify-center space-y-4 mr-auto mb-4">
            {lastGeneratedCode ? (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <Label className="text-sm font-medium">Latest Generated Code:</Label>
                <div className="flex items-center gap-2">
                  <div className="font-mono text-lg font-bold text-primary bg-primary/10 px-3 py-2 rounded border-2 border-primary/20">
                    {lastGeneratedCode}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(lastGeneratedCode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted rounded-lg text-center text-muted-foreground">
                <p className="text-sm">No code generated yet</p>
                <p className="text-xs mt-1">Click "Generate New Code" to create an invite code</p>
              </div>
            )}
          </div>
        </div>

        {/* Email Management Section - Full Width Below */}
        {lastGeneratedCode && (
          <div className="mt-6 pt-6 border-t">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Email Management</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emails">Recipient Email Address</Label>
                <Input
                  id="emails"
                  placeholder="Enter email address (e.g., user@example.com)"
                  value={recipientEmails}
                  onChange={(e) => setRecipientEmails(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleEmailPreview}
                  disabled={!lastGeneratedCode}
                  className="flex-1"
                >
                  {showEmailPreview ? "Hide Preview" : "Preview Email"}
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={!lastGeneratedCode || !recipientEmails.trim() || isSendingEmail}
                  className="flex-1"
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Email"
                  )}
                </Button>
              </div>
              
              {/* Email Preview Dialog */}
              <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
                <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Email Preview
                    </DialogTitle>
                    <DialogDescription>
                      Preview of the invite email that will be sent
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <Label className="text-sm font-medium">To:</Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          {recipientEmails || "No recipient entered"}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Subject:</Label>
                        <div className="text-sm text-muted-foreground mt-1">
                          Your Helium Beta Invitation
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Message:</Label>
                        <div className="mt-2 p-4 bg-muted rounded-lg border text-sm whitespace-pre-wrap font-mono leading-relaxed max-h-96 overflow-y-auto">
                          {getEmailTemplate(lastGeneratedCode, recipientEmails.trim() || undefined)}
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <p className="text-xs text-muted-foreground">
                Email will be sent automatically using our email service
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};