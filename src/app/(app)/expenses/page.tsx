
'use client';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Edit, CheckCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { initialExpenses } from '@/lib/data';

type Expense = typeof initialExpenses[0];
type NewExpense = Omit<Expense, 'id'>;

const emptyExpense: NewExpense = {
    description: '',
    category: 'Maintenance',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Pending',
};

export default function ExpensesPage() {
    const { toast } = useToast();
    const [expenses, setExpenses] = React.useState(initialExpenses);
    const [open, setOpen] = React.useState(false);
    const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
    const [expenseData, setExpenseData] = React.useState<NewExpense>(emptyExpense);

    const isEditing = editingExpense !== null;

    const handleOpenDialog = (expense: Expense | null = null) => {
        if (expense) {
            setEditingExpense(expense);
            setExpenseData(expense);
        } else {
            setEditingExpense(null);
            setExpenseData(emptyExpense);
        }
        setOpen(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setExpenseData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (id: keyof NewExpense) => (value: string) => {
        setExpenseData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing && editingExpense) {
            setExpenses(prev => prev.map(exp => 
                exp.id === editingExpense.id ? { ...editingExpense, ...expenseData, amount: parseFloat(expenseData.amount).toFixed(2) } : exp));
            toast({ title: 'Expense Updated', description: 'The expense has been successfully updated.' });
        } else {
            const newId = `EXP-${Date.now()}`;
            const expenseToAdd: Expense = {
                id: newId,
                ...expenseData,
                amount: parseFloat(expenseData.amount).toFixed(2),
            };
            setExpenses(prev => [expenseToAdd, ...prev]);
            toast({ title: 'Expense Added', description: 'The new expense has been recorded.' });
        }
        setOpen(false);
    };
    
    const handleMarkAsPaid = (expenseId: string) => {
        setExpenses(prev => prev.map(exp => 
            exp.id === expenseId ? { ...exp, status: 'Paid' } : exp
        ));
        toast({
            title: "Expense Paid",
            description: `Expense ${expenseId} has been marked as paid.`,
        });
    };

    React.useEffect(() => {
        if (!open) {
            setEditingExpense(null);
            setExpenseData(emptyExpense);
        }
    }, [open]);

    const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'Paid': return 'default';
            case 'Pending': return 'secondary';
            case 'Overdue': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getStatusClass = (status: string) => {
        if (status === 'Paid') return 'bg-green-600 hover:bg-green-700';
        return '';
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Expenses</h1>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Expense Records</CardTitle>
                    <CardDescription>Track and manage all company expenditures.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>{expense.category}</TableCell>
                                    <TableCell>${expense.amount}</TableCell>
                                    <TableCell>{expense.date}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={getStatusVariant(expense.status)}
                                            className={getStatusClass(expense.status)}
                                        >
                                            {expense.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDialog(expense)}>
                                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                                </DropdownMenuItem>
                                                {expense.status !== 'Paid' && (
                                                    <DropdownMenuItem onClick={() => handleMarkAsPaid(expense.id)}>
                                                        <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input id="description" value={expenseData.description} onChange={handleInputChange} required />
                        </div>
                        <div>
                            <Label htmlFor="category">Category</Label>
                            <Select onValueChange={(value) => handleSelectChange('category')(value)} value={expenseData.category} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                                    <SelectItem value="Fuel">Fuel</SelectItem>
                                    <SelectItem value="Insurance">Insurance</SelectItem>
                                    <SelectItem value="Salaries">Salaries</SelectItem>
                                    <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                                    <SelectItem value="Utilities">Utilities</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="amount">Amount ($)</Label>
                                <Input id="amount" type="number" step="0.01" value={expenseData.amount} onChange={handleInputChange} required />
                            </div>
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input id="date" type="date" value={expenseData.date} onChange={handleInputChange} required />
                            </div>
                        </div>
                         <div>
                            <Label htmlFor="status">Status</Label>
                            <Select onValueChange={(value) => handleSelectChange('status')(value)} value={expenseData.status} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">{isEditing ? 'Save Changes' : 'Add Expense'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
