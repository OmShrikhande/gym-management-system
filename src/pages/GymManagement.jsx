import DashboardLayout from "@/components/layout/DashboardLayout";

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Users, MapPin, Phone, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const GymManagement = () => {
  const { users, fetchUsers, isSuperAdmin } = useAuth();
  const [gymOwners, setGymOwners] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch users when component mounts
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    // Filter gym owners from users array
    if (users.length > 0) {
      const filteredGymOwners = users.filter(user => user.role === 'gym-owner');
      setGymOwners(filteredGymOwners);
    }
  }, [users]);

  const handleAddGym = () => {
    navigate("/users");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Gym Management</h1>
            <p className="text-gray-400 mt-2">Manage gym locations and facilities</p>
          </div>
          {isSuperAdmin && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddGym}>
              <Plus className="mr-2 h-4 w-4" />
              Add New Gym
            </Button>
          )}
        </div>

        {gymOwners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gymOwners.map((gymOwner) => (
              <Card 
                key={gymOwner._id} 
                className="bg-gray-800 border-gray-700 hover:bg-gray-700/70 transition-colors cursor-pointer"
                onClick={() => navigate(`/gym-owner/${gymOwner._id}`)}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Building2 className="mr-2 h-5 w-5" />
                    {gymOwner.gymName || `${gymOwner.name}'s Gym`}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Owner: {gymOwner.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gymOwner.address && (
                      <div className="flex items-center text-gray-300">
                        <MapPin className="mr-2 h-4 w-4" />
                        {gymOwner.address}
                      </div>
                    )}
                    <div className="flex items-center text-gray-300">
                      <Users className="mr-2 h-4 w-4" />
                      {gymOwner.totalMembers || 0} Active Members
                    </div>
                    {gymOwner.phone && (
                      <div className="flex items-center text-gray-300">
                        <Phone className="mr-2 h-4 w-4" />
                        {gymOwner.phone}
                      </div>
                    )}
                    {gymOwner.whatsapp && (
                      <div className="flex items-center text-gray-300">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        WhatsApp: {gymOwner.whatsapp}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t border-gray-700 pt-4">
                  <Button variant="outline" className="w-full text-blue-400 border-blue-800 hover:bg-blue-900/20">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No gyms found. Add your first gym to get started.</p>
            {isSuperAdmin && (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddGym}>
                <Plus className="mr-2 h-4 w-4" />
                Add New Gym
              </Button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GymManagement;