
'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Loader2, Wand2, Copy} from 'lucide-react';
import {useToast} from '@/hooks/use-toast';
import { generateSmartReply, SmartReplyInput } from '@/ai/flows/smart-reply-tool';

export default function SmartReplyPage() {
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {toast} = useToast();

  const onGenerate = async () => {
    if (!query) return;
    setIsLoading(true);
    setError(null);
    setReply('');
    try {
      const input: SmartReplyInput = { query };
      const result = await generateSmartReply(input);

      if (result.reply) {
        setReply(result.reply);
      } else {
        setError('Failed to generate a reply. Please try again.');
      }
    } catch (e) {
      setError('An error occurred. Please try again.');
      console.error(e);
    }
    setIsLoading(false);
  };

  const copyToClipboard = () => {
    if (!reply) return;
    navigator.clipboard.writeText(reply);
    toast({
      title: 'Copied to clipboard!',
      description: 'The suggested reply has been copied.',
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-headline">Smart Reply Tool</h1>
      <Card>
        <CardHeader>
          <CardTitle>Generate Customer Service Replies</CardTitle>
          <CardDescription>
            Enter a customer's query to generate a professional and helpful
            reply using AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="query">Customer Query</Label>
            <Textarea
              placeholder="e.g., 'Hi, I'd like to rent an SUV for a week starting next Monday. What are your rates?'"
              id="query"
              value={query}
              onChange={e => setQuery(e.target.value)}
              rows={5}
            />
          </div>
          <Button onClick={onGenerate} disabled={isLoading || !query}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate Reply
          </Button>
        </CardContent>
        {(reply || isLoading || error) && (
          <CardFooter>
            <div className="w-full space-y-4">
              <Label>Suggested Reply</Label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Card className="relative min-h-[120px] bg-muted/50">
                <CardContent className="p-4 pr-12">
                  {isLoading && (
                    <p className="animate-pulse text-muted-foreground">
                      Generating...
                    </p>
                  )}
                  {reply && (
                    <p className="whitespace-pre-wrap text-sm">{reply}</p>
                  )}
                </CardContent>
                {reply && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy</span>
                  </Button>
                )}
              </Card>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
