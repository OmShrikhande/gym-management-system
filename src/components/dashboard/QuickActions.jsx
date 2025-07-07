import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { UserPlus, Calendar, FileText, Settings, QrCode, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = ({ userRole }) => {
  const navigate = useNavigate();

  const getQuickActions = () => {
    switch (userRole) {
      case 'super-admin':
        return [
          {
            icon: Users,
            title: 'Manage Users',
            description: 'Add or manage system users',
            action: () => navigate('/user-management'),
            color: 'bg-blue-500 hover:bg-blue-600'
          },
          {
            icon: Settings,
            title: 'System Settings',
            description: 'Configure system settings',
            action: () => navigate('/system-settings'),
            color: 'bg-purple-500 hover:bg-purple-600'
          },
          {
            icon: FileText,
            title: 'Reports',
            description: 'View system reports',
            action: () => navigate('/reports'),
            color: 'bg-green-500 hover:bg-green-600'
          }
        ];
      
      case 'gym-owner':
        return [
          {
            icon: UserPlus,
            title: 'Add Member',
            description: 'Register new gym member',
            action: () => navigate('/members'),
            color: 'bg-blue-500 hover:bg-blue-600'
          },
          {
            icon: Calendar,
            title: 'Schedule',
            description: 'Manage gym schedule',
            action: () => navigate('/schedule'),
            color: 'bg-green-500 hover:bg-green-600'
          },
          {
            icon: QrCode,
            title: 'QR Scanner',
            description: 'Scan member QR codes',
            action: () => navigate('/qr-scanner'),
            color: 'bg-purple-500 hover:bg-purple-600'
          }
        ];
      
      case 'trainer':
        return [
          {
            icon: Users,
            title: 'My Members',
            description: 'View assigned members',
            action: () => navigate('/my-members'),
            color: 'bg-blue-500 hover:bg-blue-600'
          },
          {
            icon: Calendar,
            title: 'Workouts',
            description: 'Manage workout plans',
            action: () => navigate('/my-workouts'),
            color: 'bg-green-500 hover:bg-green-600'
          },
          {
            icon: FileText,
            title: 'Diet Plans',
            description: 'Create diet plans',
            action: () => navigate('/diet-plans'),
            color: 'bg-orange-500 hover:bg-orange-600'
          }
        ];
      
      case 'member':
        return [
          {
            icon: Calendar,
            title: 'My Workouts',
            description: 'View workout plans',
            action: () => navigate('/my-workouts'),
            color: 'bg-blue-500 hover:bg-blue-600'
          },
          {
            icon: FileText,
            title: 'My Diet',
            description: 'View diet plans',
            action: () => navigate('/my-diet'),
            color: 'bg-green-500 hover:bg-green-600'
          },
          {
            icon: QrCode,
            title: 'My QR Code',
            description: 'Show QR code for entry',
            action: () => navigate('/my-qr'),
            color: 'bg-purple-500 hover:bg-purple-600'
          }
        ];
      
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`${action.color} text-white justify-start h-auto p-4 flex-col items-start`}
              variant="default"
            >
              <div className="flex items-center w-full mb-2">
                <action.icon className="h-5 w-5 mr-2" />
                <span className="font-medium">{action.title}</span>
              </div>
              <span className="text-xs text-left opacity-90">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;