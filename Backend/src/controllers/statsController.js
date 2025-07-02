import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get gym statistics for gym owners
export const getGymStats = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user.id;
  const currentYear = new Date().getFullYear();
  
  try {
    // Get all members and trainers created by this gym owner
    const members = await User.find({ 
      createdBy: gymOwnerId,
      role: 'member'
    }).select('createdAt membershipStartDate membershipEndDate planType membershipType');
    
    const trainers = await User.find({ 
      createdBy: gymOwnerId,
      role: 'trainer'
    }).select('createdAt');
    
    // Calculate basic stats
    const totalMembers = members.length;
    const totalTrainers = trainers.length;
    
    // Calculate new members in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newMembers = members.filter(member => {
      if (!member.createdAt) return false;
      const joinDate = new Date(member.createdAt);
      return joinDate >= thirtyDaysAgo;
    }).length;
    
    // Calculate estimated revenue based on member count and plan types
    let totalRevenue = 0;
    const planPrices = {
      'Basic': 300,
      'Standard': 500,
      'Premium': 800,
      'Premium Member': 800,
      'VIP': 1200
    };
    
    members.forEach(member => {
      const planType = member.planType || member.membershipType || 'Standard';
      const monthlyFee = planPrices[planType] || planPrices['Standard'];
      totalRevenue += monthlyFee;
    });
    
    // Calculate monthly stats for the current year
    const monthlyStats = {};
    
    // Initialize monthly stats for all months
    for (let month = 1; month <= 12; month++) {
      monthlyStats[month] = {
        newMembers: 0,
        revenue: 0,
        expenses: 0, // This will be updated by frontend with expense data
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
        
        // Calculate revenue for each month since they joined
        const planType = member.planType || member.membershipType || 'Standard';
        const monthlyFee = planPrices[planType] || planPrices['Standard'];
        
        // Add revenue for each month from join date to end of year
        for (let m = month; m <= 12; m++) {
          monthlyStats[m].revenue += monthlyFee;
        }
      }
    });
    
    // Calculate profit for each month (expenses will be added by frontend)
    for (let month = 1; month <= 12; month++) {
      monthlyStats[month].profit = monthlyStats[month].revenue - monthlyStats[month].expenses;
    }
    
    // Calculate growth rates
    const lastMonthMembers = totalMembers - newMembers;
    const memberGrowth = lastMonthMembers > 0 
      ? ((newMembers / lastMonthMembers) * 100).toFixed(1) 
      : newMembers > 0 ? 100 : 0;
    
    // Calculate trainer growth (comparing current month to previous month)
    const currentMonth = new Date().getMonth() + 1;
    const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    
    const trainersThisMonth = trainers.filter(trainer => {
      const createdAt = new Date(trainer.createdAt);
      return createdAt.getFullYear() === currentYear && createdAt.getMonth() + 1 === currentMonth;
    }).length;
    
    const trainersLastMonth = trainers.filter(trainer => {
      const createdAt = new Date(trainer.createdAt);
      return createdAt.getFullYear() === previousYear && createdAt.getMonth() + 1 === previousMonth;
    }).length;
    
    const trainerGrowth = trainersLastMonth > 0 
      ? (((trainersThisMonth - trainersLastMonth) / trainersLastMonth) * 100).toFixed(1)
      : trainersThisMonth > 0 ? 100 : 0;
    
    // Calculate revenue growth (comparing current month to previous month)
    const revenueThisMonth = monthlyStats[currentMonth].revenue;
    const revenueLastMonth = monthlyStats[previousMonth].revenue;
    const revenueGrowth = revenueLastMonth > 0 
      ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
      : revenueThisMonth > 0 ? 100 : 0;
    
    const stats = {
      totalMembers,
      totalTrainers,
      totalRevenue,
      newMembers,
      monthlyStats,
      growth: {
        members: parseFloat(memberGrowth),
        trainers: parseFloat(trainerGrowth),
        revenue: parseFloat(revenueGrowth)
      }
    };
    
    res.status(200).json({
      status: 'success',
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Error calculating gym stats:', error);
    return next(new AppError('Error calculating gym statistics', 500));
  }
});