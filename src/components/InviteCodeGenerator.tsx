import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail, Sparkles } from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  dateGenerated: Date;
  expiryDate: Date;
  status: "Used" | "Not Used";
  emailSentTo?: string[];
}

interface InviteCodeGeneratorProps {
  onCodeGenerated: (code: InviteCode) => void;
}

export const InviteCodeGenerator = ({ onCodeGenerated }: InviteCodeGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string>("");
  const [recipientEmails, setRecipientEmails] = useState<string>("");
  const { toast } = useToast();

  const generateInviteCode = () => {
    setIsGenerating(true);
    
    // Generate 7-character alphanumeric code starting with "NA"
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "NA";
    
    for (let i = 0; i < 5; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    const newInviteCode: InviteCode = {
      id: Date.now().toString(),
      code,
      dateGenerated: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "Not Used",
    };
    
    setLastGeneratedCode(code);
    onCodeGenerated(newInviteCode);
    
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Invite Code Generated",
        description: `New invite code: ${code}`,
      });
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Invite code copied successfully",
    });
  };

  const getEmailTemplate = (code: string) => {
    return `Dear [First Name],

Congratulations! You have been selected to join Helium — the OS for your business, in our first-ever Public Beta experience for businesses.

Your account has been credited with 800 free Helium credits to explore and experience the power of Helium. Click below to activate your invite and get started:

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

    const emailContent = getEmailTemplate(lastGeneratedCode);
    
    // Create a modal-like preview
    const newWindow = window.open("", "_blank", "width=600,height=500");
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Email Preview</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              .email-content { background: #f9f9f9; padding: 20px; border-radius: 8px; }
              .code { background: #e7e5ff; padding: 10px; border-radius: 4px; font-weight: bold; font-size: 18px; }
            </style>
          </head>
          <body>
            <h2>Email Preview</h2>
            <div class="email-content">
              <pre style="white-space: pre-wrap; font-family: Arial, sans-serif;">${emailContent}</pre>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-card transition-smooth hover:shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Invite Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Button 
              onClick={generateInviteCode} 
              disabled={isGenerating}
              className="bg-gradient-primary hover:opacity-90 transition-smooth shadow-elegant"
              size="lg"
            >
              {isGenerating ? "Generating..." : "Generate New Code"}
            </Button>
          </div>
          
          {lastGeneratedCode && (
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
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card transition-smooth hover:shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Email Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emails">Recipient Email Addresses</Label>
            <Input
              id="emails"
              placeholder="Enter email addresses (comma-separated)"
              value={recipientEmails}
              onChange={(e) => setRecipientEmails(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleEmailPreview}
              disabled={!lastGeneratedCode}
              className="flex-1"
            >
              Preview Email
            </Button>
            <Button 
              disabled={!lastGeneratedCode || !recipientEmails.trim()}
              className="flex-1"
            >
              Send Email
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Email functionality requires backend integration with Supabase
          </p>
        </CardContent>
      </Card>
    </div>
  );
};