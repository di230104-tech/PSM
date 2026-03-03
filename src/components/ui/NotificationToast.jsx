import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';
import Button from './Button';

const NotificationToast = ({ 
  message, 
  type = 'info', 
  duration = 5000, 
  onClose,
  id 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) {
        onClose(id);
      }
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "flex items-start space-x-3 p-4 rounded-xl shadow-xl border border-gray-200 w-full";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-white text-success-foreground`;
      case 'warning':
        return `${baseStyles} bg-white text-warning-foreground`;
      case 'error':
        return `${baseStyles} bg-white text-error-foreground`;
      case 'info':
      default:
        return `${baseStyles} bg-white text-accent-foreground`;
    }
  };


  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'XCircle';
      case 'info':
      default:
        return 'Info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-error';
      case 'info':
      default:
        return 'text-accent';
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`
      transition-all duration-300 ease-in-out transform
      ${isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
    `}>
      <div className={getToastStyles()}>
        <Icon 
          name={getIcon()} 
          size={20} 
          className={`flex-shrink-0 mt-0.5 ${getIconColor()}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {message}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          iconName="X"
          onClick={handleClose}
          className="flex-shrink-0 h-6 w-6 text-muted-foreground hover:text-foreground -mt-1 -mr-1"
        />
      </div>
    </div>
  );
};

const NotificationContainer = ({ notifications = [], onRemove }) => {
  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        {notifications?.map((notification) => (
          <NotificationToast
            key={notification?.id}
            {...notification}
            onClose={onRemove}
          />
        ))}
      </div>
    </div>
  );
};

export { NotificationToast, NotificationContainer };
export default NotificationToast;