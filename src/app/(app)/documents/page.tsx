
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, MoreHorizontal, Trash2, Download, FileText, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type Document = {
    id: string;
    customer: string;
    type: string;
    date: string;
    fileUrl: string;
    fileName: string;
    status: 'Verified' | 'Pending' | 'Rejected' | 'Signed';
    reservationId?: string;
}

type NewDocument = Omit<Document, 'id' | 'date' | 'fileUrl' | 'fileName' | 'status' | 'reservationId'> & {
    file: File | null;
}

const emptyDocument: NewDocument = {
    customer: '',
    type: "Driver's License",
    file: null,
};


export default function DocumentsPage() {
    const { db, storage } = useAuth();
    const [documents, setDocuments] = React.useState<Document[]>([]);
    const [newDocument, setNewDocument] = React.useState<NewDocument>(emptyDocument);
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if(!db) return;
        setLoading(true);

        const manualDocsQuery = query(collection(db, "documents"), orderBy("date", "desc"));
        const contractsQuery = query(collection(db, "contracts"), orderBy("date", "desc"));

        const unsubDocs = onSnapshot(manualDocsQuery, (docSnapshot) => {
            const manualDocsData = docSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Document));
            
            const unsubContracts = onSnapshot(contractsQuery, (contractSnapshot) => {
                const contractsData = contractSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        customer: data.customer,
                        type: data.type,
                        date: data.date,
                        fileUrl: '', // Contracts are generated, no direct URL needed for download yet
                        fileName: data.file.name,
                        status: data.status,
                        reservationId: data.reservationId,
                    } as Document;
                });

                const combined = [...manualDocsData, ...contractsData];
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                unique.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setDocuments(unique);
                setLoading(false);
            }, () => setLoading(false));
             return () => unsubContracts();
        }, () => setLoading(false));
        return () => unsubDocs();
    }, [db]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewDocument(prev => ({...prev, [id]: value}));
    }
    
    const handleSelectChange = (value: string) => {
        setNewDocument(prev => ({...prev, type: value}));
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setNewDocument(prev => ({ ...prev, file }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newDocument.customer || !newDocument.type || !newDocument.file || !db || !storage) {
             toast({
                variant: "destructive",
                title: "Incomplete form",
                description: "Please fill out all fields and select a file.",
            })
            return;
        }
        setIsSubmitting(true);
        
        try {
            // Upload file to storage
            const fileRef = ref(storage, `documents/${Date.now()}_${newDocument.file.name}`);
            await uploadBytes(fileRef, newDocument.file);
            const fileUrl = await getDownloadURL(fileRef);

            // Add document metadata to Firestore
            const documentToAdd = {
                customer: newDocument.customer,
                type: newDocument.type,
                fileUrl: fileUrl,
                fileName: newDocument.file.name,
                date: new Date().toISOString().split('T')[0],
                status: 'Pending' as const,
            }
            await addDoc(collection(db, 'documents'), documentToAdd);

            toast({
                title: "Document uploaded!",
                description: `${newDocument.file.name} for ${newDocument.customer} has been added for verification.`,
            })

            setNewDocument(emptyDocument);
            const fileInput = document.getElementById('file') as HTMLInputElement;
            if(fileInput) fileInput.value = '';

        } catch (error) {
            console.error("Error uploading document:", error);
            toast({ variant: 'destructive', title: "Upload Error", description: "Failed to upload document."});
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleDelete = async (docId: string, type: string) => {
        if(!db) return;
        const collectionName = type === 'Rental Agreement' ? 'contracts' : 'documents';
        
        try {
            await deleteDoc(doc(db, collectionName, docId));
            toast({
                title: "Document deleted",
                description: "The document has been removed from the list.",
            })
        } catch (error) {
             console.error("Error deleting document:", error);
             toast({ variant: 'destructive', title: "Delete Error", description: "Failed to delete document."});
        }
    }
    
     const getStatusVariant = (status: string) => {
        switch (status) {
            case 'Verified':
            case 'Signed':
                return 'default';
            case 'Pending':
                return 'secondary';
            case 'Rejected':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getStatusClass = (status: string) => {
        if (status === 'Verified' || status === 'Signed') return 'bg-green-600 hover:bg-green-700';
        return '';
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Document Management</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Upload Document</CardTitle>
                        <CardDescription>Upload customer documents like driver's license or passport for verification.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <Label htmlFor="customer">Customer Name</Label>
                                <Input id="customer" placeholder="John Doe" value={newDocument.customer} onChange={handleInputChange} required disabled={isSubmitting}/>
                            </div>
                            <div>
                                <Label htmlFor="type">Document Type</Label>
                                <Select onValueChange={handleSelectChange} value={newDocument.type} required disabled={isSubmitting}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Driver's License">Driver's License</SelectItem>
                                        <SelectItem value="ID Card (Cédula)">ID Card (Cédula)</SelectItem>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="file">File</Label>
                                <Input id="file" type="file" onChange={handleFileChange} required disabled={isSubmitting}/>
                            </div>
                            <Button className="w-full" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                Upload for Verification
                            </Button>
                        </form>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>All Documents</CardTitle>
                        <CardDescription>Browse, verify, and manage all customer documents and signed contracts.</CardDescription>
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
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Document Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-medium">{doc.customer}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {doc.type === 'Rental Agreement' && <FileText className="h-4 w-4 text-muted-foreground" />}
                                                <span>{doc.type}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{doc.date}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={getStatusVariant(doc.status)}
                                                className={getStatusClass(doc.status)}
                                            >
                                                {doc.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    {doc.type === 'Rental Agreement' && doc.reservationId ? (
                                                        <DropdownMenuItem asChild>
                                                          <Link href={`/reservations?view=${doc.reservationId}`} className="flex items-center gap-2 cursor-pointer">
                                                                <FileText className="h-4 w-4" />
                                                                View Related Reservation
                                                          </Link>
                                                        </DropdownMenuItem>
                                                    ) : (
                                                        <DropdownMenuItem className="gap-2" asChild>
                                                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4" />
                                                            Download
                                                          </a>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDelete(doc.id, doc.type)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
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
            </div>
        </div>
    );
}
