import DashboardLayout from "@/components/layout/DashboardLayout";
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Edit, Trash2, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UserManagementPage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-gray-400">Manage users with role-based hierarchy</p>
        </div>
        
        {/* User Management Component */}
        <UserManagement />
      </div>
    </DashboardLayout>
  );
};

function UserManagement() {
  const { 
    user, 
    users, 
    fetchUsers, 
    createGymOwner, 
    createTrainer, 
    createMember,
    isSuperAdmin,
    isGymOwner,
    authFetch
  } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: '',
    address: '',
    totalMembers: '',
    gymName: '',
    // New fields for subscription
    subscriptionPlan: '',
    paymentMethod: 'credit_card'
  });
  
  // State for subscription plans
  const [plans, setPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  
  // Fetch subscription plans from API
  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const response = await authFetch('/subscription-plans');
        
        if (response.success || response.status === 'success') {
          setPlans(response.data.plans);
        } else {
          // If API fails, use default plans
          setPlans([
            {
              _id: "basic",
              name: "Basic",
              price: 49,
              duration: "monthly",
              maxMembers: 200,
              maxTrainers: 5,
              features: ["Member Management", "Basic Reports", "Email Support"],
              status: "Active"
            },
            {
              _id: "premium",
              name: "Premium",
              price: 99,
              duration: "monthly",
              maxMembers: 500,
              maxTrainers: 15,
              features: ["All Basic Features", "Advanced Reports", "SMS Integration", "Priority Support"],
              status: "Active",
              recommended: true
            },
            {
              _id: "enterprise",
              name: "Enterprise",
              price: 199,
              duration: "monthly",
              maxMembers: 1000,
              maxTrainers: 50,
              features: ["All Premium Features", "Custom Branding", "API Access", "Dedicated Support"],
              status: "Active"
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        // Use default plans if API fails
        setPlans([
          {
            _id: "basic",
            name: "Basic",
            price: 49,
            duration: "monthly",
            maxMembers: 200,
            maxTrainers: 5,
            features: ["Member Management", "Basic Reports", "Email Support"],
            status: "Active"
          },
          {
            _id: "premium",
            name: "Premium",
            price: 99,
            duration: "monthly",
            maxMembers: 500,
            maxTrainers: 15,
            features: ["All Basic Features", "Advanced Reports", "SMS Integration", "Priority Support"],
            status: "Active",
            recommended: true
          },
          {
            _id: "enterprise",
            name: "Enterprise",
            price: 199,
            duration: "monthly",
            maxMembers: 1000,
            maxTrainers: 50,
            features: ["All Premium Features", "Custom Branding", "API Access", "Dedicated Support"],
            status: "Active"
          }
        ]);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    
    fetchSubscriptionPlans();
  }, [authFetch]);
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  
  // CRUD operation states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    whatsapp: '',
    address: '',
    gymName: ''
  });
  
  // Add dialogs to the component
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Handle edit user
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't set password for security
      phone: user.phone || '',
      whatsapp: user.whatsapp || '',
      address: user.address || '',
      gymName: user.gymName || ''
    });
    setShowEditDialog(true);
  };
  
  // Handle delete user
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };
  
  // Update user
  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    setMessage({ type: 'info', text: 'Updating user...' });
    
    try {
      const API_URL = 'http://localhost:8081/api';
      const updateData = { ...editFormData };
      
      // Only include password if it was changed
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const response = await authFetch(`${API_URL}/users/${selectedUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      
      toast.success('User updated successfully');
      setShowEditDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update user' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    setIsLoading(true);
    setMessage({ type: 'info', text: 'Deleting user...' });
    
    try {
      const API_URL = 'http://localhost:8081/api';
      const response = await authFetch(`${API_URL}/users/${selectedUser._id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }
      
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete user' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      whatsapp: '',
      address: '',
      totalMembers: '',
      gymName: '',
      subscriptionPlan: '',
      paymentMethod: 'credit_card'
    });
    setMessage({ type: '', text: '' });
    setShowPaymentSection(false);
    setQrCodeUrl(null);
  };
  
  // Function to validate and prepare for gym owner creation
  const handlePrepareGymOwnerCreation = () => {
    // Validate basic form data
    if (!formData.name || !formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Name, email, and password are required' });
      return false;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return false;
    }
    
    // Additional validation for gym owner
    if (!formData.phone) {
      setMessage({ type: 'error', text: 'Phone number is required for gym owners' });
      return false;
    }
    
    if (!formData.address) {
      setMessage({ type: 'error', text: 'Gym address is required' });
      return false;
    }
    
    if (!formData.subscriptionPlan) {
      setMessage({ type: 'error', text: 'Please select a subscription plan' });
      return false;
    }
    
    // Show payment section
    setShowPaymentSection(true);
    
    // For QR code payment, we'll generate the QR when the user clicks the payment button
    // For other payment methods, show a message
    setMessage({ type: 'info', text: 'Please complete payment to create the gym owner account' });
    
    // Scroll to payment section
    document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
    
    return true;
  };
  
  // Function to initialize Razorpay payment
  const initializeRazorpayPayment = async () => {
    setIsProcessingPayment(true);
    setMessage({ type: 'info', text: 'Initializing payment...' });
    
    try {
      // Get the selected plan details
      const selectedPlan = plans.find(p => (p._id || p.id) === formData.subscriptionPlan);
      
      if (!selectedPlan) {
        setMessage({ type: 'error', text: 'Invalid subscription plan selected' });
        setIsProcessingPayment(false);
        return;
      }
      
      // Create a Razorpay order
      const orderResponse = await authFetch(`/payments/razorpay/create-order`, {
        method: 'POST',
        body: JSON.stringify({
          amount: selectedPlan.price,
          currency: 'INR',
          receipt: `gymowner_${Date.now()}`,
          notes: {
            planId: selectedPlan.id,
            planName: selectedPlan.name
          },
          planId: selectedPlan.id,
          userFormData: formData
        })
      });
      
      if (!orderResponse.success && !orderResponse.status === 'success') {
        setMessage({ type: 'error', text: orderResponse.message || 'Failed to create payment order' });
        setIsProcessingPayment(false);
        return;
      }
      
      const order = orderResponse.data.order;
      
      // If QR code payment is selected, generate QR code
      if (formData.paymentMethod === 'qr_scanner') {
        try {
          // Generate QR code for the order
          // In a real implementation with full Razorpay integration, you would use their QR API
          // For now, we'll use a generic QR code with the order ID embedded
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=razorpay@okicici&pn=GymFlow&am=${selectedPlan.price}&cu=INR&tn=GymOwnerSubscription&tr=${order.id}`;
          setQrCodeUrl(qrUrl);
          
          setMessage({ 
            type: 'info', 
            text: 'Scan the QR code to complete payment. The gym owner account will be created after payment confirmation.' 
          });
          
          // Store the order ID and form data for later verification
          sessionStorage.setItem('pendingOrderId', order.id);
          sessionStorage.setItem('pendingGymOwnerData', JSON.stringify({
            formData: formData,
            planId: selectedPlan.id
          }));
          
          console.log('Stored pending gym owner data:', {
            formData: formData,
            planId: selectedPlan.id
          });
          
        } catch (error) {
          console.error('Error generating QR code:', error);
          setMessage({ type: 'error', text: 'Failed to generate QR code for payment' });
        }
        
        setIsProcessingPayment(false);
        return;
      }
      
      // For other payment methods, open Razorpay checkout
      const options = {
        key: "rzp_test_VUpggvAt3u75cZ", // Your Razorpay Test Key ID
        amount: order.amount,
        currency: order.currency,
        name: "GymFlow",
        description: `${selectedPlan.name} Plan Subscription`,
        order_id: order.id,
        handler: function(response) {
          // Handle successful payment
          verifyPaymentAndCreateGymOwner(response);
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        notes: {
          planId: selectedPlan.id,
          planName: selectedPlan.name
        },
        theme: {
          color: "#3399cc"
        },
        modal: {
          ondismiss: function() {
            setIsProcessingPayment(false);
            setMessage({ type: 'warning', text: 'Payment cancelled. Gym owner account was not created.' });
          }
        }
      };
      
      // Load the Razorpay script and open the checkout
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            resolve(true);
          };
          script.onerror = () => {
            resolve(false);
            setMessage({ type: 'error', text: 'Failed to load Razorpay checkout. Please try again.' });
            setIsProcessingPayment(false);
          };
          document.body.appendChild(script);
        });
      };
      
      const openRazorpayCheckout = async () => {
        const res = await loadRazorpayScript();
        
        if (!res) {
          setMessage({ type: 'error', text: 'Razorpay SDK failed to load. Please check your internet connection.' });
          setIsProcessingPayment(false);
          return;
        }
        
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        
        // Handle payment failures
        paymentObject.on('payment.failed', function(response) {
          setMessage({ 
            type: 'error', 
            text: `Payment failed: ${response.error.description}` 
          });
          setIsProcessingPayment(false);
        });
      };
      
      openRazorpayCheckout();
      
    } catch (error) {
      console.error('Error initializing payment:', error);
      setMessage({ type: 'error', text: 'An error occurred while initializing payment' });
      setIsProcessingPayment(false);
    }
  };
  
  // Function to verify payment and create gym owner
  const verifyPaymentAndCreateGymOwner = async (paymentResponse) => {
    try {
      setMessage({ type: 'info', text: 'Verifying payment and creating account...' });
      
      // Get the stored gym owner data
      const pendingGymOwnerDataStr = sessionStorage.getItem('pendingGymOwnerData');
      if (!pendingGymOwnerDataStr) {
        setMessage({ type: 'error', text: 'No pending gym owner data found. Please try again.' });
        setIsProcessingPayment(false);
        return;
      }
      
      const pendingGymOwnerData = JSON.parse(pendingGymOwnerDataStr);
      console.log('Retrieved pending gym owner data:', pendingGymOwnerData);
      
      const requestBody = {
        ...paymentResponse,
        gymOwnerData: pendingGymOwnerData
      };
      
      console.log('Sending payment verification request:', requestBody);
      
      const verifyResponse = await authFetch(`/payments/razorpay/verify`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      if (!verifyResponse.success && !verifyResponse.status === 'success') {
        setMessage({ type: 'error', text: verifyResponse.message || 'Payment verification failed' });
        setIsProcessingPayment(false);
        return;
      }
      
      // Show success message
      toast.success('Payment successful! Gym owner account created.');
      setMessage({ 
        type: 'success', 
        text: `Gym owner created successfully with ${verifyResponse.data.subscription.plan} subscription plan.` 
      });
      
      // Clear session storage
      sessionStorage.removeItem('pendingOrderId');
      sessionStorage.removeItem('pendingGymOwnerData');
      
      // Reset form
      resetForm();
      
      // Refresh user list
      fetchUsers();
      
    } catch (error) {
      console.error('Error verifying payment:', error);
      setMessage({ type: 'error', text: 'An error occurred during payment verification' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCreateUser = async (userType) => {
    // For gym owners, we now use a different flow with subscription and payment
    if (userType === 'gym-owner') {
      return handlePrepareGymOwnerCreation();
    }
    
    // Validate basic form data
    if (!formData.name || !formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Name, email, and password are required' });
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    // Additional validation for member
    if (userType === 'member') {
      if (!formData.phone) {
        setMessage({ type: 'error', text: 'Phone number is required for members' });
        return;
      }
    }
    
    // Set loading state
    setIsLoading(true);
    setMessage({ type: 'info', text: `Creating ${userType}...` });
    
    try {
      let result;
      
      // Call the appropriate creation function based on user type
      switch (userType) {
        case 'trainer':
          result = await createTrainer(formData);
          break;
        case 'member':
          result = await createMember(formData);
          break;
        default:
          setMessage({ type: 'error', text: 'Invalid user type' });
          setIsLoading(false);
          return;
      }
      
      // Handle the result
      if (result.success) {
        // If creating a member as a gym owner, show count in success message
        if (userType === 'member' && isGymOwner) {
          fetchUsers().then(updatedUsers => {
            const memberCount = updatedUsers.filter(u => u.role === 'member').length;
            setMessage({ 
              type: 'success', 
              text: `${result.message} You now have ${memberCount} member${memberCount !== 1 ? 's' : ''}.` 
            });
          });
        } else {
          setMessage({ type: 'success', text: result.message });
        }
        resetForm();
      } else {
        setMessage({ type: 'error', text: result.message });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating the user' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter users based on current user's role
  const filteredUsers = users.filter(u => {
    if (isSuperAdmin) {
      return true; // Super admin can see all users
    } else if (isGymOwner) {
      // In the member directory view, gym owners should only see members
      return u.role === 'member';
    }
    return false;
  });
  
  // For gym owners, also filter trainers separately
  const trainers = isGymOwner ? users.filter(u => u.role === 'trainer') : [];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>
          {isSuperAdmin 
            ? 'View all users and create gym owners' 
            : isGymOwner 
              ? 'View your members in the directory and create new trainers or members' 
              : 'View users'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* User Directory - Visible to Super Admin */}
        {isSuperAdmin && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">User Directory</h3>
            
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(user => (
                  <div 
                    key={user._id} 
                    className={`p-4 border rounded bg-gray-800/30 hover:bg-gray-800/50 transition-colors ${
                      user.role === 'gym-owner' ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (user.role === 'gym-owner') {
                        navigate(`/gym-owner/${user._id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <p className="text-gray-400">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'super-admin' 
                            ? 'bg-red-100 text-red-800' 
                            : user.role === 'gym-owner'
                              ? 'bg-green-100 text-green-800'
                              : user.role === 'trainer'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                        
                        {/* Only show actions for gym owners */}
                        {user.role === 'gym-owner' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                              <DropdownMenuItem 
                                className="text-blue-400 hover:text-blue-300 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(user);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-400 hover:text-red-300 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(user);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-400">
                      <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                      {user.createdBy && <p>Created by: Admin</p>}
                    </div>
                    
                    {user.role === 'gym-owner' && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full text-blue-400 border-blue-800 hover:bg-blue-900/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/gym-owner/${user._id}`);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-800/30 rounded border border-gray-700">
                <p className="text-gray-400">No users found. Create your first user using the form below.</p>
              </div>
            )}
          </div>
        )}
        
        {/* Trainer Directory - Only visible to Gym Owner */}
        {isGymOwner && trainers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Trainer Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trainers.map(trainer => (
                <div key={trainer._id} className="p-4 border rounded bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{trainer.name}</h3>
                      <p className="text-gray-400">{trainer.email}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {trainer.role}
                    </span>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-400">
                    <p>Created: {new Date(trainer.createdAt).toLocaleDateString()}</p>
                    {trainer.createdBy && <p>Created by: You</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Member Directory - Only visible to Gym Owner */}
        {isGymOwner && (
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4">Member Directory</h3>
            
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(member => (
                  <div key={member._id} className="p-4 border rounded bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{member.name}</h3>
                        <p className="text-gray-400">{member.email}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {member.role}
                      </span>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-400">
                      <p>Created: {new Date(member.createdAt).toLocaleDateString()}</p>
                      {member.createdBy && <p>Created by: You</p>}
                      {member.phone && <p>Phone: {member.phone}</p>}
                      {member.whatsapp && <p>WhatsApp: {member.whatsapp}</p>}
                      {member.address && <p>Address: {member.address}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-800/30 rounded border border-gray-700">
                <p className="text-gray-400">No members found. Create your first member using the form below.</p>
              </div>
            )}
          </div>
        )}

        {/* User creation form with enhanced UI */}
        {(isSuperAdmin || isGymOwner) && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-2xl font-semibold mb-6 text-white">
              {isSuperAdmin 
                ? 'Create New Gym Owner' 
                : 'Create New Trainer or Member'}
            </h3>
            <form className="space-y-6">
              <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                {/* Basic user information */}
                <h4 className="text-lg font-semibold mb-4 text-white">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <Label htmlFor="name" className="mb-2 block text-gray-300">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2 block text-gray-300">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter email address"
                      className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="mb-2 block text-gray-300">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter password (min 6 characters)"
                      className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Additional fields for gym owner or member */}
              {(isSuperAdmin || isGymOwner) && (
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">
                    {isSuperAdmin ? "Gym Information" : "Additional Information"}
                  </h4>
                  
                  {/* Gym Owner specific fields - only shown to Super Admin */}
                  {isSuperAdmin && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                          <Label htmlFor="gymName" className="mb-2 block text-gray-300">Gym Name</Label>
                          <Input
                            id="gymName"
                            name="gymName"
                            value={formData.gymName}
                            onChange={handleInputChange}
                            placeholder="Enter gym name"
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <Label htmlFor="totalMembers" className="mb-2 block text-gray-300">Total Members</Label>
                          <Input
                            id="totalMembers"
                            name="totalMembers"
                            type="number"
                            value={formData.totalMembers}
                            onChange={handleInputChange}
                            placeholder="Enter total members"
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      
                      {/* Subscription Plan Selection */}
                      <div className="mb-5">
                        <Label className="mb-2 block text-gray-300">Subscription Plan</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                          {isLoadingPlans ? (
                            <div className="col-span-3 flex justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                          ) : (
                            plans.filter(plan => plan.status === 'Active').map((plan) => (
                              <div 
                                key={plan._id || plan.id}
                                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                  formData.subscriptionPlan === (plan._id || plan.id)
                                    ? 'bg-blue-900/30 border-blue-500' 
                                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, subscriptionPlan: plan._id || plan.id }))}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-bold text-white">{plan.name}</h3>
                                    <p className="text-gray-400">
                                      <span className="text-lg font-bold text-white">₹{plan.price}</span>/month
                                    </p>
                                  </div>
                                  {plan.recommended && (
                                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-300">
                                  <p>Max Members: {plan.maxMembers}</p>
                                  <p>Max Trainers: {plan.maxTrainers}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {/* Contact information - shown to both Super Admin and Gym Owner */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <Label htmlFor="phone" className="mb-2 block text-gray-300">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp" className="mb-2 block text-gray-300">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="Enter WhatsApp number"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="mb-2 block text-gray-300">
                        {isSuperAdmin ? "Gym Address" : "Member Address"}
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder={isSuperAdmin ? "Enter gym address" : "Enter member address"}
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Payment Section for Gym Owner Creation */}
              {isSuperAdmin && showPaymentSection && (
                <div id="payment-section" className="mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Complete Payment</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Order Summary</h4>
                      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                        {formData.subscriptionPlan && (
                          <>
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-300">Plan:</span>
                              <span className="text-white font-medium">
                                {plans.find(p => (p._id || p.id) === formData.subscriptionPlan)?.name}
                              </span>
                            </div>
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-300">Duration:</span>
                              <span className="text-white font-medium">1 Month</span>
                            </div>
                            <div className="flex justify-between mb-2">
                              <span className="text-gray-300">Price:</span>
                              <span className="text-white font-medium">
                                ${plans.find(p => p.id === formData.subscriptionPlan)?.price}
                              </span>
                            </div>
                            <div className="border-t border-gray-600 my-2 pt-2">
                              <div className="flex justify-between">
                                <span className="text-gray-300">Total:</span>
                                <span className="text-white font-bold">
                                  ${plans.find(p => p.id === formData.subscriptionPlan)?.price}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-lg font-medium text-white mb-2">Payment Method</h4>
                      <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="block text-gray-300 mb-2">Select Payment Method</Label>
                            <div className="grid grid-cols-1 gap-3">
                              <div 
                                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                                  formData.paymentMethod === 'credit_card' 
                                    ? 'bg-blue-900/30 border border-blue-500' 
                                    : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'credit_card' }))}
                              >
                                <div className="h-5 w-5 rounded-full border border-gray-400 flex items-center justify-center mr-3">
                                  {formData.paymentMethod === 'credit_card' && (
                                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                  )}
                                </div>
                                <span className="text-white">Credit/Debit Card</span>
                              </div>
                              
                              <div 
                                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                                  formData.paymentMethod === 'netbanking' 
                                    ? 'bg-blue-900/30 border border-blue-500' 
                                    : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'netbanking' }))}
                              >
                                <div className="h-5 w-5 rounded-full border border-gray-400 flex items-center justify-center mr-3">
                                  {formData.paymentMethod === 'netbanking' && (
                                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                  )}
                                </div>
                                <span className="text-white">Net Banking</span>
                              </div>
                              
                              <div 
                                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                                  formData.paymentMethod === 'qr_scanner' 
                                    ? 'bg-blue-900/30 border border-blue-500' 
                                    : 'bg-gray-800 border border-gray-700 hover:bg-gray-700'
                                }`}
                                onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'qr_scanner' }))}
                              >
                                <div className="h-5 w-5 rounded-full border border-gray-400 flex items-center justify-center mr-3">
                                  {formData.paymentMethod === 'qr_scanner' && (
                                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                  )}
                                </div>
                                <span className="text-white">QR Code / Scanner</span>
                              </div>
                            </div>
                          </div>
                          
                          {formData.paymentMethod === 'credit_card' && (
                            <div className="mt-4">
                              <div className="mb-4 bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-6 -mt-6"></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full -ml-6 -mb-6"></div>
                                
                                <div className="flex justify-between items-start mb-6">
                                  <div className="text-xs text-gray-300">Credit/Debit Card</div>
                                  <div className="flex space-x-1">
                                    <div className="w-8 h-5 bg-yellow-500 rounded"></div>
                                    <div className="w-8 h-5 bg-red-500 rounded-full"></div>
                                  </div>
                                </div>
                                
                                <div className="mb-6">
                                  <div className="text-xs text-gray-300 mb-1">Card Number</div>
                                  <div className="text-white tracking-widest">4242 4242 4242 4242</div>
                                </div>
                                
                                <div className="flex justify-between">
                                  <div>
                                    <div className="text-xs text-gray-300 mb-1">Card Holder</div>
                                    <div className="text-white">{user?.name || "John Doe"}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-300 mb-1">Expires</div>
                                    <div className="text-white">12/25</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-300 mb-1">CVC</div>
                                    <div className="text-white">***</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {formData.paymentMethod === 'netbanking' && (
                            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mt-4">
                              <h4 className="text-white text-sm font-medium mb-3">Select Your Bank</h4>
                              <div className="grid grid-cols-2 gap-3">
                                {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank', 'Yes Bank'].map((bank) => (
                                  <div 
                                    key={bank}
                                    className="flex items-center p-3 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors"
                                    onClick={() => {
                                      // In a real implementation, this would be handled by Razorpay
                                      toast.info(`${bank} selected for payment`);
                                    }}
                                  >
                                    <div className="w-4 h-4 bg-blue-500/20 rounded-full mr-2 flex items-center justify-center">
                                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    </div>
                                    <span className="text-white text-sm">{bank}</span>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-3 text-center">
                                You will be redirected to your bank's website to complete the payment
                              </p>
                            </div>
                          )}
                          
                          {formData.paymentMethod === 'qr_scanner' && (
                            <div className="flex justify-center p-4 bg-white rounded-lg">
                              <div className="text-center">
                                {qrCodeUrl ? (
                                  <>
                                    <div className="border-4 border-blue-500 inline-block p-2 rounded-lg">
                                      <img 
                                        src={qrCodeUrl} 
                                        alt="Payment QR Code" 
                                        className="w-48 h-48"
                                      />
                                    </div>
                                    <p className="mt-2 text-gray-800 text-sm font-medium">Scan this QR code to complete payment</p>
                                    <p className="text-gray-600 text-xs mt-1">
                                      Amount: ₹{plans.find(p => p.id === formData.subscriptionPlan)?.price || 0}
                                    </p>
                                    <div className="mt-3 flex justify-center">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="text-xs border-gray-300 text-gray-700"
                                        disabled={isProcessingPayment}
                                        onClick={() => {
                                          // Get the pending order ID from session storage
                                          const orderId = sessionStorage.getItem('pendingOrderId');
                                          
                                          if (!orderId) {
                                            toast.error('No pending payment found');
                                            return;
                                          }
                                          
                                          // Simulate payment verification after QR scan
                                          setIsProcessingPayment(true);
                                          setMessage({ type: 'info', text: 'Verifying payment and creating account...' });
                                          
                                          // In a real implementation, Razorpay would notify your backend via webhook
                                          // For testing, we'll simulate a successful payment
                                          setTimeout(() => {
                                            const mockResponse = {
                                              razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 15)}`,
                                              razorpay_order_id: orderId,
                                              razorpay_signature: `${Math.random().toString(36).substring(2, 15)}`
                                            };
                                            verifyPaymentAndCreateGymOwner(mockResponse);
                                          }, 1500);
                                        }}
                                      >
                                        {isProcessingPayment ? (
                                          <>Processing...</>
                                        ) : (
                                          <>Verify Payment & Create Account</>
                                        )}
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="border-4 border-blue-500 inline-block p-2 rounded-lg">
                                      <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-500 text-sm">
                                          Click "Generate Payment QR" below to create a QR code for payment
                                        </span>
                                      </div>
                                    </div>
                                    <p className="mt-2 text-gray-800 text-sm">
                                      Amount: ₹{plans.find(p => p.id === formData.subscriptionPlan)?.price || 0}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          
                          <div className="pt-4">
                            {formData.subscriptionPlan && (
                              <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 mb-4 text-center">
                                <p className="text-white font-medium">Payment Amount</p>
                                <p className="text-2xl font-bold text-blue-400">
                                  ₹{plans.find(p => p.id === formData.subscriptionPlan)?.price || 0}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  For {plans.find(p => p.id === formData.subscriptionPlan)?.name || ''} Plan (1 month)
                                </p>
                              </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                              <Button 
                                className="bg-green-600 hover:bg-green-700 flex items-center flex-1"
                                size="lg"
                                disabled={isProcessingPayment || (formData.paymentMethod === 'qr_scanner' && qrCodeUrl)}
                                onClick={(e) => {
                                  e.preventDefault();
                                  initializeRazorpayPayment();
                                }}
                              >
                                {isProcessingPayment ? (
                                  <>Processing Payment...</>
                                ) : (
                                  <>
                                    {formData.paymentMethod === 'qr_scanner' 
                                      ? (qrCodeUrl ? 'Verify Payment & Create Account' : 'Generate Payment QR') 
                                      : formData.paymentMethod === 'netbanking'
                                        ? 'Proceed to Net Banking'
                                        : 'Complete Payment & Create Account'
                                    }
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            <div className="flex items-center justify-center mt-4">
                              <div className="flex items-center border border-gray-600 rounded-full px-3 py-1 bg-gray-800/50">
                                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                <p className="text-xs text-gray-400">Secure Payment</p>
                              </div>
                            </div>
                            
                            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
                              <p className="text-sm text-center text-blue-300">
                                <strong>TEST MODE:</strong> Using Razorpay Test Environment
                              </p>
                              <p className="text-xs text-center text-gray-400 mt-1">
                                This is connected to Razorpay's test environment using your test API keys.
                                No actual money will be charged, but you can test the full payment flow.
                                For production, replace test keys with live Razorpay API keys.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 mt-6 justify-end">
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.preventDefault();
                    resetForm();
                  }}
                  disabled={isLoading || isProcessingPayment}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Reset Form
                </Button>
                
                {/* Super Admin can ONLY create Gym Owners */}
                {isSuperAdmin && !showPaymentSection && (
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleCreateUser('gym-owner');
                    }}
                    className="bg-green-600 hover:bg-green-700 px-6"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Validating...' : 'Continue to Payment'}
                  </Button>
                )}
                
                {/* Gym Owner can ONLY create Trainers and Members */}
                {isGymOwner && (
                  <>
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleCreateUser('trainer');
                      }}
                      className="bg-purple-600 hover:bg-purple-700 px-6"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Trainer'}
                    </Button>
                    <Button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleCreateUser('member');
                      }}
                      className="bg-blue-600 hover:bg-blue-700 px-6"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating...' : 'Create Member'}
                    </Button>
                  </>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Display message */}
        {message.text && (
          <div className={`mt-6 p-4 rounded-lg flex items-center ${
            message.type === 'error' 
              ? 'bg-red-900/50 text-red-200 border border-red-700' 
              : message.type === 'info'
                ? 'bg-blue-900/50 text-blue-200 border border-blue-700'
                : 'bg-green-900/50 text-green-200 border border-green-700'
          }`}>
            <div className={`mr-3 p-2 rounded-full ${
              message.type === 'error' 
                ? 'bg-red-800' 
                : message.type === 'info'
                  ? 'bg-blue-800'
                  : 'bg-green-800'
            }`}>
              {message.type === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : message.type === 'info' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>{message.text}</div>
          </div>
        )}
        
        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update user information
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Password (leave blank to keep unchanged)</Label>
                  <Input
                    id="edit-password"
                    name="password"
                    type="password"
                    value={editFormData.password}
                    onChange={handleEditInputChange}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-gymName">Gym Name</Label>
                  <Input
                    id="edit-gymName"
                    name="gymName"
                    value={editFormData.gymName}
                    onChange={handleEditInputChange}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                  <Input
                    id="edit-whatsapp"
                    name="whatsapp"
                    value={editFormData.whatsapp}
                    onChange={handleEditInputChange}
                    className="bg-gray-700 border-gray-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  name="address"
                  value={editFormData.address}
                  onChange={handleEditInputChange}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteUser} disabled={isLoading}>
                {isLoading ? 'Deleting...' : 'Delete User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default UserManagementPage;