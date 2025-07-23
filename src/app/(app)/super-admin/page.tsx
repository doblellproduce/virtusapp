
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Building, Loader2, RefreshCw } from 'lucide-react';
import type { Tenant, UserProfile } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { collection, onSnapshot, addDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

async function createTenantAndAdmin(tenantName: string, adminEmail: string, adminName: string): Promise<{ success: boolean; message: string; }> {
    try {
        const response = await fetch('/api/tenants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantName, adminEmail, adminName }),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Failed to create tenant.');
        }
        return { success: true, message: result.message };
    } catch (error: any) {
        console.error("Error creating tenant:", error);
        return { success: false, message: error.message };
    }
}


export default function SuperAdminPage() {
    const { db } = useAuth();
    const { toast } = useToast();
    const [tenants, setTenants] = React.useState<Tenant[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const [tenantData, setTenantData] = React.useState({
        name: '',
        adminName: '',
        adminEmail: '',
    });

    const fetchTenants = React.useCallback(() => {
        if (!db) return;
        setLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'tenants'), (snapshot) => {
            const tenantsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
            setTenants(tenantsData);
            setLoading(false);
        }, (error) => {
            console.error("Failed to fetch tenants:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch tenants.' });
            setLoading(false);
        });
        return unsubscribe;
    }, [db, toast]);

    React.useEffect(() => {
        const unsubscribe = fetchTenants();
        return () => unsubscribe && unsubscribe();
    }, [fetchTenants]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setTenantData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const result = await createTenantAndAdmin(tenantData.name, tenantData.adminEmail, tenantData.adminName);

        if (result.success) {
            toast({ title: "Tenant Created", description: result.message });
            setOpen(false);
            setTenantData({ name: '', adminName: '', adminEmail: '' });
        } else {
             toast({ variant: 'destructive', title: 'Error', description: result.message });
        }

        setIsSubmitting(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchTenants} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button onClick={() => setOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create New Tenant
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Tenant Management</CardTitle>
                    <CardDescription>
                        Manage all customer companies (tenants) using the platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                         <div className="flex justify-center items-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tenant Name</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((tenant) => (
                                <TableRow key={tenant.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Building className="h-4 w-4 text-muted-foreground" />
                                        {tenant.name}
                                    </TableCell>
                                    <TableCell>
                                        {tenant.createdAt ? format(new Date(tenant.createdAt), 'PPP') : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'} className={tenant.status === 'active' ? 'bg-green-600' : ''}>
                                            {tenant.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

             <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Tenant</DialogTitle>
                        <DialogDescription>
                            This will create a new company account and its first administrator. An invite email will be sent to the admin.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Tenant Company Name</Label>
                            <Input id="name" value={tenantData.name} onChange={handleInputChange} required placeholder="e.g., Acme Rentals Inc."/>
                        </div>
                        <div className="border-t pt-4 space-y-4">
                             <div>
                                <Label htmlFor="adminName">Administrator's Full Name</Label>
                                <Input id="adminName" value={tenantData.adminName} onChange={handleInputChange} required placeholder="e.g., Jane Doe"/>
                            </div>
                            <div>
                                <Label htmlFor="adminEmail">Administrator's Email</Label>
                                <Input id="adminEmail" type="email" value={tenantData.adminEmail} onChange={handleInputChange} required placeholder="e.g., admin@acmerentals.com"/>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Create Tenant & Invite Admin
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
