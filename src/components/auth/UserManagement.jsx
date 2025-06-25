import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function UserManagement() {
  const { 
    user, 
    users, 
    fetchUsers, 
    createGymOwner, 
    createTrainer, 
    createMember,
    isSuperAdmin,
    isGymOwner
  } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('view');
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
    });
    setMessage({ type: '', text: '' });
  };
  
  const handleCreateUser = async (userType) => {
    setMessage({ type: '', text: '' });
    
    let createFunction;
    switch(userType) {
      case 'gym-owner':
        createFunction = createGymOwner;
        break;
      case 'trainer':
        createFunction = createTrainer;
        break;
      case 'member':
        createFunction = createMember;
        break;
      default:
        setMessage({ type: 'error', text: 'Invalid user type' });
        return;
    }
    
    const result = await createFunction(formData);
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message });
      resetForm();
      fetchUsers(); // Refresh the users list
    } else {
      setMessage({ type: 'error', text: result.message });
    }
  };
  
  // Filter users based on current user's role
  const filteredUsers = users.filter(u => {
    if (isSuperAdmin) {
      return true; // Super admin can see all users
    } else if (isGymOwner) {
      return u.role === 'trainer' || u.role === 'member'; // Gym owners see trainers and members
    }
    return false;
  });
  
  return (
    <div className="container mx-auto p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="view">View Users</TabsTrigger>
          <TabsTrigger value="create">Create User</TabsTrigger>
        </TabsList>
        
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                {isSuperAdmin 
                  ? 'Manage all users in the system' 
                  : isGymOwner 
                    ? 'Manage trainers and members for your gym' 
                    : 'View users'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <Card key={user._id} className="p-4">
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <CardDescription>{user.email}</CardDescription>
                        <div className="mt-2">
                          <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p>No users found.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New User</CardTitle>
              <CardDescription>
                {isSuperAdmin 
                  ? 'Create gym owners, trainers, or members' 
                  : 'Create trainers or members for your gym'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email Address"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    required
                  />
                </div>
                
                {message.text && (
                  <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                    <AlertDescription>{message.text}</AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              {isSuperAdmin && (
                <Button 
                  onClick={() => handleCreateUser('gym-owner')}
                  className="w-full sm:w-auto"
                >
                  Create Gym Owner
                </Button>
              )}
              
              {(isSuperAdmin || isGymOwner) && (
                <>
                  <Button 
                    onClick={() => handleCreateUser('trainer')}
                    className="w-full sm:w-auto"
                  >
                    Create Trainer
                  </Button>
                  
                  <Button 
                    onClick={() => handleCreateUser('member')}
                    className="w-full sm:w-auto"
                  >
                    Create Member
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default UserManagement;