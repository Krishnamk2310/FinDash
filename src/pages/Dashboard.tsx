import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface ExpenseStats {
  totalExpenses: number;
  thisMonth: number;
  lastMonth: number;
  topCategory: string;
  recentExpenses: any[];
}

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ExpenseStats>({
    totalExpenses: 0,
    thisMonth: 0,
    lastMonth: 0,
    topCategory: 'N/A',
    recentExpenses: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch all expenses
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false });

      // Calculate this month's expenses
      const thisMonthExpenses = allExpenses?.filter(
        (e) => new Date(e.date) >= firstDayThisMonth
      ) || [];
      const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      // Calculate last month's expenses
      const lastMonthExpenses = allExpenses?.filter(
        (e) => new Date(e.date) >= firstDayLastMonth && new Date(e.date) <= lastDayLastMonth
      ) || [];
      const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      // Calculate total
      const total = allExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      // Find top category
      const categoryTotals = allExpenses?.reduce((acc: any, e) => {
        acc[e.category] = (acc[e.category] || 0) + Number(e.amount);
        return acc;
      }, {});
      const topCategory = categoryTotals
        ? Object.entries(categoryTotals).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A'
        : 'N/A';

      // Recent expenses (last 5)
      const recent = allExpenses?.slice(0, 5) || [];

      setStats({
        totalExpenses: total,
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        topCategory,
        recentExpenses: recent,
      });
    } catch (error: any) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const percentageChange = stats.lastMonth > 0
    ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Track your expenses and financial insights</p>
          </div>
          <Button
            onClick={() => navigate('/expenses')}
            className="gradient-primary hover:opacity-90 transition-smooth gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Expenses
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalExpenses.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">₹{stats.thisMonth.toFixed(2)}</div>
              <div className="flex items-center gap-1 mt-1">
                {percentageChange > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-accent" />
                    <p className="text-xs text-accent">+{percentageChange.toFixed(1)}% from last month</p>
                  </>
                ) : percentageChange < 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3 text-success" />
                    <p className="text-xs text-success">{percentageChange.toFixed(1)}% from last month</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Same as last month</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last Month
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.lastMonth.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Previous period</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Top Category
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topCategory}</div>
              <p className="text-xs text-muted-foreground mt-1">Most spending</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Expenses */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : stats.recentExpenses.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-muted-foreground">No expenses yet</p>
                <Button
                  onClick={() => navigate('/expenses')}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentExpenses.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-smooth"
                  >
                    <div>
                      <p className="font-medium">{expense.description || expense.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()} • {expense.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">₹{Number(expense.amount).toFixed(2)}</p>
                      {expense.payment_method && (
                        <p className="text-xs text-muted-foreground">{expense.payment_method}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
