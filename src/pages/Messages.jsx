import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Calendar, Users, User } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Messages = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data for messages
  const messages = [
    {
      id: 1,
      type: "Birthday",
      content: "Happy Birthday [NAME]! Wishing you another year of strength and fitness achievements!",
      targetMembers: ["Alex Johnson", "Sarah Davis"],
      sendDate: "2024-03-15",
      sendTime: "09:00",
      channel: "SMS",
      sentStatus: "Sent",
      deliveredCount: 2,
      totalTargets: 2
    },
    {
      id: 2,
      type: "Anniversary", 
      content: "Congratulations [NAME] on completing your first year with us! Keep up the great work!",
      targetMembers: ["David Brown"],
      sendDate: "2024-03-10",
      sendTime: "10:30",
      channel: "WhatsApp",
      sentStatus: "Sent",
      deliveredCount: 1,
      totalTargets: 1
    },
    {
      id: 3,
      type: "Offer",
      content: "Special 20% discount on Personal Training sessions! Valid until end of month. Contact us now!",
      targetMembers: "All Active Members",
      sendDate: "2024-03-12",
      sendTime: "14:00",
      channel: "Email",
      sentStatus: "Sent",
      deliveredCount: 45,
      totalTargets: 50
    },
    {
      id: 4,
      type: "Custom",
      content: "Don't forget your workout session today at 6 PM. See you there!",
      targetMembers: ["Alex Johnson", "Lisa Garcia"],
      sendDate: "2024-03-20",
      sendTime: "15:30",
      channel: "SMS",
      sentStatus: "Scheduled",
      deliveredCount: 0,
      totalTargets: 2
    },
    {
      id: 5,
      type: "Motivation",
      content: "You're stronger than you think! Every workout brings you closer to your goals. Keep pushing!",
      targetMembers: "Weight Loss Members",
      sendDate: "2024-03-18",
      sendTime: "08:00",
      channel: "In-App",
      sentStatus: "Sent",
      deliveredCount: 15,
      totalTargets: 18
    }
  ];

  const messageTemplates = [
    {
      id: 1,
      type: "Birthday",
      title: "Birthday Wishes",
      content: "Happy Birthday [NAME]! Wishing you another year of strength and fitness achievements!",
      isActive: true
    },
    {
      id: 2,
      type: "Anniversary",
      title: "Gym Anniversary",
      content: "Congratulations [NAME] on completing your [PERIOD] with us! Keep up the great work!",
      isActive: true
    },
    {
      id: 3,
      type: "Motivation",
      title: "Weekly Motivation",
      content: "You're stronger than you think [NAME]! Every workout brings you closer to your goals.",
      isActive: true
    },
    {
      id: 4,
      type: "Offer",
      title: "Special Discount",
      content: "Special offer for [NAME]! Get [DISCOUNT]% off on [SERVICE]. Limited time only!",
      isActive: false
    }
  ];

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || message.type === filterType;
    const matchesStatus = filterStatus === "all" || message.sentStatus === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeBadge = (type) => {
    const typeConfig = {
      'Birthday': { variant: 'default', color: 'text-blue-400' },
      'Anniversary': { variant: 'secondary', color: 'text-green-400' },
      'Offer': { variant: 'destructive', color: 'text-red-400' },
      'Custom': { variant: 'outline', color: 'text-gray-400' },
      'Motivation': { variant: 'default', color: 'text-purple-400' }
    };
    const config = typeConfig[type] || { variant: 'outline', color: 'text-gray-400' };
    return <Badge variant={config.variant}>{type}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variant = status === 'Sent' ? 'default' : status === 'Scheduled' ? 'secondary' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getChannelBadge = (channel) => {
    const channelConfig = {
      'SMS': { variant: 'default' },
      'WhatsApp': { variant: 'secondary' },
      'Email': { variant: 'outline' },
      'In-App': { variant: 'destructive' }
    };
    const config = channelConfig[channel] || { variant: 'outline' };
    return <Badge variant={config.variant}>{channel}</Badge>;
  };

  const messageStats = {
    total: messages.length,
    sent: messages.filter(m => m.sentStatus === 'Sent').length,
    scheduled: messages.filter(m => m.sentStatus === 'Scheduled').length,
    totalDelivered: messages.reduce((sum, message) => sum + message.deliveredCount, 0)
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Messages Management</h1>
            <p className="text-gray-400">Send personalized messages and manage templates</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create New Message
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Messages</p>
                  <p className="text-2xl font-bold text-white">{messageStats.total}</p>
                </div>
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Sent</p>
                  <p className="text-2xl font-bold text-white">{messageStats.sent}</p>
                </div>
                <Users className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Scheduled</p>
                  <p className="text-2xl font-bold text-white">{messageStats.scheduled}</p>
                </div>
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Delivered</p>
                  <p className="text-2xl font-bold text-white">{messageStats.totalDelivered}</p>
                </div>
                <User className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message History */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Message History</CardTitle>
            <CardDescription className="text-gray-400">
              View and manage sent and scheduled messages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search messages or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Types</option>
                <option value="Birthday">Birthday</option>
                <option value="Anniversary">Anniversary</option>
                <option value="Offer">Offer</option>
                <option value="Custom">Custom</option>
                <option value="Motivation">Motivation</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Status</option>
                <option value="Sent">Sent</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            <div className="rounded-md border border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700 hover:bg-gray-800/50">
                    <TableHead className="text-gray-300">Message Details</TableHead>
                    <TableHead className="text-gray-300">Recipients</TableHead>
                    <TableHead className="text-gray-300">Channel</TableHead>
                    <TableHead className="text-gray-300">Delivery</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id} className="border-gray-700 hover:bg-gray-800/30">
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeBadge(message.type)}
                          </div>
                          <p className="text-white text-sm font-medium line-clamp-2">
                            {message.content.substring(0, 60)}...
                          </p>
                          <p className="text-gray-400 text-xs">
                            {message.sendDate} at {message.sendTime}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {typeof message.targetMembers === 'string' ? (
                            <p className="text-white text-sm">{message.targetMembers}</p>
                          ) : (
                            <div>
                              <p className="text-white text-sm">{message.targetMembers[0]}</p>
                              {message.targetMembers.length > 1 && (
                                <p className="text-gray-400 text-xs">
                                  +{message.targetMembers.length - 1} more
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getChannelBadge(message.channel)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white text-sm">
                            {message.deliveredCount}/{message.totalTargets}
                          </p>
                          <p className="text-gray-400 text-xs">
                            {Math.round((message.deliveredCount / message.totalTargets) * 100)}% success
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(message.sentStatus)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Message Templates */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Message Templates</CardTitle>
            <CardDescription className="text-gray-400">
              Manage preloaded message templates for quick sending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {messageTemplates.map((template) => (
                <Card key={template.id} className="bg-gray-700/50 border-gray-600">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-white text-base mb-2">{template.title}</CardTitle>
                        <div className="flex gap-2">
                          {getTypeBadge(template.type)}
                          <Badge variant={template.isActive ? "default" : "destructive"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {template.content}
                    </p>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-600">
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Messages;