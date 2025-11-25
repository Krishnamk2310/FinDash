import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Rent', 'Entertainment', 'Healthcare', 'Education', 'Other'];

const Budget = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [spending, setSpending] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (user) {
      fetchBudgets();
    }
  }, [user, month]);

  const fetchBudgets = async () => {
    try {
      // Fetch budgets for the selected month
      const monthDate = `${month}-01`;
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user!.id)
        .eq('month', monthDate);

      setBudgets(budgetData || []);

      // Fetch expenses for the selected month
      const startDate = new Date(month + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      const { data: expenseData } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);

      // Calculate spending by category
      const categorySpending: any = {};
      expenseData?.forEach((e) => {
        categorySpending[e.category] = (categorySpending[e.category] || 0) + Number(e.amount);
      });
      setSpending(categorySpending);
    } catch (error: any) {
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category || !amount || Number(amount) <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    try {
      const monthDate = `${month}-01`;
      
      // Check if budget already exists
      const existingBudget = budgets.find((b) => b.category === category);

      if (existingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({ amount: Number(amount) })
          .eq('id', existingBudget.id);

        if (error) throw error;
        toast.success('Budget updated successfully!');
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([{
            user_id: user!.id,
            month: monthDate,
            category: category as any,
            amount: Number(amount),
          }]);

        if (error) throw error;
        toast.success('Budget created successfully!');
      }

      fetchBudgets();
      setDialogOpen(false);
      setCategory('');
      setAmount('');
    } catch (error: any) {
      toast.error('Failed to save budget');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Budget deleted successfully!');
      fetchBudgets();
    } catch (error: any) {
      toast.error('Failed to delete budget');
    }
  };

  const getBudgetStatus = (budgetAmount: number, spent: number) => {
    const percentage = (spent / budgetAmount) * 100;
    if (percentage >= 100) return { color: 'text-destructive', icon: AlertCircle, message: 'Over budget!' };
    if (percentage >= 80) return { color: 'text-yellow-500', icon: AlertCircle, message: 'Close to limit' };
    return { color: 'text-success', icon: CheckCircle, message: 'On track' };
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Budget Management</h1>
            <p className="text-muted-foreground">Set and track your monthly budgets</p>
          </div>
          <div className="flex gap-3 items-center">
            <div className="space-y-2">
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-secondary/50 border-border/50"
              />
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gradient-primary hover:opacity-90 transition-smooth gap-2">
                  <Plus className="h-4 w-4" />
                  Set Budget
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border/50">
                <DialogHeader>
                  <DialogTitle>Set Budget</DialogTitle>
                  <DialogDescription>
                    Set a spending limit for a category this month
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={category} onValueChange={setCategory} required>
                      <SelectTrigger className="bg-secondary/50 border-border/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Budget Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="bg-secondary/50 border-border/50"
                    />
                  </div>

                  <Button type="submit" className="w-full gradient-primary hover:opacity-90">
                    Set Budget
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Budgets List */}
        {loading ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">Loading...</p>
            </CardContent>
          </Card>
        ) : budgets.length === 0 ? (
          <Card className="glass border-border/50">
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No budgets set for this month. Create your first budget!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {budgets.map((budget) => {
              const spent = spending[budget.category] || 0;
              const remaining = Number(budget.amount) - spent;
              const percentage = Math.min((spent / Number(budget.amount)) * 100, 100);
              const status = getBudgetStatus(Number(budget.amount), spent);
              const StatusIcon = status.icon;

              return (
                <Card key={budget.id} className="glass border-border/50 hover-lift">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{budget.category}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                          <StatusIcon className={`h-4 w-4 ${status.color}`} />
                          <p className={`text-sm ${status.color}`}>{status.message}</p>
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(budget.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Spent</span>
                        <span className="font-medium">
                          ₹{spent.toFixed(2)} / ₹{Number(budget.amount).toFixed(2)}
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-border/50">
                      <span className="text-sm text-muted-foreground">Remaining</span>
                      <span className={`font-bold text-lg ${remaining < 0 ? 'text-destructive' : 'text-success'}`}>
                        ₹{remaining.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Budget;
