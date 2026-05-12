import React from 'react';
import { Bell } from 'lucide-react';
import UserAvatar from './UserAvatar';
import NotificationBox, { Notification } from './NotificationBox';

interface TopbarProps {
  title: string;
  breadcrumbs?: React.ReactNode;
  user: { name: string | null; email: string };
  notifications: Notification[];
  isNotificationsOpen: boolean;
  onNotificationsToggle: () => void;
  onNotificationsClose: () => void;
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick: (notification: Notification) => void;
  rightContent?: React.ReactNode;
}

const Topbar: React.FC<TopbarProps> = ({
  title,
  breadcrumbs,
  user,
  notifications,
  isNotificationsOpen,
  onNotificationsToggle,
  onNotificationsClose,
  onMarkAsRead,
  onClearAll,
  onNotificationClick,
  rightContent
}) => {
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="relative z-50 flex items-center justify-between gap-4 px-8 h-[72px] shrink-0 bg-white  border-b border-zinc-200  transition-colors">
      <div className="flex flex-col justify-center">
        <h1 className="text-[1.15rem] font-bold font-['Outfit'] text-olive-950  leading-tight">
          {title}
        </h1>
        {breadcrumbs && (
          <div className="flex items-center text-[0.75rem] font-semibold text-zinc-400  mt-0.5 gap-1.5">
            {breadcrumbs}
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        {rightContent}

        {/* Notification Bell */}
        <div className="relative">
          <button
            className="relative flex items-center justify-center p-2 rounded-full text-zinc-600 hover:bg-zinc-100   transition-colors"
            onClick={onNotificationsToggle}
            title="Notifications"
            type="button"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-olive-600 text-[10px] font-bold text-white ring-2 ring-white ">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <NotificationBox
              notifications={notifications}
              onClose={onNotificationsClose}
              onMarkAsRead={onMarkAsRead}
              onClearAll={onClearAll}
              onNotificationClick={onNotificationClick}
            />
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-5 border-l border-zinc-200 ">
          <UserAvatar
            name={user.name}
            email={user.email}
            size="lg"
            showTooltip={false}
          />
          <div className="hidden sm:flex flex-col">
            <span className="text-[0.8rem] font-bold text-olive-900  leading-tight">
              {user.name || 'Current User'}
            </span>
            <span className="text-[0.7rem] text-zinc-500  font-medium">
              {user.email}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;