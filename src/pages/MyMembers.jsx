import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, User, MessageSquare, Calendar, Target, Edit, Dumbbell } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MyMembers = () => {
  const { user, authFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  
  // State for members data
  const [myMembers, setMyMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for workouts data
  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  
  // Load members data
  useEffect(() => {
    const loadMembers = async () => {
      if (!user || user.role !== 'trainer') return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch members assigned to this trainer
        const response = await authFetch(`/users/trainer/${user._id}/members`);
        
        console.log('Members response:', response);
        
        if (response.success || response.status === 'success') {
          setMyMembers(response.data?.members || []);
        } else {
          setError(response.message || 'Failed to load members');
          toast.error(response.message || 'Failed to load members');
        }
      } catch (error) {
        console.error('Error loading members:', error);
        setError('Failed to load members');
        toast.error('Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadMembers();
    }
  }, [user, authFetch]);
  
  // Load workouts data to calculate stats
  useEffect(() => {
    const loadWorkouts = async () => {
      if (!user || user.role !== 'trainer') return;
      
      setWorkoutsLoading(true);
      
      try {
        // Fetch workouts created by this trainer
        const response = await authFetch(`/workouts/trainer/${user._id}`);
        
        console.log('Trainer workouts response:', response);
        
        if (response.success || response.status === 'success') {
          setWorkouts(response.data?.workouts || []);
        }
      } catch (error) {
        console.error('Error loading workouts:', error);
      } finally {
        setWorkoutsLoading(false);
      }
    };
    
    if (user) {
      loadWorkouts();
    }
  }, [user, authFetch]);
  
  // Filter members based on search and filter
  const filteredMembers = myMembers.filter(member => {
    const matchesSearch = 
      (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (member.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (member.phone?.includes(searchTerm) || false);
    
    const matchesGoal = filterGoal === "all" || member.goal === filterGoal;
    
    return matchesSearch && matchesGoal;
  });
  
  // Get goal badge
  const getGoalBadge = (goal) => {
    const goalConfig = {
      'weight-loss': { variant: 'destructive', label: 'Weight Loss' },
      'weight-gain': { variant: 'default', label: 'Weight Gain' },
      'general-fitness': { variant: 'secondary', label: 'General Fitness' }
    };
    const config = goalConfig[goal] || { variant: 'outline', label: goal || 'Not Set' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  
  // Calculate member stats
  const memberStats = {
    total: myMembers.length,
    weightLoss: myMembers.filter(m => m.goal === 'weight-loss').length,
    weightGain: myMembers.filter(m => m.goal === 'weight-gain').length,
    avgAttendance: myMembers.length ? 
      Math.round(myMembers.reduce((sum, m) => sum + (parseInt(m.attendanceRate) || 0), 0) / myMembers.length) : 0
  };
  
  // Get member workouts
  const getMemberWorkouts = (memberId) => {
    if (!workouts || !memberId) return [];
    
    return workouts.filter(w => {
      // Handle different possible formats of assignedTo
      if (typeof w.assignedTo === 'string') {
        return w.assignedTo === memberId;
      } else if (w.assignedTo && w.assignedTo._id) {
        return w.assignedTo._id === memberId;
      }
      return false;
    });
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Members</h1>
            <p className="text-gray-400">Manage and track your assigned members</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{memberStats.total}</p>
                </div>
                <div className="bg-blue-900/30 p-3 rounded-full">
                  <User className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Weight Loss</p>
                  <p className="text-2xl font-bold text-white">{memberStats.weightLoss}</p>
                </div>
                <div className="bg-red-900/30 p-3 rounded-full">
                  <Target className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Weight Gain</p>
                  <p className="text-2xl font-bold text-white">{memberStats.weightGain}</p>
                </div>
                <div className="bg-green-900/30 p-3 rounded-full">
                  <Target className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Attendance</p>
                  <p className="text-2xl font-bold text-white">{memberStats.avgAttendance}%</p>
                </div>
                <div className="bg-purple-900/30 p-3 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Members List */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Assigned Members</CardTitle>
            <CardDescription className="text-gray-400">
              View and manage your member assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <select
                value={filterGoal}
                onChange={(e) => setFilterGoal(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Goals</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="weight-gain">Weight Gain</option>
                <option value="general-fitness">General Fitness</option>
              </select>
            </div>

            {isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-400">Loading members...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-gray-800/30 rounded-lg border border-gray-700">
                <p className="text-red-400">{error}</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-10 bg-gray-800/30 rounded-lg border border-gray-700">
                <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Members Found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  You don't have any members assigned to you yet.
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Member Details</TableHead>
                      <TableHead className="text-gray-300">Goal & Workouts</TableHead>
                      <TableHead className="text-gray-300">Activity</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => {
                      const memberWorkouts = getMemberWorkouts(member._id);
                      
                      return (
                        <TableRow key={member._id} className="border-gray-700 hover:bg-gray-800/30">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-blue-400" />
                              <div>
                                <p className="font-medium text-white">{member.name}</p>
                                <p className="text-sm text-gray-400">
                                  {member.gender || 'N/A'} • {member.phone || member.email || 'N/A'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Joined: {formatDate(member.createdAt)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {getGoalBadge(member.goal)}
                              <div className="flex items-center mt-2">
                                <Dumbbell className="h-4 w-4 text-blue-400 mr-1" />
                                <p className="text-sm text-gray-300">
                                  {memberWorkouts.length} Assigned Workouts
                                </p>
                              </div>
                              {member.progressSummary && (
                                <p className="text-sm text-gray-300">{member.progressSummary}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {member.attendanceRate && (
                                <p className="text-white">Attendance: {member.attendanceRate}%</p>
                              )}
                              {member.lastActivity ? (
                                <p className="text-sm text-gray-400">
                                  Last seen: {formatDate(member.lastActivity)}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-400">
                                  Last updated: {formatDate(member.updatedAt)}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => window.location.href = `/members/${member._id}`}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Profile
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => window.location.href = `/messages?to=${member._id}`}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default MyMembers;