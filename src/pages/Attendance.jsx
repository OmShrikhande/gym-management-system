import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Calendar, Clock, User, TrendingUp, BarChart3, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

const Attendance = () => {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const { authFetch, users, isGymOwner, isTrainer } = useAuth();
  
  const [attendanceData, setAttendanceData] = useState([]);
  const [memberInfo, setMemberInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDays: 0,
    thisMonth: 0,
    today: 0, // Changed from thisWeek to today
    averagePerWeek: 0,
    streak: 0
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [memberId, users]);

  useEffect(() => {
    const handleAttendanceMarked = (event) => {
      if (event.detail.memberId === memberId) {
        console.log('Attendance marked for this member, refreshing data');
        fetchAttendanceData();
      }
    };

    window.addEventListener('attendanceMarked', handleAttendanceMarked);
    
    return () => {
      window.removeEventListener('attendanceMarked', handleAttendanceMarked);
    };
  }, [memberId]);

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      
      const member = users.find(user => user._id === memberId);
      if (!member) {
        navigate('/members');
        return;
      }
      
      setMemberInfo(member);
      
      const attendance = member.attendance || [];
      
      const sortedAttendance = attendance
        .map(record => {
          // Create date object and ensure it's in local timezone
          const date = new Date(record.timestamp);
          return {
            ...record,
            date: date,
            time: date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }),
            dateString: date.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          };
        })
        .sort((a, b) => b.date - a.date);
      
      setAttendanceData(sortedAttendance);
      
      calculateStats(sortedAttendance);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (attendance) => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
    
    // This month count
    const thisMonthCount = attendance.filter(record => {
      const recordDate = record.date;
      return recordDate.getMonth() === thisMonth && recordDate.getFullYear() === thisYear;
    }).length;
    
    // Today's count - more accurate comparison
    const todayCount = attendance.filter(record => {
      const recordDate = new Date(record.date);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const recordStart = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
      return recordStart.getTime() === todayStart.getTime();
    }).length;
    
    // Calculate average per week (last 4 weeks)
    const fourWeeksAgo = new Date(now.getTime() - (4 * 7 * 24 * 60 * 60 * 1000));
    const lastFourWeeksAttendance = attendance.filter(record => record.date >= fourWeeksAgo);
    const averagePerWeek = Math.round(lastFourWeeksAttendance.length / 4);
    
    // Calculate current streak
    let streak = 0;
    const sortedByDate = [...attendance].sort((a, b) => b.date - a.date);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedByDate.length; i++) {
      const recordDate = new Date(sortedByDate[i].date);
      recordDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((todayStart - recordDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }
    
    setStats({
      totalDays: attendance.length,
      thisMonth: thisMonthCount,
      today: todayCount, // Changed from thisWeek to today
      averagePerWeek,
      streak
    });
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  const getAttendanceStatus = (date) => {
    const today = new Date();
    const recordDate = new Date(date);
    
    // Set both dates to start of day for accurate comparison
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const recordStart = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
    
    const diffTime = todayStart - recordStart;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { label: 'Today', variant: 'default' };
    if (diffDays === 1) return { label: 'Yesterday', variant: 'secondary' };
    if (diffDays <= 7) return { label: `${diffDays} days ago`, variant: 'outline' };
    return { label: recordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), variant: 'outline' };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-400">Loading attendance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/members')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Attendance History</h1>
            <p className="text-gray-400">
              {memberInfo?.name} - {memberInfo?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-400">Total Days</p>
                  <p className="text-2xl font-bold text-white">{stats.totalDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-400">Today</p> {/* Changed from This Week to Today */}
                  <p className="text-2xl font-bold text-white">{stats.today}</p> {/* Changed from stats.thisWeek to stats.today */}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-400">Avg/Week</p>
                  <p className="text-2xl font-bold text-white">{stats.averagePerWeek}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-400">Current Streak</p>
                  <p className="text-2xl font-bold text-white">{stats.streak}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Attendance Records</CardTitle>
            <CardDescription className="text-gray-400">
              Complete attendance history with dates and times
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceData.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No attendance records found</p>
                <p className="text-sm text-gray-500 mt-2">
                  Attendance will appear here when the member scans QR codes
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">#</TableHead>
                    <TableHead className="text-gray-300">Date</TableHead>
                    <TableHead className="text-gray-300">Time</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Day</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceData.map((record, index) => {
                    const status = getAttendanceStatus(record.date);
                    return (
                      <TableRow key={index} className="border-gray-700">
                        <TableCell className="text-gray-300">
                          {attendanceData.length - index}
                        </TableCell>
                        <TableCell className="text-white">
                          {record.dateString}
                        </TableCell>
                        <TableCell className="text-white">
                          {record.time}
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {record.date.toLocaleDateString('en-US', { weekday: 'long' })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;