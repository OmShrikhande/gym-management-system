import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import DashboardLayout from "@/components/layout/DashboardLayout";

const Enquiries = () => {
  const { authFetch } = useAuth();
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEnquiry, setEditingEnquiry] = useState(null);
  const [viewingEnquiry, setViewingEnquiry] = useState(null);
  const [stats, setStats] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    purpose: "",
    description: "",
    dateTime: "",
    priority: "medium",
    followUpDate: "",
    notes: ""
  });

  const purposeOptions = [
    { value: "membership-inquiry", label: "Membership Inquiry" },
    { value: "personal-training", label: "Personal Training" },
    { value: "group-classes", label: "Group Classes" },
    { value: "diet-consultation", label: "Diet Consultation" },
    { value: "facility-tour", label: "Facility Tour" },
    { value: "pricing-information", label: "Pricing Information" },
    { value: "general-inquiry", label: "General Inquiry" },
    { value: "complaint", label: "Complaint" },
    { value: "feedback", label: "Feedback" },
    { value: "other", label: "Other" }
  ];

  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-500" },
    { value: "contacted", label: "Contacted", color: "bg-blue-500" },
    { value: "resolved", label: "Resolved", color: "bg-green-500" },
    { value: "closed", label: "Closed", color: "bg-gray-500" }
  ];

  const priorityOptions = [
    { value: "low", label: "Low", color: "bg-green-500" },
    { value: "medium", label: "Medium", color: "bg-yellow-500" },
    { value: "high", label: "High", color: "bg-orange-500" },
    { value: "urgent", label: "Urgent", color: "bg-red-500" }
  ];

  useEffect(() => {
    loadEnquiries();
    loadStats();
  }, []);

  useEffect(() => {
    filterEnquiries();
  }, [enquiries, searchTerm, statusFilter, priorityFilter]);

  const loadEnquiries = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/enquiries');
      if (response.success || response.status === 'success') {
        setEnquiries(response.data?.enquiries || []);
      } else {
        toast.error('Failed to load enquiries');
      }
    } catch (error) {
      console.error('Error loading enquiries:', error);
      toast.error('Failed to load enquiries');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authFetch('/enquiries/stats');
      if (response.success || response.status === 'success') {
        setStats(response.data || {});
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterEnquiries = () => {
    let filtered = enquiries;

    if (searchTerm) {
      filtered = filtered.filter(enquiry =>
        enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.phoneNumber.includes(searchTerm) ||
        enquiry.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(enquiry => enquiry.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(enquiry => enquiry.priority === priorityFilter);
    }

    setFilteredEnquiries(filtered);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      phoneNumber: "",
      email: "",
      purpose: "",
      description: "",
      dateTime: "",
      priority: "medium",
      followUpDate: "",
      notes: ""
    });
    setEditingEnquiry(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingEnquiry ? `/enquiries/${editingEnquiry._id}` : '/enquiries';
      const method = editingEnquiry ? 'PATCH' : 'POST';

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (response.success || response.status === 'success') {
        toast.success(editingEnquiry ? 'Enquiry updated successfully!' : 'Enquiry created successfully!');
        setIsDialogOpen(false);
        resetForm();
        loadEnquiries();
        loadStats();
      } else {
        toast.error(response.message || 'Failed to save enquiry');
      }
    } catch (error) {
      console.error('Error saving enquiry:', error);
      toast.error('Failed to save enquiry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (enquiry) => {
    setEditingEnquiry(enquiry);
    setFormData({
      name: enquiry.name,
      phoneNumber: enquiry.phoneNumber,
      email: enquiry.email || "",
      purpose: enquiry.purpose,
      description: enquiry.description,
      dateTime: enquiry.dateTime ? format(new Date(enquiry.dateTime), "yyyy-MM-dd'T'HH:mm") : "",
      priority: enquiry.priority,
      followUpDate: enquiry.followUpDate ? format(new Date(enquiry.followUpDate), "yyyy-MM-dd") : "",
      notes: enquiry.notes || ""
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (enquiryId) => {
    if (!confirm('Are you sure you want to delete this enquiry?')) return;

    try {
      const response = await authFetch(`/enquiries/${enquiryId}`, {
        method: 'DELETE'
      });

      if (response.success || response.status === 'success') {
        toast.success('Enquiry deleted successfully!');
        loadEnquiries();
        loadStats();
      } else {
        toast.error('Failed to delete enquiry');
      }
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      toast.error('Failed to delete enquiry');
    }
  };

  const handleStatusUpdate = async (enquiryId, newStatus) => {
    try {
      const response = await authFetch(`/enquiries/${enquiryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.success || response.status === 'success') {
        toast.success('Status updated successfully!');
        loadEnquiries();
        loadStats();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'contacted': return <Phone className="h-4 w-4" />;
      case 'resolved': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <AlertCircle className="h-4 w-4 text-green-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Enquiries</h1>
            <p className="text-gray-400">Manage customer enquiries and follow-ups</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Enquiry
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingEnquiry ? 'Edit Enquiry' : 'Create New Enquiry'}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  {editingEnquiry ? 'Update enquiry details' : 'Add a new customer enquiry'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber" className="text-white">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purpose" className="text-white">Purpose *</Label>
                    <Select value={formData.purpose} onValueChange={(value) => handleSelectChange('purpose', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {purposeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-white">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority" className="text-white">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-white">
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-white">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateTime" className="text-white">Date & Time</Label>
                    <Input
                      id="dateTime"
                      name="dateTime"
                      type="datetime-local"
                      value={formData.dateTime}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="followUpDate" className="text-white">Follow-up Date</Label>
                    <Input
                      id="followUpDate"
                      name="followUpDate"
                      type="date"
                      value={formData.followUpDate}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes" className="text-white">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={2}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {editingEnquiry ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingEnquiry ? 'Update Enquiry' : 'Create Enquiry'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Enquiries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalEnquiries || 0}</div>
            </CardContent>
          </Card>
          {statusOptions.map((status) => {
            const count = stats.statusStats?.find(s => s._id === status.value)?.count || 0;
            return (
              <Card key={status.value} className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
                    {getStatusIcon(status.value)}
                    <span className="ml-2">{status.label}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{count}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search enquiries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all" className="text-white">All Status</SelectItem>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40 bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all" className="text-white">All Priority</SelectItem>
                    {priorityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-white">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enquiries List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-400">Loading enquiries...</span>
              </div>
            ) : filteredEnquiries.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No enquiries found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEnquiries.map((enquiry) => (
                  <div key={enquiry._id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{enquiry.name}</h3>
                          <Badge className={`${statusOptions.find(s => s.value === enquiry.status)?.color} text-white`}>
                            {statusOptions.find(s => s.value === enquiry.status)?.label}
                          </Badge>
                          <div className="flex items-center">
                            {getPriorityIcon(enquiry.priority)}
                            <span className="ml-1 text-sm text-gray-400 capitalize">{enquiry.priority}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {enquiry.phoneNumber}
                          </div>
                          {enquiry.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {enquiry.email}
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {format(new Date(enquiry.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </div>
                        <p className="text-gray-300 mb-2">
                          <span className="font-medium">Purpose:</span> {purposeOptions.find(p => p.value === enquiry.purpose)?.label}
                        </p>
                        <p className="text-gray-300">{enquiry.description}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Select value={enquiry.status} onValueChange={(value) => handleStatusUpdate(enquiry._id, value)}>
                          <SelectTrigger className="w-32 bg-gray-600 border-gray-500 text-white text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {statusOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value} className="text-white">
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingEnquiry(enquiry)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(enquiry)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(enquiry._id)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* View Enquiry Dialog */}
        <Dialog open={!!viewingEnquiry} onOpenChange={() => setViewingEnquiry(null)}>
          <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Enquiry Details</DialogTitle>
            </DialogHeader>
            {viewingEnquiry && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Name</Label>
                    <p className="text-white">{viewingEnquiry.name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Phone</Label>
                    <p className="text-white">{viewingEnquiry.phoneNumber}</p>
                  </div>
                </div>
                {viewingEnquiry.email && (
                  <div>
                    <Label className="text-gray-400">Email</Label>
                    <p className="text-white">{viewingEnquiry.email}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Purpose</Label>
                    <p className="text-white">{purposeOptions.find(p => p.value === viewingEnquiry.purpose)?.label}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Priority</Label>
                    <div className="flex items-center">
                      {getPriorityIcon(viewingEnquiry.priority)}
                      <span className="ml-2 text-white capitalize">{viewingEnquiry.priority}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-400">Description</Label>
                  <p className="text-white">{viewingEnquiry.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Created At</Label>
                    <p className="text-white">{format(new Date(viewingEnquiry.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Status</Label>
                    <Badge className={`${statusOptions.find(s => s.value === viewingEnquiry.status)?.color} text-white`}>
                      {statusOptions.find(s => s.value === viewingEnquiry.status)?.label}
                    </Badge>
                  </div>
                </div>
                {viewingEnquiry.followUpDate && (
                  <div>
                    <Label className="text-gray-400">Follow-up Date</Label>
                    <p className="text-white">{format(new Date(viewingEnquiry.followUpDate), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                {viewingEnquiry.notes && (
                  <div>
                    <Label className="text-gray-400">Notes</Label>
                    <p className="text-white">{viewingEnquiry.notes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewingEnquiry(null)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Enquiries;