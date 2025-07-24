
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ClientDashboardPage() {
    const { userProfile, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Welcome, {userProfile?.name || 'Client'}!</CardTitle>
                    <CardDescription>This is your personal dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Your journey with Virtus Car Rental starts here. You can manage your upcoming reservations and view your rental history.</p>
                    <p className="text-sm text-muted-foreground">This dashboard is currently under construction. More features coming soon!</p>
                     <Button onClick={handleLogout} variant="outline" className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
