import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { aiService } from '@/lib/aiService';

interface ApiKeySetupProps {
  onComplete: () => void;
}

export const ApiKeySetup = ({ onComplete }: ApiKeySetupProps) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      aiService.setApiKey(apiKey.trim());
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome to Smart Task Planner
          </CardTitle>
          <CardDescription>
            AI-powered task planning with Gemini is ready to use
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Your task planner is powered by Google Gemini AI. Start planning your goals and breaking them down into actionable tasks.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={() => onComplete()} 
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
