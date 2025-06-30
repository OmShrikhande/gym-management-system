import React, { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
//import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search, Users, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const AssignmentDialog = ({ 
  isOpen, 
  onClose, 
  itemId, 
  itemType, // 'workout' or 'diet-plan'
  itemName,
  currentAssignments = [],
  onAssignmentComplete 
}) => {
  const { authFetch, user } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load members when dialog opens
  useEffect(() => {
    if (isOpen && user) {
      loadMembers();
      // Set currently assigned members as selected
      setSelectedMembers(currentAssignments.map(assignment => 
        typeof assignment === 'object' ? assignment._id : assignment
      ));
    }
  }, [isOpen, user]);

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      // Get members from the same gym as the trainer
      const response = await authFetch('/users');
      
      if (response.success || response.status === 'success') {
        const allUsers = response.data?.users || [];
        // Filter for members only and those belonging to the same gym
        const gymMembers = allUsers.filter(u => 
          u.role === 'member' && 
          (u.createdBy === user._id || u.gym === user._id || u.createdBy === user.createdBy)
        );
        setMembers(gymMembers);
      } else {
        toast.error('Failed to load members');
      }
    } catch (error) {
      console.error('Error loading members:', error);
      toast.error('Failed to load members');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberToggle = (memberId) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleAssign = async () => {
    setIsSubmitting(true);
    try {
      const endpoint = itemType === 'workout' 
        ? `/workouts/${itemId}/assign`
        : `/diet-plans/${itemId}/assign`;

      const response = await authFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          memberIds: selectedMembers
        })
      });

      if (response.success || response.status === 'success') {
        toast.success(`${itemType === 'workout' ? 'Workout' : 'Diet plan'} assigned successfully!`);
        onAssignmentComplete && onAssignmentComplete();
        onClose();
      } else {
        toast.error(response.message || 'Failed to assign');
      }
    } catch (error) {
      console.error('Error assigning:', error);
      toast.error('Failed to assign');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter members based on search term
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            Assign {itemType === 'workout' ? 'Workout' : 'Diet Plan'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Assign "{itemName}" to members in your gym
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-white"
            />
          </div>

          {/* Members List */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400 mr-2" />
                <span className="text-gray-400">Loading members...</span>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-4">
                <Users className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400">
                  {searchTerm ? 'No members found' : 'No members available'}
                </p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => handleMemberToggle(member._id)}
                >
                  <Checkbox
                    checked={selectedMembers.includes(member._id)}
                    onChange={() => handleMemberToggle(member._id)}
                    className="border-gray-600"
                  />
                  <div className="flex-1">
                    <p className="text-white font-medium">{member.name}</p>
                    <p className="text-gray-400 text-sm">{member.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected count */}
          {selectedMembers.length > 0 && (
            <div className="text-sm text-gray-400">
              {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedMembers.length === 0 || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              `Assign to ${selectedMembers.length} member${selectedMembers.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentDialog;