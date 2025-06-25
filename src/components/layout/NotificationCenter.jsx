import { useState, useEffect, useRef } from "react";
import { Bell, X, Check, AlertCircle, CreditCard, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const NotificationCenter = () => {
  const { 
    notifications, 
    unreadNotificationCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    fetchNotifications,
    user
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  // Close notification panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Temporarily disable automatic notification fetching to reduce system load
  useEffect(() => {
    // We're disabling automatic notification fetching to improve performance
    // Notifications will only be fetched when explicitly requested by user actions
    
    // No interval polling to reduce API calls and system load
    return () => {};
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read
    markNotificationAsRead(notification._id);
    
    // Navigate to action link if provided
    if (notification.actionLink) {
      navigate(notification.actionLink);
    }
    
    // Close notification panel
    setIsOpen(false);
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_due':
      case 'subscription_expiring':
        return <Calendar className="h-5 w-5 text-yellow-500" />;
      case 'payment_success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'subscription_expired':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={notificationRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative text-gray-400 hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadNotificationCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white"
            variant="destructive"
          >
            {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-50">
          <div className="p-3 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium">Notifications</h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white text-xs"
                onClick={markAllNotificationsAsRead}
              >
                Mark all as read
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-white h-7 w-7"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-3 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer ${
                    !notification.read ? "bg-gray-700/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <p className={`text-sm ${!notification.read ? "font-medium text-white" : "text-gray-300"}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;