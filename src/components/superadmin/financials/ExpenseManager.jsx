
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Receipt,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const expenseCategories = ["Salary", "Marketing", "Operations", "Infrastructure", "Miscellaneous"];

// Helper function to get category-specific styling
const getCategoryColor = (category) => {
  switch (category) {
    case 'Salary':
      return 'bg-blue-100 text-blue-800';
    case 'Marketing':
      return 'bg-green-100 text-green-800';
    case 'Operations':
      return 'bg-purple-100 text-purple-800';
    case 'Infrastructure':
      return 'bg-yellow-100 text-yellow-800';
    case 'Miscellaneous':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ExpenseManager({ expenses, onSave, onDelete, currentUser, canEdit }) {
  const [showModal, setShowModal] = useState(false); // Renamed from isModalOpen
  const [currentExpense, setCurrentExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(false); // New state to differentiate add/edit
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(exp =>
        (categoryFilter === 'all' || exp.category === categoryFilter) &&
        (exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
         exp.category.toLowerCase().includes(searchTerm.toLowerCase())) // Search by category name too
      )
      .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
  }, [expenses, searchTerm, categoryFilter]);

  const handleAdd = () => {
    setCurrentExpense({
      category: expenseCategories[0],
      description: '',
      amount: '',
      expense_date: new Date(),
    });
    setEditingExpense(false);
    setShowModal(true);
  };

  const handleEdit = (expense) => {
    setCurrentExpense({ ...expense, expense_date: parseISO(expense.expense_date) });
    setEditingExpense(true);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentExpense(null);
    setEditingExpense(false);
  };

  const handleSubmit = async (event) => { // Renamed from handleSave
    event.preventDefault(); // Prevent default form submission

    if (!currentExpense.description || !currentExpense.amount || !currentExpense.expense_date) {
      toast.error("Please fill all required fields.");
      return;
    }

    const expenseData = {
      ...currentExpense,
      amount: parseFloat(currentExpense.amount),
      expense_date: format(currentExpense.expense_date, 'yyyy-MM-dd'),
    };

    await onSave(expenseData, currentUser);
    closeModal(); // Use the new closeModal to reset state
  };

  const handleDelete = async (expenseId) => {
    await onDelete(expenseId, currentUser);
    toast.success("Expense deleted successfully!");
  };

  const handleFieldChange = (field, value) => {
    setCurrentExpense(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Add Button */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-orange-700 to-orange-600 bg-clip-text text-transparent">
                  Expense Management
                </CardTitle>
                <p className="text-sm text-slate-600 font-normal mt-0.5">
                  Track and manage company expenses
                </p>
              </div>
            </div>
            {canEdit && (
              <Button
                onClick={handleAdd} // Call handleAdd for new expense
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            )}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search expenses by description or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-slate-200 focus:border-orange-400 focus:ring-orange-400"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] border-slate-200 focus:border-orange-400 focus:ring-orange-400">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {expenseCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Expenses Table */}
      <Card className="shadow-lg border-0 bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gradient-to-r from-slate-50 to-slate-100">
                  <th className="p-4 text-left font-semibold text-slate-700">Description</th>
                  <th className="p-4 text-left font-semibold text-slate-700">Category</th>
                  <th className="p-4 text-right font-semibold text-slate-700">Amount</th>
                  <th className="p-4 text-left font-semibold text-slate-700">Date</th>
                  <th className="p-4 text-left font-semibold text-slate-700">Added By</th>
                  {canEdit && <th className="p-4 text-right font-semibold text-slate-700">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.length > 0 ? filteredExpenses.map(expense => (
                  <tr key={expense.id} className="border-b transition-colors hover:bg-gradient-to-r hover:from-slate-50 hover:to-transparent">
                    <td className="p-4 font-medium text-slate-900">{expense.description}</td>
                    <td className="p-4">
                      <Badge className={`${getCategoryColor(expense.category)} border-0`}>
                        {expense.category}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-bold text-slate-900">₹{expense.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-slate-600">
                      {new Date(expense.expense_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{expense.added_by_admin_name}</td>
                    {canEdit && (
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(expense)} // Call handleEdit for existing expense
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(expense.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )) : (
                  <tr className="border-b">
                    <td colSpan={canEdit ? 6 : 5} className="text-center py-12">
                      <Receipt className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-2 text-sm font-medium text-slate-900">No expenses found</h3>
                      <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filter criteria.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Expense Modal */}
      <Dialog open={showModal} onOpenChange={closeModal}> {/* Changed from isModalOpen */}
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </DialogTitle>
            {/* DialogDescription removed as per outline */}
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4"> {/* Wrapped existing fields in form */}
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={currentExpense?.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹) *</Label>
                <Input
                  id="amount"
                  type="number"
                  value={currentExpense?.amount || ''}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={currentExpense?.category} onValueChange={(val) => handleFieldChange('category', val)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expense Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentExpense?.expense_date ? format(currentExpense.expense_date, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentExpense?.expense_date}
                      onSelect={(date) => handleFieldChange('expense_date', date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-3 pt-4 border-t"> {/* Applied new classes */}
              <Button
                type="button"
                variant="outline"
                onClick={closeModal} // Call closeModal
                className="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
              >
                {editingExpense ? 'Update' : 'Add'} Expense
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
