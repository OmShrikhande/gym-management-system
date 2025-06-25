import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Building2, Download, Calendar, Filter, DollarSign, Plus, Trash2, Save, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

const Reports = () => {
  const { user, users, isGymOwner, isSuperAdmin, authFetch } = useAuth();
  const [dateRange, setDateRange] = useState("last30days");
  const [selectedGym, setSelectedGym] = useState("all");
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "utilities",
    description: "",
    amount: ""
  });
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // Calculate real stats for gym owners
  const [realStats, setRealStats] = useState({
    totalMembers: 0,
    totalTrainers: 0,
    totalRevenue: 0,
    newMembers: 0,
    monthlyStats: {}, // Store monthly stats here
    growth: {
      members: 0,
      trainers: 0,
      revenue: 0
    }
  });
  
  // Super Admin specific stats
  const [adminStats, setAdminStats] = useState({
    totalRevenue: 0,
    totalTrainers: 0,
    totalGymOwners: 0,
    newGymOwnersThisMonth: 0,
    monthlyStats: {}, // Monthly breakdown of stats
    yearlyStats: {}, // Yearly breakdown of stats
    isLoading: true
  });

  // Load real stats for gym owner
  useEffect(() => {
    if (!isGymOwner || !user) return;
    
    const calculateStats = async () => {
      try {
        console.log('Calculating gym stats...');
        
        // Try to fetch stats from backend first
        let backendStats = null;
        try {
          const response = await authFetch('/stats/gym');
          if (response.success && response.data) {
            backendStats = response.data;
            console.log('Stats loaded from backend');
          }
        } catch (error) {
          console.log('Using local calculation for stats as backend fetch failed');
        }
        
        // If backend stats are available, use them
        if (backendStats) {
          // Make sure we update the expenses in the monthly stats
          const updatedStats = {...backendStats};
          
          // Update expenses from the current expenses array
          if (updatedStats.monthlyStats) {
            // Calculate expenses per month from expenses array
            expenses.forEach(expense => {
              const expenseDate = new Date(expense.date);
              if (expenseDate.getFullYear() === currentYear) {
                const month = expenseDate.getMonth() + 1;
                
                if (!updatedStats.monthlyStats[month]) {
                  updatedStats.monthlyStats[month] = {
                    newMembers: 0,
                    revenue: 0,
                    expenses: 0,
                    profit: 0
                  };
                }
                
                // Reset expenses to recalculate
                if (expense === expenses[0]) {
                  updatedStats.monthlyStats[month].expenses = 0;
                }
                
                updatedStats.monthlyStats[month].expenses += parseFloat(expense.amount);
                
                // Recalculate profit
                updatedStats.monthlyStats[month].profit = 
                  updatedStats.monthlyStats[month].revenue - updatedStats.monthlyStats[month].expenses;
              }
            });
          }
          
          setRealStats(updatedStats);
          return;
        }
        
        // Otherwise calculate from users array
        const members = users.filter(u => u.role === 'member');
        const trainers = users.filter(u => u.role === 'trainer');
        
        // Calculate estimated revenue (based on member count and average fee)
        const avgMembershipFee = 500; // Average monthly fee per member
        const estimatedMonthlyRevenue = members.length * avgMembershipFee;
        
        // Calculate new members in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Assuming users have a createdAt field (ISO string or Date)
        const newMembers = members.filter(member => {
          if (!member.createdAt) return false;
          const joinDate = new Date(member.createdAt);
          return joinDate >= thirtyDaysAgo;
        });
        
        // Calculate monthly stats
        const monthlyStats = {};
        const currentYear = new Date().getFullYear();
        
        // Initialize monthly stats for all months
        for (let month = 1; month <= 12; month++) {
          monthlyStats[month] = {
            newMembers: 0,
            revenue: 0,
            expenses: 0,
            profit: 0
          };
        }
        
        // Calculate new members per month
        members.forEach(member => {
          if (!member.createdAt) return;
          
          const joinDate = new Date(member.createdAt);
          if (joinDate.getFullYear() === currentYear) {
            const month = joinDate.getMonth() + 1;
            monthlyStats[month].newMembers++;
            
            // Add revenue for each month since they joined
            for (let m = month; m <= 12; m++) {
              monthlyStats[m].revenue += avgMembershipFee;
            }
          }
        });
        
        // Calculate expenses per month from expenses array
        expenses.forEach(expense => {
          const expenseDate = new Date(expense.date);
          if (expenseDate.getFullYear() === currentYear) {
            const month = expenseDate.getMonth() + 1;
            monthlyStats[month].expenses += parseFloat(expense.amount);
          }
        });
        
        // Calculate profit for each month
        for (let month = 1; month <= 12; month++) {
          monthlyStats[month].profit = monthlyStats[month].revenue - monthlyStats[month].expenses;
        }
        
        // Calculate growth rates (comparing to previous month)
        const lastMonthMembers = members.length - newMembers.length;
        const memberGrowth = lastMonthMembers > 0 
          ? ((newMembers.length / lastMonthMembers) * 100).toFixed(1) 
          : 100;
        
        // Set the real stats
        setRealStats({
          totalMembers: members.length,
          totalTrainers: trainers.length,
          totalRevenue: estimatedMonthlyRevenue,
          newMembers: newMembers.length,
          monthlyStats: monthlyStats,
          growth: {
            members: parseFloat(memberGrowth),
            trainers: 3.1, // Mock data for now
            revenue: 8.4, // Mock data for now
          }
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      }
    };
    
    calculateStats();
  }, [isGymOwner, user, users, expenses, authFetch, currentYear]);

  // Load expenses from API with localStorage fallback
  useEffect(() => {
    if (!isGymOwner || !user) return;
    
    const loadExpenses = async () => {
      setIsLoading(true);
      
      try {
        console.log('Loading expenses for gym owner:', user._id);
        
        // Try to fetch from API first
        try {
          const response = await authFetch('/expenses');
          
          if (response.success && response.data?.expenses) {
            console.log('Expenses loaded from API:', response.data.expenses.length);
            setExpenses(response.data.expenses);
            
            // Calculate total expenses
            const total = response.data.expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
            setTotalExpenses(total);
            
            // Also update localStorage as a backup
            localStorage.setItem(`gym_expenses_${user._id}`, JSON.stringify(response.data.expenses));
            return;
          }
        } catch (apiError) {
          console.error('Error fetching expenses from API:', apiError);
          // Fall back to localStorage if API fails
        }
        
        // Try to load from localStorage as fallback
        const storedExpenses = localStorage.getItem(`gym_expenses_${user._id}`);
        
        if (storedExpenses) {
          console.log('Expenses loaded from localStorage');
          const parsedExpenses = JSON.parse(storedExpenses);
          setExpenses(parsedExpenses);
          
          // Calculate total expenses
          const total = parsedExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
          setTotalExpenses(total);
          
          // Try to sync with server in the background
          try {
            await authFetch('/expenses/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ expenses: parsedExpenses })
            });
            console.log('Expenses synced with server');
          } catch (syncError) {
            console.error('Error syncing expenses with server:', syncError);
          }
        } else {
          // Initialize with empty array if no data found
          console.log('No expenses found, initializing empty array');
          setExpenses([]);
          setTotalExpenses(0);
        }
      } catch (error) {
        console.error('Error loading expenses:', error);
        setExpenses([]);
        setTotalExpenses(0);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadExpenses();
  }, [isGymOwner, user, authFetch]);
  
  // Load Super Admin stats
  useEffect(() => {
    if (!isSuperAdmin || !user) return;
    
    const fetchSuperAdminStats = async () => {
      setAdminStats(prev => ({ ...prev, isLoading: true }));
      
      try {
        // Fetch total revenue
        const revenueResponse = await authFetch('/subscriptions/revenue/total');
        const totalRevenue = revenueResponse.data?.totalRevenue || 0;
        
        // Fetch all users to calculate stats
        const usersResponse = await authFetch('/users');
        const allUsers = usersResponse.data?.users || [];
        
        // Calculate stats
        const trainers = allUsers.filter(u => u.role === 'trainer');
        const gymOwners = allUsers.filter(u => u.role === 'gym-owner');
        
        // Calculate new gym owners this month
        const newGymOwnersResponse = await authFetch('/users/stats/new-gym-owners');
        const newGymOwnersThisMonth = newGymOwnersResponse.data?.newGymOwnersCount || 0;
        
        // Fetch all subscriptions
        const subscriptionsResponse = await authFetch('/subscriptions');
        const allSubscriptions = subscriptionsResponse.data?.subscriptions || [];
        
        // Calculate monthly stats for the current year
        const monthlyStats = {};
        
        // Initialize monthly stats for all months
        for (let month = 1; month <= 12; month++) {
          monthlyStats[month] = {
            newGymOwners: 0,
            totalRevenue: 0,
            totalTrainers: 0
          };
        }
        
        // Calculate new gym owners per month
        gymOwners.forEach(owner => {
          if (!owner.createdAt) return;
          
          const joinDate = new Date(owner.createdAt);
          if (joinDate.getFullYear() === currentYear) {
            const month = joinDate.getMonth() + 1;
            monthlyStats[month].newGymOwners++;
          }
        });
        
        // Calculate revenue per month from payment history
        allSubscriptions.forEach(subscription => {
          if (!subscription.paymentHistory || subscription.paymentHistory.length === 0) return;
          
          subscription.paymentHistory.forEach(payment => {
            const paymentDate = new Date(payment.date);
            if (paymentDate.getFullYear() === currentYear) {
              const month = paymentDate.getMonth() + 1;
              monthlyStats[month].totalRevenue += payment.amount;
            }
          });
        });
        
        // Calculate yearly stats
        const yearlyStats = {};
        const currentYearStat = {
          newGymOwners: 0,
          totalRevenue: 0,
          totalTrainers: trainers.length
        };
        
        // Sum up monthly stats for yearly total
        for (let month = 1; month <= 12; month++) {
          currentYearStat.newGymOwners += monthlyStats[month].newGymOwners;
          currentYearStat.totalRevenue += monthlyStats[month].totalRevenue;
        }
        
        yearlyStats[currentYear] = currentYearStat;
        
        // Set the admin stats
        setAdminStats({
          totalRevenue,
          totalTrainers: trainers.length,
          totalGymOwners: gymOwners.length,
          newGymOwnersThisMonth,
          monthlyStats,
          yearlyStats,
          isLoading: false
        });
        
        console.log('Admin stats loaded:', {
          totalRevenue,
          totalTrainers: trainers.length,
          totalGymOwners: gymOwners.length,
          newGymOwnersThisMonth,
          monthlyStats,
          yearlyStats
        });
      } catch (error) {
        console.error('Error fetching Super Admin stats:', error);
        setAdminStats(prev => ({ 
          ...prev, 
          isLoading: false,
          totalRevenue: 0,
          totalTrainers: 0,
          totalGymOwners: 0,
          newGymOwnersThisMonth: 0
        }));
      }
    };
    
    fetchSuperAdminStats();
  }, [isSuperAdmin, user, authFetch, currentMonth, currentYear]);

  // Handle adding a new expense
  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate amount is a number
    if (isNaN(parseFloat(newExpense.amount))) {
      toast.error('Amount must be a valid number');
      return;
    }
    
    // Show loading state
    setIsLoading(true);
    
    try {
      const expenseToAdd = {
        id: Date.now().toString(),
        ...newExpense,
        amount: parseFloat(newExpense.amount),
        gymOwnerId: user._id,
        createdAt: new Date().toISOString()
      };
      
      // Try to save to API first
      let savedExpense = expenseToAdd;
      try {
        const response = await authFetch('/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(expenseToAdd)
        });
        
        if (response.success && response.data?.expense) {
          // Use the expense returned from the server (it might have a different ID)
          savedExpense = response.data.expense;
          console.log('Expense saved to server:', savedExpense);
        }
      } catch (apiError) {
        console.error('Error saving expense to API:', apiError);
        // Continue with local saving if API fails
      }
      
      // Update local state
      const updatedExpenses = [...expenses, savedExpense];
      setExpenses(updatedExpenses);
      
      // Update total
      const newTotal = totalExpenses + parseFloat(savedExpense.amount);
      setTotalExpenses(newTotal);
      
      // Save to localStorage as backup
      if (user) {
        localStorage.setItem(`gym_expenses_${user._id}`, JSON.stringify(updatedExpenses));
      }
      
      // Reset form
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: "utilities",
        description: "",
        amount: ""
      });
      
      setIsAddingExpense(false);
      toast.success('Expense added successfully');
      
      // Update monthly stats
      const expenseDate = new Date(savedExpense.date);
      const expenseMonth = expenseDate.getMonth() + 1;
      const expenseYear = expenseDate.getFullYear();
      
      if (expenseYear === currentYear) {
        setRealStats(prevStats => {
          const updatedMonthlyStats = { ...prevStats.monthlyStats };
          
          if (!updatedMonthlyStats[expenseMonth]) {
            updatedMonthlyStats[expenseMonth] = {
              newMembers: 0,
              revenue: 0,
              expenses: 0,
              profit: 0
            };
          }
          
          updatedMonthlyStats[expenseMonth].expenses += parseFloat(savedExpense.amount);
          updatedMonthlyStats[expenseMonth].profit = 
            updatedMonthlyStats[expenseMonth].revenue - updatedMonthlyStats[expenseMonth].expenses;
          
          return {
            ...prevStats,
            monthlyStats: updatedMonthlyStats
          };
        });
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting an expense
  const handleDeleteExpense = async (id) => {
    const expenseToDelete = expenses.find(e => e.id === id);
    if (!expenseToDelete) return;
    
    // Show loading state
    setIsLoading(true);
    
    try {
      // Try to delete from API first
      try {
        await authFetch(`/expenses/${id}`, {
          method: 'DELETE'
        });
        console.log('Expense deleted from server:', id);
      } catch (apiError) {
        console.error('Error deleting expense from API:', apiError);
        // Continue with local deletion if API fails
      }
      
      // Update local state
      const updatedExpenses = expenses.filter(e => e.id !== id);
      setExpenses(updatedExpenses);
      
      // Update total
      const newTotal = totalExpenses - parseFloat(expenseToDelete.amount);
      setTotalExpenses(newTotal);
      
      // Save to localStorage as backup
      if (user) {
        localStorage.setItem(`gym_expenses_${user._id}`, JSON.stringify(updatedExpenses));
      }
      
      toast.success('Expense deleted successfully');
      
      // Update monthly stats
      const expenseDate = new Date(expenseToDelete.date);
      const expenseMonth = expenseDate.getMonth() + 1;
      const expenseYear = expenseDate.getFullYear();
      
      if (expenseYear === currentYear) {
        setRealStats(prevStats => {
          const updatedMonthlyStats = { ...prevStats.monthlyStats };
          
          if (updatedMonthlyStats[expenseMonth]) {
            updatedMonthlyStats[expenseMonth].expenses -= parseFloat(expenseToDelete.amount);
            updatedMonthlyStats[expenseMonth].profit = 
              updatedMonthlyStats[expenseMonth].revenue - updatedMonthlyStats[expenseMonth].expenses;
          }
          
          return {
            ...prevStats,
            monthlyStats: updatedMonthlyStats
          };
        });
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency in INR
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Generate expense report
  const generateExpenseReport = () => {
    // Filter expenses based on selected period
    let filteredExpenses = [...expenses];
    
    if (reportPeriod === "monthly") {
      filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() + 1 === currentMonth && 
               expenseDate.getFullYear() === currentYear;
      });
    } else if (reportPeriod === "yearly") {
      filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === currentYear;
      });
    }
    
    // Calculate total for filtered expenses
    const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    
    // Group expenses by category
    const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
      const category = expense.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += parseFloat(expense.amount);
      return acc;
    }, {});
    
    // Create report text
    const reportTitle = reportPeriod === "monthly" 
      ? `Expense Report for ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`
      : `Expense Report for Year ${currentYear}`;
    
    let reportText = `${reportTitle}\n\n`;
    reportText += `Total Expenses: ${formatINR(filteredTotal)}\n\n`;
    reportText += "Expenses by Category:\n";
    
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
      reportText += `${category.charAt(0).toUpperCase() + category.slice(1)}: ${formatINR(amount)}\n`;
    });
    
    reportText += "\nDetailed Expenses:\n";
    filteredExpenses.forEach(expense => {
      reportText += `${expense.date} - ${expense.description} - ${formatINR(expense.amount)} (${expense.category})\n`;
    });
    
    // Create and download the report file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expense-report-${reportPeriod === "monthly" ? `${currentYear}-${currentMonth}` : currentYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Expense report generated successfully');
  };
  
  // Generate complete gym report with all stats
  const generateCompleteReport = () => {
    // Create report title based on user role
    let reportTitle;
    if (isSuperAdmin) {
      reportTitle = reportPeriod === "monthly" 
        ? `Platform Performance Report for ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`
        : reportPeriod === "yearly" 
          ? `Platform Performance Report for Year ${currentYear}`
          : `Platform Performance Report - All Time`;
    } else {
      reportTitle = reportPeriod === "monthly" 
        ? `Gym Performance Report for ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`
        : reportPeriod === "yearly" 
          ? `Gym Performance Report for Year ${currentYear}`
          : `Gym Performance Report - All Time`;
    }
    
    let reportText = `${reportTitle}\n`;
    reportText += "=".repeat(reportTitle.length) + "\n\n";
    
    if (isSuperAdmin) {
      // Super Admin report
      reportText += `Report Generated: ${new Date().toLocaleString()}\n\n`;
      
      // Add overall stats
      reportText += "OVERALL PLATFORM METRICS\n";
      reportText += "-------------------------\n";
      reportText += `Total Gym Owners: ${adminStats.totalGymOwners || 0}\n`;
      reportText += `Total Trainers: ${adminStats.totalTrainers || 0}\n`;
      reportText += `Total Revenue: ${formatINR(adminStats.totalRevenue || 0)}\n`;
      
      if (reportPeriod === "monthly") {
        reportText += `New Gym Owners (${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })}): ${adminStats.monthlyStats?.[currentMonth]?.newGymOwners || 0}\n`;
        reportText += `Monthly Revenue: ${formatINR(adminStats.monthlyStats?.[currentMonth]?.totalRevenue || 0)}\n\n`;
      } else if (reportPeriod === "yearly") {
        // Calculate yearly totals
        let yearlyNewGymOwners = 0;
        let yearlyRevenue = 0;
        
        if (adminStats.monthlyStats) {
          for (let month = 1; month <= 12; month++) {
            yearlyNewGymOwners += adminStats.monthlyStats[month]?.newGymOwners || 0;
            yearlyRevenue += adminStats.monthlyStats[month]?.totalRevenue || 0;
          }
        }
        
        reportText += `New Gym Owners (${currentYear}): ${yearlyNewGymOwners}\n`;
        reportText += `Yearly Revenue: ${formatINR(yearlyRevenue)}\n\n`;
      }
      
      // Add monthly breakdown for the year
      reportText += "MONTHLY BREAKDOWN\n";
      reportText += "----------------\n";
      
      if (adminStats.monthlyStats) {
        for (let month = 1; month <= 12; month++) {
          const monthName = new Date(currentYear, month - 1).toLocaleString('default', { month: 'long' });
          const monthStats = adminStats.monthlyStats[month] || { newGymOwners: 0, totalRevenue: 0 };
          
          reportText += `${monthName}:\n`;
          reportText += `  New Gym Owners: ${monthStats.newGymOwners || 0}\n`;
          reportText += `  Revenue: ${formatINR(monthStats.totalRevenue || 0)}\n\n`;
        }
      } else {
        reportText += "No monthly data available.\n\n";
      }
    } else {
      // Gym Owner report
      reportText += `Gym Name: ${user?.gymName || 'Your Gym'}\n`;
      reportText += `Report Generated: ${new Date().toLocaleString()}\n\n`;
      
      // Add overall stats
      reportText += "OVERALL PERFORMANCE METRICS\n";
      reportText += "-------------------------\n";
      reportText += `Total Members: ${realStats.totalMembers}\n`;
      reportText += `Total Trainers: ${realStats.totalTrainers}\n`;
      reportText += `Total Revenue: ${formatINR(realStats.totalRevenue)}\n`;
      reportText += `New Members (Last 30 days): ${realStats.newMembers}\n\n`;
    }
    
    // Add monthly stats if available
    if (reportPeriod === "monthly" && realStats.monthlyStats && realStats.monthlyStats[currentMonth]) {
      const monthStats = realStats.monthlyStats[currentMonth];
      reportText += `MONTHLY PERFORMANCE - ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}\n`;
      reportText += "-------------------------\n";
      reportText += `New Members: ${monthStats.newMembers}\n`;
      reportText += `Monthly Revenue: ${formatINR(monthStats.revenue)}\n`;
      reportText += `Monthly Expenses: ${formatINR(monthStats.expenses)}\n`;
      reportText += `Monthly Profit: ${formatINR(monthStats.profit)}\n\n`;
    }
    
    // Add yearly stats if available
    if (reportPeriod === "yearly" && realStats.monthlyStats) {
      reportText += `YEARLY PERFORMANCE - ${currentYear}\n`;
      reportText += "-------------------------\n";
      
      let yearlyNewMembers = 0;
      let yearlyRevenue = 0;
      let yearlyExpenses = 0;
      let yearlyProfit = 0;
      
      for (let month = 1; month <= 12; month++) {
        if (realStats.monthlyStats[month]) {
          yearlyNewMembers += realStats.monthlyStats[month].newMembers;
          yearlyRevenue += realStats.monthlyStats[month].revenue;
          yearlyExpenses += realStats.monthlyStats[month].expenses;
          yearlyProfit += realStats.monthlyStats[month].profit;
        }
      }
      
      reportText += `New Members: ${yearlyNewMembers}\n`;
      reportText += `Yearly Revenue: ${formatINR(yearlyRevenue)}\n`;
      reportText += `Yearly Expenses: ${formatINR(yearlyExpenses)}\n`;
      reportText += `Yearly Profit: ${formatINR(yearlyProfit)}\n\n`;
      
      // Add monthly breakdown
      reportText += "MONTHLY BREAKDOWN\n";
      reportText += "----------------\n";
      
      for (let month = 1; month <= 12; month++) {
        const monthName = new Date(currentYear, month - 1).toLocaleString('default', { month: 'long' });
        const monthStats = realStats.monthlyStats[month] || { newMembers: 0, revenue: 0, expenses: 0, profit: 0 };
        
        reportText += `${monthName}:\n`;
        reportText += `  New Members: ${monthStats.newMembers}\n`;
        reportText += `  Revenue: ${formatINR(monthStats.revenue)}\n`;
        reportText += `  Expenses: ${formatINR(monthStats.expenses)}\n`;
        reportText += `  Profit: ${formatINR(monthStats.profit)}\n\n`;
      }
    }
    
    // Add expense details
    let filteredExpenses = [...expenses];
    
    if (reportPeriod === "monthly") {
      filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() + 1 === currentMonth && 
               expenseDate.getFullYear() === currentYear;
      });
    } else if (reportPeriod === "yearly") {
      filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getFullYear() === currentYear;
      });
    }
    
    if (filteredExpenses.length > 0) {
      // Calculate total for filtered expenses
      const filteredTotal = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      
      // Group expenses by category
      const expensesByCategory = filteredExpenses.reduce((acc, expense) => {
        const category = expense.category;
        if (!acc[category]) {
          acc[category] = 0;
        }
        acc[category] += parseFloat(expense.amount);
        return acc;
      }, {});
      
      reportText += "EXPENSE DETAILS\n";
      reportText += "--------------\n";
      reportText += `Total Expenses: ${formatINR(filteredTotal)}\n\n`;
      
      reportText += "Expenses by Category:\n";
      Object.entries(expensesByCategory).forEach(([category, amount]) => {
        reportText += `${category.charAt(0).toUpperCase() + category.slice(1)}: ${formatINR(amount)}\n`;
      });
      
      reportText += "\nDetailed Expenses:\n";
      filteredExpenses.forEach(expense => {
        reportText += `${expense.date} - ${expense.description} - ${formatINR(expense.amount)} (${expense.category})\n`;
      });
    }
    
    // Create and download the report file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Set appropriate filename based on user role
    if (isSuperAdmin) {
      a.download = `platform-report-${reportPeriod === "monthly" ? `${currentYear}-${currentMonth}` : reportPeriod === "yearly" ? `${currentYear}` : "all-time"}.txt`;
    } else {
      a.download = `gym-report-${reportPeriod === "monthly" ? `${currentYear}-${currentMonth}` : reportPeriod === "yearly" ? `${currentYear}` : "all-time"}.txt`;
    }
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(`${isSuperAdmin ? 'Platform' : 'Gym'} report generated successfully`);
  };


  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
            <p className="text-gray-400">Monitor performance and usage across all gyms</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={generateCompleteReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Complete Report
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        {/* Filters */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">View Period</label>
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              {reportPeriod === "monthly" && (
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Month</label>
                  <select
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                    className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Year</label>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - i}>
                      {new Date().getFullYear() - i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Stats Summary */}
        {isGymOwner && reportPeriod === "monthly" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear} Summary
              </CardTitle>
              <CardDescription className="text-gray-400">
                Monthly performance metrics for your gym
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">New Members</h3>
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {realStats.monthlyStats[currentMonth]?.newMembers || 0}
                  </p>
                  <p className="text-sm text-gray-400">
                    Joined in {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })}
                  </p>
                </div>
                
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Revenue</h3>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatINR(realStats.monthlyStats[currentMonth]?.revenue || 0)}
                  </p>
                  <p className="text-sm text-gray-400">
                    Monthly revenue
                  </p>
                </div>
                
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Expenses</h3>
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatINR(realStats.monthlyStats[currentMonth]?.expenses || 0)}
                  </p>
                  <p className="text-sm text-gray-400">
                    Monthly expenses
                  </p>
                </div>
                
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium">Profit</h3>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {formatINR(realStats.monthlyStats[currentMonth]?.profit || 0)}
                  </p>
                  <p className="text-sm text-gray-400">
                    Revenue - Expenses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Super Admin Stats */}
        {isSuperAdmin && (
          <>
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">
                  {reportPeriod === "monthly" 
                    ? `${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear} Summary` 
                    : `${currentYear} Summary`}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {reportPeriod === "monthly" ? "Monthly" : "Yearly"} performance metrics across all gyms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">Total Revenue</h3>
                      <DollarSign className="h-5 w-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {adminStats.isLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : reportPeriod === "monthly" ? (
                        formatINR(adminStats.monthlyStats[currentMonth]?.totalRevenue || 0)
                      ) : (
                        formatINR(adminStats.yearlyStats[currentYear]?.totalRevenue || 0)
                      )}
                    </p>
                    <p className="text-sm text-gray-400">
                      {reportPeriod === "monthly" ? "Monthly" : "Yearly"} revenue
                    </p>
                  </div>
                  
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">Total Trainers</h3>
                      <Users className="h-5 w-5 text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {adminStats.isLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        adminStats.totalTrainers
                      )}
                    </p>
                    <p className="text-sm text-gray-400">
                      Across all gyms
                    </p>
                  </div>
                  
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">Total Gym Owners</h3>
                      <Building2 className="h-5 w-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {adminStats.isLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        adminStats.totalGymOwners
                      )}
                    </p>
                    <p className="text-sm text-gray-400">
                      Registered on platform
                    </p>
                  </div>
                  
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium">New Gym Owners</h3>
                      <Users className="h-5 w-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {adminStats.isLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : reportPeriod === "monthly" ? (
                        adminStats.monthlyStats[currentMonth]?.newGymOwners || 0
                      ) : (
                        adminStats.yearlyStats[currentYear]?.newGymOwners || 0
                      )}
                    </p>
                    <p className="text-sm text-gray-400">
                      {reportPeriod === "monthly" 
                        ? `Joined in ${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })}`
                        : `Joined in ${currentYear}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly Revenue Breakdown for Super Admin */}
            {reportPeriod === "monthly" && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Revenue Breakdown</CardTitle>
                  <CardDescription className="text-gray-400">
                    Revenue trends across all months in {currentYear}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      const monthName = new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' });
                      const revenue = adminStats.monthlyStats[month]?.totalRevenue || 0;
                      const maxRevenue = Math.max(...Object.values(adminStats.monthlyStats || {}).map(stat => stat.totalRevenue || 0));
                      const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
                      
                      return (
                        <div 
                          key={month} 
                          className={`p-3 rounded-lg ${month === currentMonth ? 'bg-blue-900/40 border border-blue-500' : 'bg-gray-700/30'}`}
                          onClick={() => setCurrentMonth(month)}
                          style={{ cursor: 'pointer' }}
                        >
                          <p className="text-white font-medium text-center">{monthName}</p>
                          <div className="mt-2 h-20 flex items-end justify-center">
                            <div 
                              className="w-full bg-blue-500 rounded-t"
                              style={{ height: `${percentage}%`, minHeight: revenue > 0 ? '4px' : '0' }}
                            ></div>
                          </div>
                          <p className="text-center text-white mt-2">{formatINR(revenue)}</p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Overall Stats for Gym Owners */}
        {isGymOwner && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Members</p>
                    <p className="text-2xl font-bold text-white">{realStats.totalMembers}</p>
                    <p className="text-green-400 text-sm">+{realStats.growth.members}% vs last period</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">{formatINR(realStats.totalRevenue)}</p>
                    <p className="text-green-400 text-sm">+{realStats.growth.revenue}% vs last period</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Trainers</p>
                    <p className="text-2xl font-bold text-white">{realStats.totalTrainers}</p>
                    <p className="text-green-400 text-sm">+{realStats.growth.trainers}% vs last period</p>
                  </div>
                  <Users className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">New Members</p>
                    <p className="text-2xl font-bold text-white">{realStats.newMembers}</p>
                    <p className="text-green-400 text-sm">+{realStats.growth.members}% vs last period</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Expense Tracking for Gym Owners */}
        {isGymOwner && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Expense Tracking</CardTitle>
                <CardDescription className="text-gray-400">
                  Track and manage your gym expenses
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => setIsAddingExpense(!isAddingExpense)}
                >
                  {isAddingExpense ? (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </>
                  )}
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={generateExpenseReport}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Report Period Selection */}
              <div className="mb-6 bg-gray-700/30 p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div>
                    <Label className="text-sm text-gray-400 mb-2 block">Report Period</Label>
                    <select
                      value={reportPeriod}
                      onChange={(e) => setReportPeriod(e.target.value)}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  
                  {reportPeriod === "monthly" && (
                    <div>
                      <Label className="text-sm text-gray-400 mb-2 block">Month</Label>
                      <select
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm text-gray-400 mb-2 block">Year</Label>
                    <select
                      value={currentYear}
                      onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                      className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <option key={i} value={new Date().getFullYear() - i}>
                          {new Date().getFullYear() - i}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="ml-auto">
                    <div className="bg-blue-900/30 p-4 rounded-lg">
                      <p className="text-gray-300 text-sm">Total Expenses</p>
                      <p className="text-2xl font-bold text-white">{formatINR(totalExpenses)}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Add Expense Form */}
              {isAddingExpense && (
                <div className="mb-6 bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                  <h3 className="text-white font-medium mb-4">Add New Expense</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="expense-date" className="text-gray-300 mb-2 block">Date</Label>
                      <Input
                        id="expense-date"
                        type="date"
                        value={newExpense.date}
                        onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense-category" className="text-gray-300 mb-2 block">Category</Label>
                      <select
                        id="expense-category"
                        value={newExpense.category}
                        onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                      >
                        <option value="utilities">Utilities</option>
                        <option value="rent">Rent</option>
                        <option value="equipment">Equipment</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="salaries">Salaries</option>
                        <option value="marketing">Marketing</option>
                        <option value="supplies">Supplies</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="expense-description" className="text-gray-300 mb-2 block">Description</Label>
                      <Input
                        id="expense-description"
                        placeholder="Enter description"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="expense-amount" className="text-gray-300 mb-2 block">Amount ($)</Label>
                      <div className="flex">
                        <Input
                          id="expense-amount"
                          type="number"
                          placeholder="0.00"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                          className="bg-gray-700 border-gray-600 text-white flex-1"
                        />
                        <Button 
                          className="ml-2 bg-green-600 hover:bg-green-700"
                          onClick={handleAddExpense}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>Saving...</>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Expense History Section */}
              <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-medium">Expense History</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">
                      {reportPeriod === "monthly" 
                        ? `${new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} ${currentYear}`
                        : reportPeriod === "yearly" 
                          ? `${currentYear}` 
                          : "All Time"}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 border-gray-600 text-gray-300 hover:bg-gray-700"
                      onClick={generateExpenseReport}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
                
                {/* Expenses Table */}
                <div className="rounded-md border border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-800/50">
                        <TableHead className="text-gray-300">Date</TableHead>
                        <TableHead className="text-gray-300">Category</TableHead>
                        <TableHead className="text-gray-300">Description</TableHead>
                        <TableHead className="text-gray-300 text-right">Amount</TableHead>
                        <TableHead className="text-gray-300 w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        // Filter expenses based on selected period
                        let filteredExpenses = [...expenses];
                        
                        if (reportPeriod === "monthly") {
                          filteredExpenses = expenses.filter(expense => {
                            const expenseDate = new Date(expense.date);
                            return expenseDate.getMonth() + 1 === currentMonth && 
                                  expenseDate.getFullYear() === currentYear;
                          });
                        } else if (reportPeriod === "yearly") {
                          filteredExpenses = expenses.filter(expense => {
                            const expenseDate = new Date(expense.date);
                            return expenseDate.getFullYear() === currentYear;
                          });
                        }
                        
                        if (filteredExpenses.length === 0) {
                          return (
                            <TableRow className="border-gray-700">
                              <TableCell colSpan={5} className="text-center py-6 text-gray-400">
                                {expenses.length === 0 
                                  ? "No expenses recorded yet. Click \"Add Expense\" to get started."
                                  : `No expenses found for the selected ${reportPeriod === "monthly" ? "month" : "year"}.`
                                }
                              </TableCell>
                            </TableRow>
                          );
                        }
                        
                        // Sort expenses by date (newest first)
                        return filteredExpenses
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map((expense) => (
                            <TableRow key={expense.id} className="border-gray-700 hover:bg-gray-800/30">
                              <TableCell className="text-white">
                                {new Date(expense.date).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </TableCell>
                              <TableCell className="text-white capitalize">{expense.category}</TableCell>
                              <TableCell className="text-white">{expense.description}</TableCell>
                              <TableCell className="text-white text-right">{formatINR(parseFloat(expense.amount))}</TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <span className="h-4 w-4 animate-spin">•</span>
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ));
                      })()}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Expense Summary */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    {(() => {
                      // Filter expenses based on selected period
                      let filteredExpenses = [...expenses];
                      
                      if (reportPeriod === "monthly") {
                        filteredExpenses = expenses.filter(expense => {
                          const expenseDate = new Date(expense.date);
                          return expenseDate.getMonth() + 1 === currentMonth && 
                                expenseDate.getFullYear() === currentYear;
                        });
                      } else if (reportPeriod === "yearly") {
                        filteredExpenses = expenses.filter(expense => {
                          const expenseDate = new Date(expense.date);
                          return expenseDate.getFullYear() === currentYear;
                        });
                      }
                      
                      return `Showing ${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? 's' : ''}`;
                    })()}
                  </div>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-2">Total:</span>
                    <span className="text-white font-medium">
                      {(() => {
                        // Filter expenses based on selected period
                        let filteredExpenses = [...expenses];
                        
                        if (reportPeriod === "monthly") {
                          filteredExpenses = expenses.filter(expense => {
                            const expenseDate = new Date(expense.date);
                            return expenseDate.getMonth() + 1 === currentMonth && 
                                  expenseDate.getFullYear() === currentYear;
                          });
                        } else if (reportPeriod === "yearly") {
                          filteredExpenses = expenses.filter(expense => {
                            const expenseDate = new Date(expense.date);
                            return expenseDate.getFullYear() === currentYear;
                          });
                        }
                        
                        const total = filteredExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                        return formatINR(total);
                      })()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Monthly Expense Summary */}
              {reportPeriod === "monthly" && (
                <div className="mt-6 bg-gray-700/30 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-4">
                    {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long' })} {currentYear} Financial Summary
                  </h3>
                  
                  {/* Monthly Profit Calculation */}
                  <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-white font-medium mb-3">Monthly Profit Calculation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-800">
                        <p className="text-gray-300 text-sm">Revenue</p>
                        <p className="text-xl font-bold text-white">
                          {formatINR(realStats.monthlyStats[currentMonth]?.revenue || 0)}
                        </p>
                      </div>
                      <div className="bg-red-900/20 p-3 rounded-lg border border-red-800">
                        <p className="text-gray-300 text-sm">Expenses</p>
                        <p className="text-xl font-bold text-white">
                          {formatINR(realStats.monthlyStats[currentMonth]?.expenses || 0)}
                        </p>
                      </div>
                      <div className="bg-green-900/20 p-3 rounded-lg border border-green-800">
                        <p className="text-gray-300 text-sm">Profit</p>
                        <p className="text-xl font-bold text-white">
                          {formatINR((realStats.monthlyStats[currentMonth]?.revenue || 0) - 
                                    (realStats.monthlyStats[currentMonth]?.expenses || 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-gray-300 text-sm mb-2">Expenses by Category</h4>
                      {(() => {
                        // Filter expenses for the selected month
                        const monthlyExpenses = expenses.filter(expense => {
                          const expenseDate = new Date(expense.date);
                          return expenseDate.getMonth() + 1 === currentMonth && 
                                expenseDate.getFullYear() === currentYear;
                        });
                        
                        // Group by category
                        const expensesByCategory = monthlyExpenses.reduce((acc, expense) => {
                          const category = expense.category;
                          if (!acc[category]) {
                            acc[category] = 0;
                          }
                          acc[category] += parseFloat(expense.amount);
                          return acc;
                        }, {});
                        
                        if (Object.keys(expensesByCategory).length === 0) {
                          return <p className="text-gray-400">No expenses for this month</p>;
                        }
                        
                        return (
                          <div className="space-y-2">
                            {Object.entries(expensesByCategory).map(([category, amount], index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-white capitalize">{category}</span>
                                <span className="text-white">{formatINR(amount)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div>
                      <h4 className="text-gray-300 text-sm mb-2">Monthly Totals</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Expenses</span>
                          <span className="text-white font-medium">
                            {(() => {
                              // Calculate total for the selected month
                              const monthlyExpenses = expenses.filter(expense => {
                                const expenseDate = new Date(expense.date);
                                return expenseDate.getMonth() + 1 === currentMonth && 
                                      expenseDate.getFullYear() === currentYear;
                              });
                              
                              const total = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                              return formatINR(total);
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Average Daily Expense</span>
                          <span className="text-white font-medium">
                            {(() => {
                              // Calculate average daily expense for the selected month
                              const monthlyExpenses = expenses.filter(expense => {
                                const expenseDate = new Date(expense.date);
                                return expenseDate.getMonth() + 1 === currentMonth && 
                                      expenseDate.getFullYear() === currentYear;
                              });
                              
                              const totalExpense = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                              const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
                              
                              return formatINR(totalExpense / daysInMonth);
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Monthly Revenue</span>
                          <span className="text-white font-medium">
                            {formatINR(realStats.monthlyStats[currentMonth]?.revenue || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Monthly Profit</span>
                          <span className="text-white font-medium">
                            {(() => {
                              const monthlyExpenses = expenses.filter(expense => {
                                const expenseDate = new Date(expense.date);
                                return expenseDate.getMonth() + 1 === currentMonth && 
                                      expenseDate.getFullYear() === currentYear;
                              });
                              
                              const totalExpense = monthlyExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                              const monthlyRevenue = realStats.monthlyStats[currentMonth]?.revenue || 0;
                              const profit = monthlyRevenue - totalExpense;
                              
                              return formatINR(profit);
                            })()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Daily Expenses for Current Month */}
                      <h4 className="text-gray-300 text-sm mt-4 mb-2">Daily Expenses</h4>
                      <div className="max-h-60 overflow-y-auto pr-2">
                        {(() => {
                          // Group expenses by day for the selected month
                          const monthlyExpenses = expenses.filter(expense => {
                            const expenseDate = new Date(expense.date);
                            return expenseDate.getMonth() + 1 === currentMonth && 
                                  expenseDate.getFullYear() === currentYear;
                          });
                          
                          // Group by date
                          const expensesByDay = {};
                          monthlyExpenses.forEach(expense => {
                            if (!expensesByDay[expense.date]) {
                              expensesByDay[expense.date] = [];
                            }
                            expensesByDay[expense.date].push(expense);
                          });
                          
                          if (Object.keys(expensesByDay).length === 0) {
                            return <p className="text-gray-400">No daily expenses recorded</p>;
                          }
                          
                          // Sort dates in descending order (newest first)
                          const sortedDates = Object.keys(expensesByDay).sort((a, b) => 
                            new Date(b) - new Date(a)
                          );
                          
                          return (
                            <div className="space-y-3">
                              {sortedDates.map(date => {
                                const dayExpenses = expensesByDay[date];
                                const totalForDay = dayExpenses.reduce(
                                  (sum, expense) => sum + parseFloat(expense.amount), 0
                                );
                                
                                const formattedDate = new Date(date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                });
                                
                                return (
                                  <div key={date} className="bg-gray-800/50 p-2 rounded border border-gray-700">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="text-white font-medium">{formattedDate}</span>
                                      <span className="text-white">{formatINR(totalForDay)}</span>
                                    </div>
                                    <div className="text-xs space-y-1">
                                      {dayExpenses.map((expense, idx) => (
                                        <div key={idx} className="flex justify-between text-gray-400">
                                          <span className="capitalize">{expense.category}: {expense.description}</span>
                                          <span>{formatINR(parseFloat(expense.amount))}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Yearly Expense Summary */}
              {reportPeriod === "yearly" && (
                <div className="mt-6 bg-gray-700/30 p-4 rounded-lg">
                  <h3 className="text-white font-medium mb-4">
                    {currentYear} Financial Summary
                  </h3>
                  
                  {/* Yearly Profit Calculation */}
                  <div className="mb-6 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <h4 className="text-white font-medium mb-3">Yearly Profit Calculation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(() => {
                        // Calculate yearly totals
                        let yearlyRevenue = 0;
                        let yearlyExpenses = 0;
                        
                        for (let month = 1; month <= 12; month++) {
                          if (realStats.monthlyStats[month]) {
                            yearlyRevenue += realStats.monthlyStats[month].revenue || 0;
                            yearlyExpenses += realStats.monthlyStats[month].expenses || 0;
                          }
                        }
                        
                        const yearlyProfit = yearlyRevenue - yearlyExpenses;
                        
                        return (
                          <>
                            <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-800">
                              <p className="text-gray-300 text-sm">Total Revenue</p>
                              <p className="text-xl font-bold text-white">{formatINR(yearlyRevenue)}</p>
                            </div>
                            <div className="bg-red-900/20 p-3 rounded-lg border border-red-800">
                              <p className="text-gray-300 text-sm">Total Expenses</p>
                              <p className="text-xl font-bold text-white">{formatINR(yearlyExpenses)}</p>
                            </div>
                            <div className="bg-green-900/20 p-3 rounded-lg border border-green-800">
                              <p className="text-gray-300 text-sm">Total Profit</p>
                              <p className="text-xl font-bold text-white">{formatINR(yearlyProfit)}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-gray-300 text-sm mb-2">Expenses by Category</h4>
                      {(() => {
                        // Filter expenses for the selected year
                        const yearlyExpenses = expenses.filter(expense => {
                          const expenseDate = new Date(expense.date);
                          return expenseDate.getFullYear() === currentYear;
                        });
                        
                        // Group by category
                        const expensesByCategory = yearlyExpenses.reduce((acc, expense) => {
                          const category = expense.category;
                          if (!acc[category]) {
                            acc[category] = 0;
                          }
                          acc[category] += parseFloat(expense.amount);
                          return acc;
                        }, {});
                        
                        if (Object.keys(expensesByCategory).length === 0) {
                          return <p className="text-gray-400">No expenses for this year</p>;
                        }
                        
                        return (
                          <div className="space-y-2">
                            {Object.entries(expensesByCategory).map(([category, amount], index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-white capitalize">{category}</span>
                                <span className="text-white">{formatINR(amount)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    
                    <div>
                      <h4 className="text-gray-300 text-sm mb-2">Monthly Breakdown</h4>
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {(() => {
                          // Calculate expenses by month
                          const expensesByMonth = {};
                          
                          // Initialize all months
                          for (let month = 1; month <= 12; month++) {
                            expensesByMonth[month] = 0;
                          }
                          
                          // Sum expenses by month
                          expenses.forEach(expense => {
                            const expenseDate = new Date(expense.date);
                            if (expenseDate.getFullYear() === currentYear) {
                              const month = expenseDate.getMonth() + 1;
                              expensesByMonth[month] += parseFloat(expense.amount);
                            }
                          });
                          
                          // Check if there are any expenses
                          const hasExpenses = Object.values(expensesByMonth).some(amount => amount > 0);
                          
                          if (!hasExpenses) {
                            return <p className="text-gray-400">No expenses recorded for this year</p>;
                          }
                          
                          return (
                            <div className="space-y-2">
                              {Object.entries(expensesByMonth).map(([month, amount]) => {
                                const monthName = new Date(currentYear, parseInt(month) - 1, 1)
                                  .toLocaleString('default', { month: 'long' });
                                
                                return (
                                  <div key={month} className="flex justify-between">
                                    <span className="text-white">{monthName}</span>
                                    <span className="text-white">{formatINR(amount)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}       
      </div>
    </DashboardLayout>
  );
};

export default Reports;