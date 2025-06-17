import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, Building2, Download, Calendar, Filter } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Reports = () => {
  const [dateRange, setDateRange] = useState("last30days");
  const [selectedGym, setSelectedGym] = useState("all");

  // Mock data for reports
  const reportData = {
    overview: {
      totalGyms: 24,
      totalMembers: 1247,
      totalTrainers: 85,
      totalRevenue: 45620,
      growth: {
        gyms: 12,
        members: 8.5,
        trainers: 5.2,
        revenue: 15.3
      }
    },
    gymStats: [
      { name: "PowerFit Gym", members: 342, trainers: 8, revenue: 3420, workoutsCompleted: 156 },
      { name: "FitZone Studio", members: 125, trainers: 3, revenue: 1250, workoutsCompleted: 89 },
      { name: "Elite Fitness", members: 280, trainers: 6, revenue: 2800, workoutsCompleted: 134 }
    ],
    workoutStats: {
      totalWorkouts: 1560,
      videoViews: 12450,
      popularWorkouts: [
        { name: "HIIT Training", views: 2340, completion: 85 },
        { name: "Strength Building", views: 1890, completion: 92 },
        { name: "Cardio Blast", views: 1560, completion: 78 }
      ]
    },
    dietStats: {
      totalPlans: 890,
      fatLossPlans: 520,
      weightGainPlans: 280,
      customPlans: 90
    },
    messageStats: {
      totalSent: 5670,
      birthdayWishes: 234,
      motivational: 1200,
      offers: 890,
      custom: 3346
    }
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
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                  <option value="last3months">Last 3 Months</option>
                  <option value="last6months">Last 6 Months</option>
                  <option value="lastyear">Last Year</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Gym</label>
                <select
                  value={selectedGym}
                  onChange={(e) => setSelectedGym(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="all">All Gyms</option>
                  <option value="powerfit">PowerFit Gym</option>
                  <option value="fitzone">FitZone Studio</option>
                  <option value="elite">Elite Fitness</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Gyms</p>
                  <p className="text-2xl font-bold text-white">{reportData.overview.totalGyms}</p>
                  <p className="text-green-400 text-sm">+{reportData.overview.growth.gyms}% vs last period</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{reportData.overview.totalMembers}</p>
                  <p className="text-green-400 text-sm">+{reportData.overview.growth.members}% vs last period</p>
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
                  <p className="text-2xl font-bold text-white">${reportData.overview.totalRevenue}</p>
                  <p className="text-green-400 text-sm">+{reportData.overview.growth.revenue}% vs last period</p>
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
                  <p className="text-2xl font-bold text-white">{reportData.overview.totalTrainers}</p>
                  <p className="text-green-400 text-sm">+{reportData.overview.growth.trainers}% vs last period</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gym Performance */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Gym Performance</CardTitle>
            <CardDescription className="text-gray-400">
              Individual gym statistics and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.gymStats.map((gym, index) => (
                <div key={index} className="p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{gym.name}</h3>
                      <div className="flex gap-6 mt-2">
                        <div>
                          <p className="text-sm text-gray-400">Members</p>
                          <p className="text-white font-medium">{gym.members}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Trainers</p>
                          <p className="text-white font-medium">{gym.trainers}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Revenue</p>
                          <p className="text-white font-medium">${gym.revenue}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Workouts</p>
                          <p className="text-white font-medium">{gym.workoutsCompleted}</p>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workout & Diet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Workout Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Video usage and workout completion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Workouts Created</span>
                  <span className="text-white font-medium">{reportData.workoutStats.totalWorkouts}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Video Views</span>
                  <span className="text-white font-medium">{reportData.workoutStats.videoViews}</span>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-white font-medium mb-3">Popular Workouts</h4>
                  <div className="space-y-3">
                    {reportData.workoutStats.popularWorkouts.map((workout, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <p className="text-white">{workout.name}</p>
                          <p className="text-sm text-gray-400">{workout.views} views</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">{workout.completion}%</p>
                          <p className="text-sm text-gray-400">completion</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Diet Plan Analytics</CardTitle>
              <CardDescription className="text-gray-400">
                Diet plan distribution and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Diet Plans</span>
                  <span className="text-white font-medium">{reportData.dietStats.totalPlans}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Fat Loss Plans</span>
                  <span className="text-white font-medium">{reportData.dietStats.fatLossPlans}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Weight Gain Plans</span>
                  <span className="text-white font-medium">{reportData.dietStats.weightGainPlans}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Custom Plans</span>
                  <span className="text-white font-medium">{reportData.dietStats.customPlans}</span>
                </div>

                <div className="mt-6">
                  <h4 className="text-white font-medium mb-3">Message Analytics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Total Messages Sent</span>
                      <span className="text-white">{reportData.messageStats.totalSent}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Birthday Wishes</span>
                      <span className="text-white">{reportData.messageStats.birthdayWishes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Motivational</span>
                      <span className="text-white">{reportData.messageStats.motivational}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;