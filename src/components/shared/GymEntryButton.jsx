import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { LogIn, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const GymEntryButton = ({ className = "", size = "default", variant = "default" }) => {
  const { authFetch, user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [entryGranted, setEntryGranted] = useState(false);

  const handleGymEntry = async () => {
    if (!user) {
      toast.error('Please log in to access gym entry');
      return;
    }

    if (user.role !== 'trainer' && user.role !== 'gym-owner') {
      toast.error('Gym entry is only available for trainers and gym owners');
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await authFetch('/access/staff-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.success) {
        setEntryGranted(true);
        toast.success(`Welcome to the gym, ${user.name}! Entry recorded successfully.`);
        
        // Reset the success state after 3 seconds
        setTimeout(() => {
          setEntryGranted(false);
        }, 3000);
      } else {
        toast.error(response.message || 'Failed to record gym entry');
      }
    } catch (error) {
      console.error('Gym entry error:', error);
      toast.error('Failed to process gym entry. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button
      onClick={handleGymEntry}
      disabled={isProcessing}
      className={className}
      size={size}
      variant={entryGranted ? "default" : variant}
    >
      {isProcessing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : entryGranted ? (
        <>
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          Entry Recorded
        </>
      ) : (
        <>
          <LogIn className="h-4 w-4 mr-2" />
          Gym Entry
        </>
      )}
    </Button>
  );
};

export default GymEntryButton;