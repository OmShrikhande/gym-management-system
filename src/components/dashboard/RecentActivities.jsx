import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Clock, UserPlus, Calendar, CreditCard } from 'lucide-react';

const RecentActivities = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'member_join':
        return UserPlus;
      case 'payment':
        return CreditCard;
      case 'workout':
        return Calendar;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'member_join':
        return 'bg-green-100 text-green-800';
      case 'payment':
        return 'bg-blue-100 text-blue-800';
      case 'workout':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const defaultActivities = [
    {
      id: 1,
      type: 'member_join',
      title: 'New Member Joined',
      description: 'John Doe registered for Premium plan',
      time: '2 hours ago',
      user: 'John Doe'
    },
    {
      id: 2,
      type: 'payment',
      title: 'Payment Received',
      description: 'Monthly subscription payment from Sarah',
      time: '4 hours ago',
      user: 'Sarah Wilson'
    },
    {
      id: 3,
      type: 'workout',
      title: 'Workout Completed',
      description: 'Mike completed Upper Body workout',
      time: '6 hours ago',
      user: 'Mike Johnson'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity) => {
            const Icon = getActivityIcon(activity.type);
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {activity.time}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {activity.description}
                  </p>
                  {activity.user && (
                    <div className="flex items-center mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {activity.user.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="ml-2 text-xs text-gray-500">
                        {activity.user}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivities;