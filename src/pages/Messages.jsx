import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2, Calendar, Users, User, X, Send, Loader2, Clock } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";

const Messages = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [realMessages, setRealMessages] = useState([]);
  
  // Get auth context
  const { user, isGymOwner, authFetch } = useAuth();
  
  // New message form state
  const [messageForm, setMessageForm] = useState({
    type: "Custom",
    title: "",
    content: "",
    recipientType: "all", // "all" or "specific"
    selectedMembers: [],
    channel: "In-App",
    successMessage: "" // For displaying success message
  });
  
  // Fetch members and messages on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch members - for gym owners, fetch only their gym's members
        let membersUrl = '/users?role=member';
        if (isGymOwner && user?._id) {
          membersUrl = `/users/gym-owner/${user._id}/members`;
          console.log('Current user is a gym owner with ID:', user._id);
        } else {
          console.log('Current user role:', user?.role);
        }
        
        console.log('Fetching members from URL:', membersUrl);
        const membersResponse = await authFetch(membersUrl);
        console.log('Members response:', membersResponse);
        
        if (membersResponse.status === 'success' || membersResponse.success) {
          // Handle different API response formats
          const membersData = membersResponse.data?.users || membersResponse.data?.members || [];
          console.log('Fetched members:', membersData);
          
          // Ensure each member has a name and email property
          const processedMembers = membersData.map(member => ({
            ...member,
            name: member.name || member.fullName || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : null) || 'Unknown Member',
            email: member.email || member.emailAddress || 'No email'
          }));
          
          setMembers(processedMembers);
          console.log('Processed members for display:', processedMembers);
        } else {
          console.error('Failed to fetch members:', membersResponse);
          
          // If gym owner-specific endpoint failed, try fetching all members as fallback
          if (isGymOwner && user?._id) {
            console.log('Trying fallback: fetching all members');
            try {
              const fallbackResponse = await authFetch('/users?role=member');
              if (fallbackResponse.status === 'success' || fallbackResponse.success) {
                const fallbackData = fallbackResponse.data?.users || [];
                const processedFallbackMembers = fallbackData.map(member => ({
                  ...member,
                  name: member.name || member.fullName || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : null) || 'Unknown Member',
                  email: member.email || member.emailAddress || 'No email'
                }));
                setMembers(processedFallbackMembers);
                console.log('Fallback successful, loaded all members:', processedFallbackMembers.length);
                return;
              }
            } catch (fallbackError) {
              console.error('Fallback also failed:', fallbackError);
            }
          }
          
          toast.error("Failed to load members. Please try again.");
          // Use empty array if all attempts fail
          setMembers([]);
        }
        
        // Fetch messages
        const messagesResponse = await authFetch('/messages/history');
        console.log('Messages response:', messagesResponse);
        
        if (messagesResponse.status === 'success' || messagesResponse.success) {
          setRealMessages(messagesResponse.data?.messages || []);
        } else {
          console.error('Failed to fetch messages:', messagesResponse);
          toast.error("Failed to load message history.");
          // Initialize with empty array
          setRealMessages([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error("An error occurred while loading data.");
        // Use mock data if API fails - but with clear indication these are mock
        setMembers([]);
      }
    };
    
    fetchData();
  }, [user, isGymOwner, authFetch]);

  // Mock data for messages
  const messages = [
    {
      id: 1,
      type: "Birthday",
      content: "Happy Birthday Wishing you another year of strength and fitness achievements!",
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

  const filteredMessages = realMessages.filter(message => {
    const matchesSearch = (message.content && message.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (message.type && message.type.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const getStatusBadge = (status, deliveredCount = 0, totalTargets = 0) => {
    const variant = status === 'Sent' ? 'default' : status === 'Scheduled' ? 'secondary' : 'destructive';
    
    // Add icons to show message status
    let statusIcon = null;
    if (status === 'Sent') {
      // Double check mark for sent and delivered messages (like WhatsApp)
      if (deliveredCount >= totalTargets) {
        statusIcon = <span className="ml-1 text-blue-400">✓✓</span>;
      } else if (deliveredCount > 0) {
        // Single check mark for sent but not all delivered
        statusIcon = <span className="ml-1 text-gray-400">✓</span>;
      }
    } else if (status === 'Scheduled') {
      // Clock icon for scheduled messages
      statusIcon = <Clock className="ml-1 h-3 w-3 inline text-yellow-400" />;
    }
    
    return (
      <div className="flex items-center">
        <Badge variant={variant}>{status}</Badge>
        {statusIcon}
      </div>
    );
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

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setMessageForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle template selection
  const handleTemplateSelect = (templateId) => {
    const template = messageTemplates.find(t => t.id === parseInt(templateId));
    if (template) {
      setSelectedTemplate(template);
      setMessageForm(prev => ({
        ...prev,
        type: template.type,
        title: template.title,
        content: template.content
      }));
    }
  };
  
  // Handle member selection
  const handleMemberSelect = (memberId) => {
    const isSelected = messageForm.selectedMembers.includes(memberId);
    
    if (isSelected) {
      setMessageForm(prev => ({
        ...prev,
        selectedMembers: prev.selectedMembers.filter(id => id !== memberId)
      }));
    } else {
      setMessageForm(prev => ({
        ...prev,
        selectedMembers: [...prev.selectedMembers, memberId]
      }));
    }
  };
  
  // Reset form
  const resetForm = () => {
    setMessageForm({
      type: "Custom",
      title: "",
      content: "",
      recipientType: "all",
      selectedMembers: [],
      channel: "In-App",
      successMessage: ""
    });
    setSelectedTemplate(null);
  };
  
  // Fetch members specifically for the form
  const fetchMembersForForm = async () => {
    try {
      // Fetch members - for gym owners, fetch only their gym's members
      let membersUrl = '/users?role=member';
      if (isGymOwner && user?._id) {
        membersUrl = `/users/gym-owner/${user._id}/members`;
        console.log('Fetching members for form from URL:', membersUrl);
      }
      
      const membersResponse = await authFetch(membersUrl);
      console.log('Members response for form:', membersResponse);
      
      if (membersResponse.status === 'success' || membersResponse.success) {
        // Handle different API response formats
        const membersData = membersResponse.data?.users || membersResponse.data?.members || [];
        
        // Ensure each member has a name and email property
        const processedMembers = membersData.map(member => ({
          ...member,
          name: member.name || member.fullName || (member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : null) || 'Unknown Member',
          email: member.email || member.emailAddress || 'No email'
        }));
        
        setMembers(processedMembers);
        console.log('Updated members for form:', processedMembers);
      } else {
        console.error('Failed to fetch members for form:', membersResponse);
      }
    } catch (error) {
      console.error('Error fetching members for form:', error);
    }
  };

  // Handle dialog open
  const handleDialogOpen = () => {
    setIsCreateDialogOpen(true);
    fetchMembersForForm(); // Fetch fresh members data when opening the form
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsCreateDialogOpen(false);
    resetForm();
  };
  
  // Send message
  const handleSendMessage = async () => {
    if (!messageForm.title.trim() || !messageForm.content.trim()) {
      toast.error("Please provide both title and content for the message");
      return;
    }
    
    if (messageForm.recipientType === "specific" && messageForm.selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }
    
    // Validate schedule date and time if scheduling is enabled
    if (messageForm.isScheduled) {
      if (!messageForm.scheduleDate) {
        toast.error("Please select a date for the scheduled message");
        return;
      }
      
      if (!messageForm.scheduleTime) {
        toast.error("Please select a time for the scheduled message");
        return;
      }
      
      // Validate that the scheduled date is within the next 7 days
      const selectedDate = new Date(`${messageForm.scheduleDate}T${messageForm.scheduleTime}`);
      const now = new Date();
      const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      
      if (selectedDate < now) {
        toast.error("Scheduled time must be in the future");
        return;
      }
      
      if (selectedDate > maxDate) {
        toast.error("Scheduled date must be within the next 7 days");
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      let response;
      
      // Get selected member details for logging
      const selectedMemberDetails = messageForm.recipientType === "specific" 
        ? messageForm.selectedMembers.map(memberId => {
            const member = members.find(m => m._id === memberId);
            return member ? member.name : 'Unknown Member';
          }).join(', ')
        : 'All Members';

      console.log(`Sending message to: ${selectedMemberDetails}`);
      
      // Prepare scheduled date if needed
      let scheduledDateTime = null;
      if (messageForm.isScheduled) {
        scheduledDateTime = new Date(`${messageForm.scheduleDate}T${messageForm.scheduleTime}`).toISOString();
      }
      
      if (messageForm.recipientType === "all") {
        // Send to all members
        response = await authFetch('/messages/send-to-all', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: messageForm.type,
            title: messageForm.title,
            content: messageForm.content,
            channel: messageForm.channel,
            isScheduled: messageForm.isScheduled,
            scheduledDateTime: scheduledDateTime,
            sentStatus: messageForm.isScheduled ? 'Scheduled' : 'Sent'
          })
        });
      } else {
        // Send to specific members - we'll send individual requests for each member
        const sendPromises = messageForm.selectedMembers.map(memberId => {
          // Find the member to get their name for personalization
          const member = members.find(m => m._id === memberId);
          const memberName = member ? member.name : 'Member';
          
          // Replace [NAME] placeholder with actual member name
          const personalizedContent = messageForm.content.replace(/\[NAME\]/g, memberName);
          
          return authFetch(`/messages/send-to-member/${memberId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: messageForm.type,
              title: messageForm.title,
              content: personalizedContent,
              channel: messageForm.channel,
              recipientName: memberName, // Add recipient name to the request
              isScheduled: messageForm.isScheduled,
              scheduledDateTime: scheduledDateTime,
              sentStatus: messageForm.isScheduled ? 'Scheduled' : 'Sent'
            })
          });
        });
        
        // Wait for all messages to be sent
        const results = await Promise.all(sendPromises);
        
        // Check if all messages were sent successfully
        const allSuccessful = results.every(result => result.success || result.ok);
        response = { 
          ok: allSuccessful, 
          success: allSuccessful,
          message: allSuccessful ? 
            `Messages sent successfully to ${selectedMemberDetails}` : 
            'Some messages failed to send'
        };
      }
      
      if (response.ok || response.success) {
        // Show a more prominent success message
        toast.success(
          response.message || "Message sent successfully", 
          {
            duration: 5000,
            style: {
              background: '#10B981',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              fontWeight: 'bold'
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            }
          }
        );
        
        // Display a success message before closing the dialog
        setIsLoading(false);
        setMessageForm(prev => ({
          ...prev,
          successMessage: messageForm.isScheduled 
            ? `Message scheduled for ${new Date(`${messageForm.scheduleDate}T${messageForm.scheduleTime}`).toLocaleString()} to ${messageForm.recipientType === "all" ? "all members" : `${messageForm.selectedMembers.length} member(s)`}`
            : `Message sent successfully to ${messageForm.recipientType === "all" ? "all members" : `${messageForm.selectedMembers.length} member(s)`}`
        }));
        
        // Close the dialog after a short delay to show the success message
        setTimeout(() => {
          handleDialogClose();
        }, 1500);
        
        // Refresh message list
        try {
          const messagesResponse = await authFetch('/messages/history');
          
          if (messagesResponse.success || messagesResponse.status === 'success') {
            setRealMessages(messagesResponse.data?.messages || []);
          }
        } catch (error) {
          console.error('Error refreshing messages:', error);
        }
      } else {
        let errorMessage = "Failed to send message";
        try {
          if (response.json) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("An error occurred while sending the message");
    } finally {
      setIsLoading(false);
    }
  };
  
  const messageStats = {
    total: realMessages.length,
    sent: realMessages.filter(m => m.sentStatus === 'Sent').length,
    scheduled: realMessages.filter(m => m.sentStatus === 'Scheduled' || m.isScheduled).length,
    totalDelivered: realMessages.reduce((sum, message) => sum + (message.deliveredCount || 0), 0),
    scheduledCount: realMessages.filter(m => m.sentStatus === 'Scheduled' || m.isScheduled).length
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
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleDialogOpen}
          >
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
                <div className="relative">
                  <Calendar className="h-6 w-6 text-purple-500" />
                  {messageStats.scheduled > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {messageStats.scheduled}
                    </span>
                  )}
                </div>
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
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <TableRow key={message._id || message.id} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeBadge(message.type || 'Custom')}
                            </div>
                            <p className="text-white text-sm font-medium line-clamp-2">
                              {message.content ? message.content.substring(0, 60) + '...' : 'No content'}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {new Date(message.sendDate || message.createdAt).toLocaleDateString()} at {new Date(message.sendDate || message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {message.recipients && message.recipients.length > 0 ? (
                              <div>
                                <p className="text-white text-sm">
                                  {message.recipients[0].name || message.recipients[0].fullName || 
                                   (message.recipients[0].firstName && message.recipients[0].lastName ? 
                                    `${message.recipients[0].firstName} ${message.recipients[0].lastName}` : 'Member')}
                                </p>
                                {message.recipients.length > 1 && (
                                  <p className="text-gray-400 text-xs">
                                    +{message.recipients.length - 1} more
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-white text-sm">All Members</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getChannelBadge(message.channel || 'In-App')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white text-sm">
                              {message.deliveredCount || 0}/{message.totalRecipients || 0}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {message.totalRecipients ? Math.round(((message.deliveredCount || 0) / message.totalRecipients) * 100) : 0}% success
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(
                            message.sentStatus || 'Sent', 
                            message.deliveredCount || 0, 
                            message.totalRecipients || message.totalTargets || 0
                          )}
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                        No messages found. Create your first message by clicking the "Create New Message" button.
                      </TableCell>
                    </TableRow>
                  )}
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
      
      {/* Create Message Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold">Create New Message</DialogTitle>
            <DialogDescription className="text-gray-400">
              Send a message to all members or select specific members
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4 overflow-y-auto pr-2 custom-scrollbar">
            {/* Message Type and Template Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="messageType">Message Type</Label>
                <Select 
                  id="messageType"
                  name="messageType"
                  value={messageForm.type} 
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-white">
                    <SelectItem value="Birthday">Birthday</SelectItem>
                    <SelectItem value="Anniversary">Anniversary</SelectItem>
                    <SelectItem value="Offer">Offer</SelectItem>
                    <SelectItem value="Motivation">Motivation</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="template">Use Template</Label>
                <Select 
                  id="template"
                  name="template"
                  onValueChange={handleTemplateSelect}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a template (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-white">
                    {messageTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id.toString()}>
                        {template.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Message Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Message Title</Label>
              <Input
                id="title"
                placeholder="Enter message title"
                value={messageForm.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            {/* Message Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Message Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your message content here..."
                value={messageForm.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
              />
              <p className="text-xs text-gray-400">
                Use [NAME] to personalize the message with the member's name
              </p>
            </div>
            
            {/* Recipient Selection */}
            <div className="space-y-4">
              <Label htmlFor="recipientType">Send To</Label>
              <div className="flex flex-col space-y-2" id="recipientType">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="all-members"
                    value="all"
                    checked={messageForm.recipientType === "all"}
                    onChange={(e) => handleInputChange('recipientType', e.target.value)}
                    className="h-4 w-4 rounded-full border border-gray-500 bg-gray-700 text-blue-600"
                  />
                  <Label htmlFor="all-members" className="font-normal cursor-pointer">
                    All Members
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="specific-members"
                    value="specific"
                    checked={messageForm.recipientType === "specific"}
                    onChange={(e) => handleInputChange('recipientType', e.target.value)}
                    className="h-4 w-4 rounded-full border border-gray-500 bg-gray-700 text-blue-600"
                  />
                  <Label htmlFor="specific-members" className="font-normal cursor-pointer">
                    Select Specific Members
                  </Label>
                </div>
              </div>
              
              {/* Member Selection */}
              {messageForm.recipientType === "specific" && (
                <div className="mt-4">
                  <div className="flex items-center mb-2">
                    <Search className="h-4 w-4 text-gray-500 mr-2" />
                    <Input 
                      placeholder="Search members..." 
                      className="bg-gray-700 border-gray-600 text-white"
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="border border-gray-700 rounded-md p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                      
                      {members && members.length > 0 ? (
                        members
                          .filter(member => 
                            ((member.name || '')?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                            ((member.email || '')?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                          )
                          .map(member => (
                            <div key={member._id} className="flex items-center p-2 hover:bg-gray-700 rounded-md">
                              <input
                                type="checkbox"
                                id={`member-${member._id}`}
                                checked={messageForm.selectedMembers.includes(member._id)}
                                onChange={() => handleMemberSelect(member._id)}
                                className="mr-2 h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600"
                              />
                              <label htmlFor={`member-${member._id}`} className="text-sm cursor-pointer flex-1">
                                <div className="flex flex-col">
                                  <span className="font-medium">{member.name || 'Unknown Member'}</span>
                                  <span className="text-xs text-gray-400">{member.email || 'No email available'}</span>
                                </div>
                              </label>
                            </div>
                          ))
                      ) : (
                        <p className="text-gray-400">No members found. Please make sure you have added members to your gym.</p>
                      )}
                      
                      {members && members.length > 0 && 
                        members.filter(member => 
                          ((member.name || '')?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          ((member.email || '')?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                        ).length === 0 && (
                          <p className="text-gray-400">No members match your search</p>
                        )
                      }
                    </div>
                  </div>
                  
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      {messageForm.selectedMembers.length} member(s) selected
                    </span>
                    {messageForm.selectedMembers.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => setMessageForm(prev => ({ ...prev, selectedMembers: [] }))}
                      >
                        Clear selection
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Channel Selection */}
            <div className="space-y-2">
              <Label htmlFor="channel">Delivery Channel</Label>
              <Select 
                id="channel"
                name="channel"
                value={messageForm.channel} 
                onValueChange={(value) => handleInputChange('channel', value)}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600 text-white">
                  <SelectItem value="In-App">In-App</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="SMS">SMS</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Schedule Message Option */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="schedule-message"
                  checked={messageForm.isScheduled}
                  onChange={(e) => handleInputChange('isScheduled', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600"
                />
                <Label htmlFor="schedule-message" className="font-normal cursor-pointer flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  Schedule this message
                </Label>
              </div>
              
              {messageForm.isScheduled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-gray-700">
                  <div className="space-y-2">
                    <Label htmlFor="scheduleDate">Date (within next 7 days)</Label>
                    <Input
                      id="scheduleDate"
                      type="date"
                      value={messageForm.scheduleDate}
                      onChange={(e) => handleInputChange('scheduleDate', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                      min={new Date().toISOString().split('T')[0]}
                      max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-400">
                      You can only schedule messages up to 7 days in advance
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scheduleTime">Time</Label>
                    <Input
                      id="scheduleTime"
                      type="time"
                      value={messageForm.scheduleTime}
                      onChange={(e) => handleInputChange('scheduleTime', e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Success Message */}
          {messageForm.successMessage && (
            <div className="mb-4 p-4 bg-green-900/50 border border-green-700 rounded-md flex items-center">
              <div className="bg-green-500 rounded-full p-1 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-green-300 font-medium">{messageForm.successMessage}</span>
            </div>
          )}
          
          <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t border-gray-700">
            <Button 
              variant="outline" 
              onClick={handleDialogClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading || messageForm.successMessage !== ""}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Messages;