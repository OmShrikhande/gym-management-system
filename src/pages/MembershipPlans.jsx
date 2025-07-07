import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Package, Check, X, Star, DollarSign, Clock, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

const MembershipPlans = () => {
  const { user, authFetch, isGymOwner } = useAuth();
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration: 'monthly',
    features: '',
    description: '',
    isActive: true,
    isRecommended: false
  });

  // Redirect if not gym owner
  if (!isGymOwner) {
    return <Navigate to="/" replace />;
  }

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      duration: 'monthly',
      features: '',
      description: '',
      isActive: true,
      isRecommended: false
    });
    setEditingPlan(null);
  };

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authFetch('/gym-owner-plans');
      
      if (response.success || response.status === 'success') {
        setPlans(response.data?.plans || []);
      } else {
        toast.error('Failed to fetch membership plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error loading membership plans');
    } finally {
      setIsLoading(false);
    }
  }, [authFetch]);

  // Initialize with default plans if none exist
  const initializeDefaultPlans = useCallback(async () => {
    try {
      const response = await authFetch('/gym-owner-plans/default');
      
      if (response.success || response.status === 'success') {
        setPlans(response.data?.plans || []);
      }
    } catch (error) {
      console.error('Error initializing default plans:', error);
      toast.error('Error initializing default plans');
    }
  }, [authFetch]);

  // Load plans on component mount
  useEffect(() => {
    const loadPlans = async () => {
      await fetchPlans();
    };
    
    if (user && isGymOwner) {
      loadPlans();
    }
  }, [user, isGymOwner, fetchPlans]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle switch changes
  const handleSwitchChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open create dialog
  const handleCreatePlan = () => {
    resetForm();
    setShowPlanDialog(true);
  };

  // Open edit dialog
  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || '',
      price: plan.price?.toString() || '',
      duration: plan.duration || 'monthly',
      features: Array.isArray(plan.features) ? plan.features.join('\n') : plan.features || '',
      description: plan.description || '',
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      isRecommended: plan.isRecommended || false
    });
    setShowPlanDialog(true);
  };

  // Save plan (create or update)
  const handleSavePlan = async () => {
    // Validate form
    if (!formData.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Process features
      const featuresArray = formData.features
        .split('\n')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);

      const planData = {
        name: formData.name.trim(),
        price: parseFloat(formData.price),
        duration: formData.duration,
        features: featuresArray,
        description: formData.description.trim(),
        isActive: formData.isActive,
        isRecommended: formData.isRecommended
      };

      let response;
      if (editingPlan) {
        // Update existing plan
        response = await authFetch(`/gym-owner-plans/${editingPlan._id}`, {
          method: 'PATCH',
          body: JSON.stringify(planData)
        });
      } else {
        // Create new plan
        response = await authFetch('/gym-owner-plans', {
          method: 'POST',
          body: JSON.stringify(planData)
        });
      }

      if (response.success || response.status === 'success') {
        toast.success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
        setShowPlanDialog(false);
        resetForm();
        await fetchPlans();
      } else {
        toast.error(response.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error saving plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete plan
  const handleDeletePlan = (plan) => {
    setPlanToDelete(plan);
    setShowDeleteDialog(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      const response = await authFetch(`/gym-owner-plans/${planToDelete._id}`, {
        method: 'DELETE'
      });

      if (response.success || response.status === 'success' || response.status === 204) {
        toast.success('Plan deleted successfully');
        await fetchPlans();
      } else {
        toast.error('Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Error deleting plan');
    } finally {
      setShowDeleteDialog(false);
      setPlanToDelete(null);
    }
  };

  // Get duration display text
  const getDurationText = (duration) => {
    switch (duration) {
      case 'monthly': return 'Monthly';
      case 'quarterly': return 'Quarterly';
      case 'yearly': return 'Yearly';
      default: return 'Monthly';
    }
  };

  // Get plan status
  const getPlanStatus = (plan) => {
    if (!plan.isActive) return { text: 'Inactive', variant: 'secondary' };
    if (plan.isRecommended) return { text: 'Recommended', variant: 'default' };
    return { text: 'Active', variant: 'success' };
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg">Loading membership plans...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Membership Plans</h1>
            <p className="text-gray-600">Manage your gym's membership plans and pricing</p>
          </div>
          <Button onClick={handleCreatePlan} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Plan
          </Button>
        </div>

        {/* Plans Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Plans</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.filter(p => p.isActive).length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recommended</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{plans.filter(p => p.isRecommended).length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{plans.length > 0 ? Math.round(plans.reduce((sum, p) => sum + p.price, 0) / plans.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Membership Plans</CardTitle>
            <CardDescription>
              {plans.length === 0 ? 'No plans created yet. Create your first membership plan to get started.' : 
               `Manage your ${plans.length} membership plan${plans.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No membership plans</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first membership plan.</p>
                <div className="mt-6 space-y-2">
                  <Button onClick={handleCreatePlan} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create Plan
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={initializeDefaultPlans}
                    className="flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Create Default Plans
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => {
                    const status = getPlanStatus(plan);
                    return (
                      <TableRow key={plan._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{plan.name}</span>
                            {plan.isRecommended && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          </div>
                          {plan.description && (
                            <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-lg font-semibold">₹{plan.price}</span>
                            <span className="text-sm text-gray-500">/{plan.duration}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getDurationText(plan.duration)}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {plan.features?.slice(0, 3).map((feature, index) => (
                              <div key={index} className="text-sm text-gray-600">• {feature}</div>
                            ))}
                            {plan.features?.length > 3 && (
                              <div className="text-sm text-gray-500">+{plan.features.length - 3} more</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.text}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeletePlan(plan)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Create/Edit Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan ? 'Update your membership plan details' : 'Create a new membership plan for your gym'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Premium Membership"
                />
              </div>
              <div>
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="1000"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration</Label>
              <Select value={formData.duration} onValueChange={(value) => handleSelectChange('duration', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly (3 months)</SelectItem>
                  <SelectItem value="yearly">Yearly (12 months)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of this plan"
              />
            </div>

            <div>
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                name="features"
                value={formData.features}
                onChange={handleInputChange}
                placeholder="Full gym access&#10;Personal training sessions&#10;Nutrition consultation&#10;Locker facility"
                rows={6}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleSwitchChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isRecommended"
                  checked={formData.isRecommended}
                  onCheckedChange={(checked) => handleSwitchChange('isRecommended', checked)}
                />
                <Label htmlFor="isRecommended">Recommended</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Membership Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{planToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MembershipPlans;