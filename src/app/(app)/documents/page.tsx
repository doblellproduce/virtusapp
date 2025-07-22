
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, MoreHorizontal, Trash2, Download, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const getContractsFromStorage = () => {
    if (typeof window === 'undefined') return [];
    const savedContracts = localStorage.getItem('signedContracts');
    return savedContracts ? JSON.parse(savedContracts) : [];
};

const initialDocuments = [
  { id: 1, customer: 'Liam Johnson', type: "Driver's License", date: '2024-07-15', file: { name: 'liam_license.pdf' }, status: 'Verified' },
  { id: 2, customer: 'Olivia Smith', type: "Passport", date: '2024-07-16', file: { name: 'olivia_passport.pdf' }, status: 'Verified' },
  { id: 3, customer: 'Noah Williams', type: "Driver's License", date: '2024-07-20', file: { name: 'noah_license.jpg' }, status: 'Pending' },
  // Agreements are now loaded dynamically
  { id: 5, customer: 'Ava Jones', type: "ID Card", date: '2024-07-22', file: { name: 'ava_id.pdf' }, status: 'Rejected' },
];

type Document = {
    id: number | string;
    customer: string;
    type: string;
    date: string;
    file: File | { name: string };
    status: 'Verified' | 'Pending' | 'Rejected' | 'Signed';
    reservationId?: string;
}

type NewDocument = {
    customer: string;
    type: string;
    file: File | null;
}

const emptyDocument: NewDocument = {
    customer: '',
    type: "Driver's License",
    file: null,
};


export default function DocumentsPage() {
    const [documents, setDocuments] = React.useState<Document[]>([]);
    const [newDocument, setNewDocument] = React.useState<NewDocument>(emptyDocument);
    const { toast } = useToast();

    React.useEffect(() => {
        const storedContracts = getContractsFromStorage().map((c: any) => ({...c, id: c.id})); // ensure unique ids
        const combinedDocs = [...initialDocuments, ...storedContracts];
        const uniqueDocs = Array.from(new Map(combinedDocs.map(doc => [doc.id, doc])).values());
        setDocuments(uniqueDocs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, []);


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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newDocument.customer || !newDocument.type || !newDocument.file) {
             toast({
                variant: "destructive",
                title: "Incomplete form",
                description: "Please fill out all fields and select a file.",
            })
            return;
        }

        const documentToAdd: Document = {
            id: documents.length > 0 ? Math.max(...documents.map(d => typeof d.id === 'number' ? d.id : 0)) + 1 : 1,
            customer: newDocument.customer,
            type: newDocument.type,
            file: newDocument.file,
            date: new Date().toISOString().split('T')[0],
            status: 'Pending',
        }

        setDocuments(prev => [documentToAdd, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setNewDocument(emptyDocument);
        
        // Reset file input
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
        
        toast({
            title: "Document uploaded!",
            description: `${(documentToAdd.file as File).name} for ${documentToAdd.customer} has been added for verification.`,
        })
    }

    const handleDelete = (id: number | string) => {
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        toast({
            title: "Document deleted",
            description: "The document has been removed from the list.",
        })
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
                                <Input id="customer" placeholder="John Doe" value={newDocument.customer} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="type">Document Type</Label>
                                <Select onValueChange={handleSelectChange} value={newDocument.type} required>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Select document type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Driver's License">Driver's License</SelectItem>
                                        <SelectItem value="ID Card">ID Card (Cédula)</SelectItem>
                                        <SelectItem value="Passport">Passport</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="file">File</Label>
                                <Input id="file" type="file" onChange={handleFileChange} required />
                            </div>
                            <Button className="w-full" type="submit">
                                <UploadCloud className="mr-2 h-4 w-4" />
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
                                                    ) : null}
                                                    <DropdownMenuItem className="gap-2" onClick={() => alert('Download would start for ' + (doc.file as { name: string }).name)}>
                                                        <Download className="h-4 w-4" />
                                                        Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={() => handleDelete(doc.id)}>
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
