import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Users, 
  Wrench,
  Info,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const TrainerGymAssignmentFix = () => {
  const { authFetch, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [trainerStatus, setTrainerStatus] = useState(null);
  const [fixResults, setFixResults] = useState(null);

  const checkTrainerStatus = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/trainer-fix/trainer-status');
      
      if (response.success) {
        setTrainerStatus(response.data);
        toast.success('Trainer status loaded successfully');
      } else {
        toast.error('Failed to load trainer status');
      }
    } catch (error) {
      console.error('Error checking trainer status:', error);
      toast.error('Failed to check trainer status');
    } finally {
      setIsLoading(false);
    }
  };

  const fixTrainerAssignments = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/trainer-fix/fix-trainer-assignments', {
        method: 'POST'
      });
      
      if (response.success) {
        setFixResults(response.data);
        toast.success(`Fixed ${response.data.trainersFixed} trainer assignments`);
        
        // Refresh status after fix
        setTimeout(() => {
          checkTrainerStatus();
        }, 1000);
      } else {
        toast.error('Failed to fix trainer assignments');
      }
    } catch (error) {
      console.error('Error fixing trainer assignments:', error);
      toast.error('Failed to fix trainer assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (hasIssue) => {
    if (hasIssue) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        Issue
      </Badge>;
    }
    return <Badge variant="default" className="flex items-center gap-1">
      <CheckCircle className="h-3 w-3" />
      OK
    </Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Trainer Gym Assignment Fix
          </CardTitle>
          <CardDescription className="text-gray-400">
            Check and fix trainer gym assignments to resolve gate access issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              onClick={checkTrainerStatus}
              disabled={isLoading}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Info className="h-4 w-4 mr-2" />
                  Check Status
                </>
              )}
            </Button>
            
            {trainerStatus && trainerStatus.trainersWithIssues > 0 && (
              <Button 
                onClick={fixTrainerAssignments}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Fix Issues ({trainerStatus.trainersWithIssues})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      {trainerStatus && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">Total Trainers</span>
                </div>
                <div className="text-2xl font-bold text-white">{trainerStatus.totalTrainers}</div>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300">Trainers OK</span>
                </div>
                <div className="text-2xl font-bold text-green-400">{trainerStatus.trainersOk}</div>
              </div>
              
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="text-gray-300">Issues Found</span>
                </div>
                <div className="text-2xl font-bold text-red-400">{trainerStatus.trainersWithIssues}</div>
              </div>
            </div>

            {trainerStatus.trainersWithIssues > 0 && (
              <Alert className="mt-4 border-orange-700 bg-orange-900/20">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-orange-200">
                  {trainerStatus.trainersWithIssues} trainer(s) are not properly assigned to a gym. 
                  This will prevent them from using gate control functionality.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trainer Details */}
      {trainerStatus && trainerStatus.trainers && trainerStatus.trainers.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Trainer Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainerStatus.trainers.map((trainer) => (
                <div 
                  key={trainer.id} 
                  className={`p-4 rounded-lg border ${
                    trainer.hasIssue 
                      ? 'border-red-700 bg-red-900/20' 
                      : 'border-gray-600 bg-gray-700/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-white">{trainer.name}</h4>
                        {getStatusBadge(trainer.hasIssue)}
                      </div>
                      <p className="text-sm text-gray-400 mb-1">{trainer.email}</p>
                      
                      {trainer.gymOwner ? (
                        <p className="text-sm text-green-300">
                          Assigned to: {trainer.gymOwner.name} ({trainer.gymOwner.email})
                        </p>
                      ) : (
                        <p className="text-sm text-red-300">
                          ⚠️ Not assigned to any gym owner
                        </p>
                      )}
                      
                      {trainer.createdBy && (
                        <p className="text-xs text-gray-500 mt-1">
                          Created by: {trainer.createdBy.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fix Results */}
      {fixResults && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Fix Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-900/20 p-3 rounded-lg border border-blue-700">
                  <div className="text-sm text-blue-300">Processed</div>
                  <div className="text-xl font-bold text-blue-100">{fixResults.trainersProcessed}</div>
                </div>
                <div className="bg-green-900/20 p-3 rounded-lg border border-green-700">
                  <div className="text-sm text-green-300">Fixed</div>
                  <div className="text-xl font-bold text-green-100">{fixResults.trainersFixed}</div>
                </div>
                <div className="bg-red-900/20 p-3 rounded-lg border border-red-700">
                  <div className="text-sm text-red-300">Failed</div>
                  <div className="text-xl font-bold text-red-100">{fixResults.trainersFailed}</div>
                </div>
              </div>

              {fixResults.fixResults && fixResults.fixResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-white">Detailed Results:</h4>
                  {fixResults.fixResults.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg text-sm ${
                        result.status === 'fixed' 
                          ? 'bg-green-900/20 border border-green-700 text-green-100'
                          : 'bg-red-900/20 border border-red-700 text-red-100'
                      }`}
                    >
                      <div className="font-medium">{result.trainerName}</div>
                      <div className="text-xs opacity-75">{result.trainerEmail}</div>
                      {result.status === 'fixed' ? (
                        <div className="text-xs mt-1">
                          ✅ Fixed using method: {result.fixMethod}
                        </div>
                      ) : (
                        <div className="text-xs mt-1">
                          ❌ Failed: {result.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-900/20 border-blue-700">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-300">How to use this tool:</h4>
              <div className="text-sm text-blue-200 space-y-1">
                <p>1. Click "Check Status" to see current trainer assignments</p>
                <p>2. If issues are found, click "Fix Issues" to automatically resolve them</p>
                <p>3. The system will assign trainers to appropriate gym owners</p>
                <p>4. After fixing, trainers should be able to use gate control functionality</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TrainerGymAssignmentFix;