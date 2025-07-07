import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  QrCode, 
  Edit, 
  Trash2, 
  Eye,
  MapPin,
  Users
} from 'lucide-react';

const MemberCard = ({ 
  member, 
  onEdit, 
  onDelete, 
  onView, 
  onGenerateQR,
  showActions = true 
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', text: 'Active' },
      inactive: { color: 'bg-red-100 text-red-800', text: 'Inactive' },
      suspended: { color: 'bg-yellow-100 text-yellow-800', text: 'Suspended' }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getMembershipBadge = (type) => {
    const typeConfig = {
      basic: { color: 'bg-blue-100 text-blue-800', text: 'Basic' },
      premium: { color: 'bg-purple-100 text-purple-800', text: 'Premium' },
      vip: { color: 'bg-gold-100 text-gold-800', text: 'VIP' }
    };
    
    const config = typeConfig[type] || typeConfig.basic;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold">
                {member.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
              <p className="text-sm text-gray-500">
                ID: {member.memberId || member._id?.slice(-6)}
              </p>
              <div className="flex gap-2 mt-2">
                {getStatusBadge(member.status)}
                {getMembershipBadge(member.membershipType)}
              </div>
            </div>
          </div>
          {showActions && (
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(member)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(member)}
                className="text-green-600 hover:text-green-800"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(member)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-4 w-4 mr-3 text-gray-400" />
            <span className="truncate">{member.email}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-3 text-gray-400" />
            <span>{member.phone}</span>
          </div>
          {member.address && (
            <div className="flex items-start text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-3 mt-0.5 text-gray-400" />
              <span className="line-clamp-2">{member.address}</span>
            </div>
          )}
        </div>

        {/* Membership Details */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Joining Date:</span>
            <span className="font-medium">
              {new Date(member.joiningDate).toLocaleDateString()}
            </span>
          </div>
          {member.dateOfBirth && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Age:</span>
              <span className="font-medium">
                {new Date().getFullYear() - new Date(member.dateOfBirth).getFullYear()} years
              </span>
            </div>
          )}
          {member.gender && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Gender:</span>
              <span className="font-medium capitalize">{member.gender}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {showActions && (
          <div className="border-t pt-4 flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onGenerateQR(member)}
              className="flex-1 text-xs"
            >
              <QrCode className="h-3 w-3 mr-1" />
              QR Code
            </Button>
            <Button
              size="sm"
              onClick={() => onView(member)}
              className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <User className="h-3 w-3 mr-1" />
              View Profile
            </Button>
          </div>
        )}

        {/* Emergency Contact */}
        {member.emergencyContact && (
          <div className="bg-gray-50 rounded-lg p-3 mt-4">
            <h4 className="text-xs font-medium text-gray-700 mb-1">Emergency Contact</h4>
            <p className="text-sm text-gray-600">{member.emergencyContact}</p>
          </div>
        )}

        {/* Medical Notes */}
        {member.medicalConditions && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
            <h4 className="text-xs font-medium text-red-700 mb-1">Medical Notes</h4>
            <p className="text-sm text-red-600">{member.medicalConditions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MemberCard;