import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { 
  Users, 
  FileText, 
  Calendar, 
  Plus, 
  Search,
  Database,
  Inbox
} from 'lucide-react';

const EmptyState = ({
  icon: CustomIcon,
  title = 'No data found',
  description = 'Get started by adding your first item.',
  actionText = 'Add Item',
  onAction,
  type = 'default', // default, search, database, inbox
  showAction = true
}) => {
  const getDefaultIcon = () => {
    switch (type) {
      case 'search':
        return Search;
      case 'database':
        return Database;
      case 'inbox':
        return Inbox;
      case 'members':
        return Users;
      case 'documents':
        return FileText;
      case 'calendar':
        return Calendar;
      default:
        return FileText;
    }
  };

  const getEmptyMessages = () => {
    switch (type) {
      case 'members':
        return {
          title: 'No members found',
          description: 'Start building your gym community by adding your first member.',
          actionText: 'Add Member'
        };
      case 'workouts':
        return {
          title: 'No workout plans',
          description: 'Create workout plans to help your members achieve their fitness goals.',
          actionText: 'Create Workout'
        };
      case 'trainers':
        return {
          title: 'No trainers added',
          description: 'Add trainers to your gym to provide better service to your members.',
          actionText: 'Add Trainer'
        };
      case 'search':
        return {
          title: 'No results found',
          description: 'Try adjusting your search criteria or filters.',
          actionText: 'Clear Filters'
        };
      case 'notifications':
        return {
          title: 'No notifications',
          description: 'You\'re all caught up! Check back later for new updates.',
          actionText: 'Refresh'
        };
      default:
        return {
          title: title,
          description: description,
          actionText: actionText
        };
    }
  };

  const Icon = CustomIcon || getDefaultIcon();
  const messages = getEmptyMessages();

  return (
    <Card className="border-dashed border-2 border-gray-200">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Icon className="h-10 w-10 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {messages.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-6 max-w-sm leading-relaxed">
          {messages.description}
        </p>
        
        {showAction && onAction && (
          <Button 
            onClick={onAction}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            {messages.actionText}
          </Button>
        )}
        
        {type === 'search' && (
          <div className="mt-4 text-xs text-gray-500">
            <p>Try searching for different keywords or</p>
            <button 
              onClick={onAction} 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              clear all filters
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;