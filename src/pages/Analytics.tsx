import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COLORS = {
  Food: '#f87171',
  Travel: '#fb923c',
  Shopping: '#fbbf24',
  Bills: '#facc15',
  Rent: '#a3e635',
  Entertainment: '#4ade80',
  Healthcare: '#34d399',
  Education: '#2dd4bf',
  Other: '#60a5fa',
};

const Analytics = () => {
  const { user } = useAuth();
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    monthlyTotal: 0,
    yearlyTotal: 0,
    avgDaily: 0,
    topCategories: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id);

      if (!expenses || expenses.length === 0) {
        setLoading(false);
        return;
      }

      // Category breakdown
      const categoryTotals: any = {};
      expenses.forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });

      const categoryChartData = Object.entries(categoryTotals).map(([name, value]: any) => ({
        name,
        value: Number(value.toFixed(2)),
      }));
      setCategoryData(categoryChartData);

      // Monthly breakdown (last 6 months)
      const monthlyTotals: any = {};
      expenses.forEach((e) => {
        const month = new Date(e.date).toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(e.amount);
      });

      const monthlyChartData = Object.entries(monthlyTotals)
        .slice(-6)
        .map(([name, value]: any) => ({
          name,
          amount: Number(value.toFixed(2)),
        }));
      setMonthlyData(monthlyChartData);

      // Daily data (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentExpenses = expenses.filter(
        (e) => new Date(e.date) >= thirtyDaysAgo
      );

      const dailyTotals: any = {};
      recentExpenses.forEach((e) => {
        const day = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        dailyTotals[day] = (dailyTotals[day] || 0) + Number(e.amount);
      });

      const dailyChartData = Object.entries(dailyTotals)
        .slice(-14)
        .map(([name, value]: any) => ({
          name,
          amount: Number(value.toFixed(2)),
        }));
      setDailyData(dailyChartData);

      // Calculate stats
      const now = new Date();
      const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayThisYear = new Date(now.getFullYear(), 0, 1);

      const monthlyExpenses = expenses.filter((e) => new Date(e.date) >= firstDayThisMonth);
      const yearlyExpenses = expenses.filter((e) => new Date(e.date) >= firstDayThisYear);

      const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const yearlyTotal = yearlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      const daysSinceStart = Math.max(
        1,
        Math.ceil((now.getTime() - new Date(expenses[expenses.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
      );
      const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const avgDaily = totalAmount / daysSinceStart;

      const topCategories = categoryChartData
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);

      setStats({
        monthlyTotal,
        yearlyTotal,
        avgDaily,
        topCategories,
      });
    } catch (error: any) {
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (categoryData.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">Visualize your spending patterns</p>
          </div>
          <Card className="glass border-border/50">
            <CardContent className="py-12">
              <p className="text-center text-muted-foreground">
                No data yet. Add some expenses to see analytics!
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Visualize your spending patterns</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="glass border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">₹{stats.monthlyTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">This month's expenses</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Yearly Total
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.yearlyTotal.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">This year's expenses</p>
            </CardContent>
          </Card>

          <Card className="glass border-border/50 hover-lift">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Daily
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.avgDaily.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Daily average spending</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Category Pie Chart */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>

              {/* Top Categories */}
              <div className="mt-6 space-y-2">
                <p className="text-sm font-semibold text-muted-foreground">Top 3 Categories</p>
                {stats.topCategories.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <span className="font-medium">{cat.name}</span>
                    <span className="font-bold text-accent">₹{cat.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Monthly Bar Chart */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Amount']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Daily Line Chart */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Daily Spending (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Amount']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
