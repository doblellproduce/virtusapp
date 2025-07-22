
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Trash2, KeyRound, Search, Loader2, RefreshCw } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { UserProfile, UserRole } from '@/lib/types';
import { collection, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// In a real app, this would be an API call to a serverless function to create a user
// to avoid exposing admin privileges to the client. For this prototype, we'll simulate.
async function inviteUser(email: string, displayName: string, role: UserRole) {
    console.log(`Simulating invite for ${email} with role ${role}. In a real app, a backend function would:`);
    console.log(`1. Create a Firebase Auth user.`);
    console.log(`2. Create a 'users' document in Firestore with the UID, email, name, and role.`);
    console.log(`3. Send a custom invitation email.`);
    // This is a placeholder. In a real app, you'd use Firebase Functions.
    return { success: true, message: `An invitation to set a password would be sent to ${email}.` };
}


type NewUser = Omit<UserProfile, 'id' | 'photoURL'>;

const emptyUser: NewUser = {
    name: '',
    email: '',
    role: 'Secretary',
}

export default function UsersPage() {
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [open, setOpen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
    const [userData, setUserData] = React.useState<NewUser>(emptyUser);
    const { toast } = useToast();
    const { user: currentUser, role: currentUserRole, sendPasswordReset, db } = useAuth();
    const [searchTerm, setSearchTerm] = React.useState('');

    const fetchUsers = React.useCallback(async () => {
        if (!db) return;
        setLoading(true);
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users: ", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch user data.' });
        } finally {
            setLoading(false);
        }
    }, [toast, db]);

    React.useEffect(() => {
        if (db) fetchUsers();
    }, [fetchUsers, db]);

    const isCurrentUserAdmin = currentUserRole === 'Admin';
    const isEditing = editingUser !== null;

    const handleOpenDialog = (user: UserProfile | null = null) => {
        if (user) {
            setEditingUser(user);
            setUserData(user);
        } else {
            setEditingUser(null);
            setUserData(emptyUser);
        }
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setUserData(prev => ({ ...prev, [id]: value }));
    }

    const handleSelectChange = (value: UserRole) => {
        setUserData(prev => ({ ...prev, role: value }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!db) {
            toast({ variant: "destructive", title: "Database Error", description: "Database service is not available." });
            return;
        }
        setIsSubmitting(true);
        
        if (!isCurrentUserAdmin) {
            toast({ variant: "destructive", title: "Permission Denied", description: "You do not have permission to perform this action." });
            setIsSubmitting(false);
            return;
        }

        if (isEditing && editingUser) {
            const userRef = doc(db, 'users', editingUser.id);
            await updateDoc(userRef, {
                name: userData.name,
                email: userData.email,
                role: userData.role,
            });
            toast({ title: "User Updated", description: `Details for ${userData.name} have been updated.` });
        } else {
            // This is a simulation. A real implementation requires a Cloud Function.
            const result = await inviteUser(userData.email, userData.name, userData.role);
             if (result.success) {
                toast({ title: "User Invited (Simulated)", description: result.message });
            } else {
                toast({ variant: 'destructive', title: "Error", description: result.message });
            }
        }
        setIsSubmitting(false);
        setOpen(false);
        fetchUsers(); // Refresh data
    }
    
    const handleDelete = async (userId: string) => {
        if (!isCurrentUserAdmin) {
            toast({ variant: "destructive", title: "Permission Denied" });
            return;
        }
        if (userId === currentUser?.uid) {
             toast({ variant: "destructive", title: "Action Forbidden", description: "You cannot delete your own account." });
             return;
        }
        if (!db) {
            toast({ variant: "destructive", title: "Database Error", description: "Database service is not available." });
            return;
        }
        const userToDelete = users.find(u => u.id === userId);
        
        // This is a simulation. A real implementation requires a Cloud Function to delete both Firestore doc and Auth user.
        await deleteDoc(doc(db, "users", userId));
        
        toast({ title: "User Deleted (Simulated)", description: `The user ${userToDelete?.name} has been deleted from Firestore. The Auth user would also be deleted.` });
        fetchUsers(); // Refresh data
    }

    const handleResetPassword = async (userEmail: string) => {
        if (!isCurrentUserAdmin) {
            toast({ variant: "destructive", title: "Permission Denied" });
            return;
        }
        try {
            await sendPasswordReset(userEmail);
            toast({
                title: "Password Reset Sent",
                description: `A password reset link has been sent to ${userEmail}.`
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message,
            });
        }
    }
    
    const filteredUsers = users.filter(user => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const nameMatch = user.name?.toLowerCase().includes(lowercasedTerm);
        const emailMatch = user.email?.toLowerCase().includes(lowercasedTerm);
        return nameMatch || emailMatch;
    });

    React.useEffect(() => {
        if (!open) {
            setEditingUser(null);
            setUserData(emptyUser);
            setIsSubmitting(false);
        }
    }, [open]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">User Management</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {isCurrentUserAdmin && (
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    )}
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>User List</CardTitle>
                    <CardDescription>
                        Manage employee accounts and roles. Data is live from Firestore.
                    </CardDescription>
                    <div className="relative pt-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search by name or email..." 
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                         <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">{user.name || 'N/A'}</TableCell>
                                    <TableCell>{user.email || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                         <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!isCurrentUserAdmin}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(user)}>Edit Details</DropdownMenuItem>
                                                 <DropdownMenuItem onClick={() => handleResetPassword(user.email)}>
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    Reset Password
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem 
                                                            className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive" 
                                                            onSelect={(e) => e.preventDefault()}
                                                            disabled={user.id === currentUser?.uid}>
                                                          <Trash2 className="h-4 w-4" />
                                                          Delete User
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                         <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the user account for <span className='font-bold'>{user.name}</span>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90">Yes, delete user</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                     <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit User' : 'Invite New User'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Update the details for this user.' : 'Fill in the details to invite a new user. This is a simulation and requires a backend function for a real app.'}
                        </d:DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Full Name</Label>
                                <Input id="name" value={userData.name} onChange={handleInputChange} className="col-span-3" required disabled={isSubmitting}/>
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" type="email" value={userData.email} onChange={handleInputChange} className="col-span-3" required disabled={isSubmitting || isEditing}/>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                 <Select onValueChange={(value: UserRole) => handleSelectChange(value)} value={userData.role} required disabled={isSubmitting}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                                        <SelectItem value="Secretary">Secretary</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {isEditing ? 'Save Changes' : 'Send Invite'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    