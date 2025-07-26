import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { X, Save, Calculator } from "lucide-react";

const AddMemberPayment = ({ isOpen, onClose, onPaymentAdded }) => {
  const { authFetch, users } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [formData, setFormData] = useState({
    memberId: '',
    planType: 'Basic',
    duration: '1',
    paymentMethod: 'Cash',
    transactionId: '',
    notes: '',
    membershipStartDate: new Date().toISOString().split('T')[0],
    membershipEndDate: ''
  });
  const [calculatedAmount, setCalculatedAmount] = useState(0);

  // Plan costs configuration
  const planCosts = {
    'Basic': 500,
    'Standard': 1000,
    'Premium': 1500
  };

  // Load members on component mount
  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen]);

  // Calculate amount when plan type, duration, or member changes
  useEffect(() => {
    calculateAmount();
  }, [formData.planType, formData.duration, formData.memberId]);

  // Calculate end date when start date or duration changes
  useEffect(() => {
    if (formData.membershipStartDate && formData.duration) {
      const startDate = new Date(formData.membershipStartDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(formData.duration));
      
      setFormData(prev => ({
        ...prev,
        membershipEndDate: endDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.membershipStartDate, formData.duration]);

  const loadMembers = async () => {
    try {
      const response = await authFetch('/users/');
      if (response.success || response.status === 'success') {
        const allUsers = response.data?.users || [];
        const memberUsers = allUsers.filter(user => user.role === 'member');
        setMembers(memberUsers);
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load members');
    }
  };

  const calculateAmount = () => {
    const selectedMember = members.find(member => member._id === formData.memberId);
    const planCost = planCosts[formData.planType] || planCosts['Basic'];
    const trainerCost = selectedMember?.assignedTrainer ? 500 : 0;
    const duration = parseInt(formData.duration) || 1;
    
    const totalAmount = (planCost + trainerCost) * duration;
    setCalculatedAmount(totalAmount);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.memberId) {
      toast.error('Please select a member');
      return;
    }

    if (!formData.planType || !formData.duration) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      const paymentData = {
        memberId: formData.memberId,
        amount: calculatedAmount,
        planType: formData.planType,
        duration: parseInt(formData.duration),
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId || undefined,
        notes: formData.notes || undefined,
        membershipStartDate: formData.membershipStartDate,
        membershipEndDate: formData.membershipEndDate
      };

      const response = await authFetch('/payments/member-payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      if (response.success || response.status === 'success') {
        toast.success('Payment recorded successfully');
        onPaymentAdded && onPaymentAdded(response.data.payment);
        onClose();
        
        // Reset form
        setFormData({
          memberId: '',
          planType: 'Basic',
          duration: '1',
          paymentMethod: 'Cash',
          transactionId: '',
          notes: '',
          membershipStartDate: new Date().toISOString().split('T')[0],
          membershipEndDate: ''
        });
        setCalculatedAmount(0);
      } else {
        throw new Error(response.message || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedMember = members.find(member => member._id === formData.memberId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Record Member Payment</CardTitle>
            <CardDescription className="text-gray-400">
              Add a new payment record for a gym member
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Member Selection */}
            <div>
              <Label className="text-gray-300 mb-2 block">Select Member *</Label>
              <Select value={formData.memberId} onValueChange={(value) => handleInputChange('memberId', value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {members.map(member => (
                    <SelectItem key={member._id} value={member._id} className="text-white hover:bg-gray-600">
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Member Info Display */}
            {selectedMember && (
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
                <h4 className="text-white font-medium mb-2">Member Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white ml-2">{selectedMember.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{selectedMember.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white ml-2">{selectedMember.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Current Plan:</span>
                    <span className="text-white ml-2">{selectedMember.planType || selectedMember.membershipType || 'Basic'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Has Trainer:</span>
                    <span className="text-white ml-2">{selectedMember.assignedTrainer ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Plan Type *</Label>
                <Select value={formData.planType} onValueChange={(value) => handleInputChange('planType', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="Basic" className="text-white hover:bg-gray-600">Basic (₹500/month)</SelectItem>
                    <SelectItem value="Standard" className="text-white hover:bg-gray-600">Standard (₹1000/month)</SelectItem>
                    <SelectItem value="Premium" className="text-white hover:bg-gray-600">Premium (₹1500/month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Duration (Months) *</Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {[1, 2, 3, 6, 12].map(month => (
                      <SelectItem key={month} value={month.toString()} className="text-white hover:bg-gray-600">
                        {month} Month{month > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount Calculation */}
            <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-800">
              <div className="flex items-center mb-2">
                <Calculator className="h-5 w-5 text-blue-400 mr-2" />
                <h4 className="text-white font-medium">Payment Calculation</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Plan Cost ({formData.duration} month{formData.duration !== '1' ? 's' : ''}):</span>
                  <span className="text-white">₹{(planCosts[formData.planType] || 0) * parseInt(formData.duration)}</span>
                </div>
                {selectedMember?.assignedTrainer && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Trainer Cost ({formData.duration} month{formData.duration !== '1' ? 's' : ''}):</span>
                    <span className="text-white">₹{500 * parseInt(formData.duration)}</span>
                  </div>
                )}
                <div className="border-t border-gray-600 pt-2 flex justify-between font-medium">
                  <span className="text-white">Total Amount:</span>
                  <span className="text-white text-lg">₹{calculatedAmount}</span>
                </div>
              </div>
            </div>

            {/* Membership Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Membership Start Date *</Label>
                <Input
                  type="date"
                  value={formData.membershipStartDate}
                  onChange={(e) => handleInputChange('membershipStartDate', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Membership End Date</Label>
                <Input
                  type="date"
                  value={formData.membershipEndDate}
                  onChange={(e) => handleInputChange('membershipEndDate', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Payment Method and Transaction ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Payment Method</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange('paymentMethod', value)}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="Cash" className="text-white hover:bg-gray-600">Cash</SelectItem>
                    <SelectItem value="UPI" className="text-white hover:bg-gray-600">UPI</SelectItem>
                    <SelectItem value="Card" className="text-white hover:bg-gray-600">Card</SelectItem>
                    <SelectItem value="Bank Transfer" className="text-white hover:bg-gray-600">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block">Transaction ID (Optional)</Label>
                <Input
                  type="text"
                  placeholder="Enter transaction ID"
                  value={formData.transactionId}
                  onChange={(e) => handleInputChange('transactionId', e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-gray-300 mb-2 block">Notes (Optional)</Label>
              <Textarea
                placeholder="Add any additional notes about this payment..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.memberId}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recording...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Record Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMemberPayment;