import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, MapPin, Plus, Edit } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Schedule = () => {
  const [selectedView, setSelectedView] = useState("week");
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Mock schedule data
  const scheduleData = [
    {
      id: 1,
      date: "2024-06-10",
      time: "09:00 AM",
      duration: "1 hour",
      type: "Personal Training",
      member: "Alex Johnson",
      location: "Gym Floor A",
      status: "scheduled"
    },
    {
      id: 2,
      date: "2024-06-10",
      time: "11:00 AM",
      duration: "45 mins",
      type: "Group Session",
      member: "HIIT Class (8 members)",
      location: "Studio 1",
      status: "scheduled"
    },
    {
      id: 3,
      date: "2024-06-10",
      time: "03:00 PM",
      duration: "1 hour",
      type: "Personal Training",
      member: "Sarah Davis",
      location: "Gym Floor B",
      status: "completed"
    },
    {
      id: 4,
      date: "2024-06-11",
      time: "10:00 AM",
      duration: "1 hour",
      type: "Personal Training",
      member: "Mike Chen",
      location: "Gym Floor A",
      status: "scheduled"
    }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      'scheduled': { variant: 'default', label: 'Scheduled' },
      'completed': { variant: 'secondary', label: 'Completed' },
      'cancelled': { variant: 'destructive', label: 'Cancelled' }
    };
    const config = statusConfig[status] || { variant: 'outline', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeBadge = (type) => {
    const variant = type === 'Personal Training' ? 'default' : 'secondary';
    return <Badge variant={variant}>{type}</Badge>;
  };

  const todaysSessions = scheduleData.filter(session => 
    session.date === new Date().toISOString().split('T')[0]
  );

  const upcomingSessions = scheduleData.filter(session => 
    new Date(session.date) > new Date()
  );

  const scheduleStats = {
    todaySessions: todaysSessions.length,
    weekSessions: scheduleData.length,
    completedToday: todaysSessions.filter(s => s.status === 'completed').length,
    upcomingThis: upcomingSessions.length
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">My Schedule</h1>
              <p className="text-gray-400">Manage your training sessions and classes</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Session
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Today's Sessions</p>
                    <p className="text-2xl font-bold text-white">{scheduleStats.todaySessions}</p>
                  </div>
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">This Week</p>
                    <p className="text-2xl font-bold text-white">{scheduleStats.weekSessions}</p>
                  </div>
                  <Clock className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Completed Today</p>
                    <p className="text-2xl font-bold text-white">{scheduleStats.completedToday}</p>
                  </div>
                  <Users className="h-6 w-6 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Upcoming</p>
                    <p className="text-2xl font-bold text-white">{scheduleStats.upcomingThis}</p>
                  </div>
                  <Calendar className="h-6 w-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* View Selector */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Schedule Overview</CardTitle>
                  <CardDescription className="text-gray-400">
                    View and manage your training sessions
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant={selectedView === "day" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedView("day")}
                    className="border-gray-600"
                  >
                    Day
                  </Button>
                  <Button 
                    variant={selectedView === "week" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedView("week")}
                    className="border-gray-600"
                  >
                    Week
                  </Button>
                  <Button 
                    variant={selectedView === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedView("month")}
                    className="border-gray-600"
                  >
                    Month
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {scheduleData.map((session) => (
                  <div key={session.id} className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">
                            {new Date(session.date).toLocaleDateString()} at {session.time}
                          </p>
                          <p className="text-sm text-gray-400">Duration: {session.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(session.status)}
                        <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-green-400" />
                        <div>
                          <p className="text-sm text-gray-400">Client/Group</p>
                          <p className="text-white">{session.member}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <div>
                          <p className="text-sm text-gray-400">Location</p>
                          <p className="text-white">{session.location}</p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Session Type</p>
                        {getTypeBadge(session.type)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Schedule;