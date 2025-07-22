
'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { login, sendPasswordReset } = useAuth();
  const { toast } = useToast();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setError(null);
    setIsSubmitting(true);
    try {
      // The form's only job is to attempt the login.
      // The redirection will be handled by the page component watching the auth state.
      await login(data.email, data.password);
    } catch (error: any) {
       let errorMessage = "An unexpected error occurred.";
       switch (error.code) {
         case 'auth/user-not-found':
         case 'auth/wrong-password':
         case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.';
            break;
         case 'auth/too-many-requests':
            errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
            break;
         default:
            errorMessage = error.message;
            break;
       }
       setError(errorMessage);
    } finally {
      // This will always run, ensuring the loading state is reset.
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordResetClick = async () => {
    setError(null);
    const email = loginForm.getValues("email");
    if (!email) {
      loginForm.setError("email", { type: "manual", message: "Please enter your email address to reset your password." });
      return;
    }
    const emailValidation = z.string().email().safeParse(email);
    if (!emailValidation.success) {
      loginForm.setError("email", { type: "manual", message: "Please enter a valid email address to reset your password." });
      return;
    }

    try {
      await sendPasswordReset(email);
      toast({
        title: "Password Reset Email Sent",
        description: `A link to reset your password has been sent to ${email}.`,
      });
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Form {...loginForm}>
        <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
          <FormField
            control={loginForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="admin@example.com" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={loginForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                  <FormLabel>Password</FormLabel>
                   <Button 
                    type="button"
                    variant="link" 
                    className="p-0 h-auto text-xs" 
                    onClick={handlePasswordResetClick}
                    disabled={isSubmitting}
                  >
                    Forgot Password?
                  </Button>
                </div>
                <FormControl>
                  <Input type="password" {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </Form>
    </div>
  );
}
