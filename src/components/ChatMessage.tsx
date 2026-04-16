import { useState, useCallback, useMemo } from 'react';
import {
  Edit2,
  Trash2,
  Smile,
  CornerDownRight,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import type { ChatMessage, MessageSender, MessageReaction } from '@/types/chat';
import { MessageType } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId: string;
  currentUserEmail?: string;
  isAdmin: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  onReply: (message: ChatMessage) => void;
  onLoadThread?: (messageId: string) => void;
}

// Common emoji reactions
const QUICK_REACTIONS = ['👍', '👎', '❤️', '😄', '😮', '🎉', '👀', '🚀'];

// Format date for display
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date for tooltip
// const formatFullDate = (dateString: string): string => {
//   const date = new Date(dateString);
//   return date.toLocaleString([], {
//     year: 'numeric',
//     month: 'short',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//   });
// };

// Get user initials for avatar
const getInitials = (user: MessageSender | null): string => {
  if (!user) return '?';
  if (user.name) {
    return user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return user.email.slice(0, 2).toUpperCase();
};

// Get avatar color based on user ID
const getAvatarColor = (userId: string | null): string => {
  if (!userId) return 'bg-gray-400';
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Group reactions by emoji
const groupReactions = (reactions: MessageReaction[]): Map<string, string[]> => {
  const grouped = new Map<string, string[]>();
  reactions.forEach((reaction) => {
    const users = grouped.get(reaction.emoji) || [];
    users.push(reaction.userId);
    grouped.set(reaction.emoji, users);
  });
  return grouped;
};

function ChatMessageComponent({
  message,
  currentUserId,
  currentUserEmail,
  isAdmin,
  onEdit,
  onDelete,
  onAddReaction,
  onRemoveReaction,
  onReply,
  onLoadThread,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isOwnMessage = 
    message.senderId === currentUserId || 
    (currentUserEmail && message.sender?.email?.toLowerCase() === currentUserEmail.toLowerCase());
  const isSystemMessage = message.type === MessageType.SYSTEM;
  const isDeleted = message.isDeleted;

  // Can edit?
  const canEdit = isOwnMessage && !isDeleted && !isSystemMessage;
  const canDelete = !isDeleted && !isSystemMessage && (isOwnMessage || isAdmin);

  // Group reactions
  const groupedReactions = useMemo(() => groupReactions(message.reactions), [message.reactions]);
  const userReactions = useMemo(
    () => message.reactions.filter((r) => r.userId === currentUserId).map((r) => r.emoji),
    [message.reactions, currentUserId]
  );

  // Handle edit submit
  const handleEditSubmit = useCallback(() => {
    const trimmed = editContent.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
    setEditContent(message.content);
  }, [editContent, message.content, message.id, onEdit]);

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditContent(message.content);
  }, [message.content]);

  // Handle reaction click
  const handleReactionClick = useCallback(
    (emoji: string) => {
      if (userReactions.includes(emoji)) {
        onRemoveReaction(message.id, emoji);
      } else {
        onAddReaction(message.id, emoji);
      }
      setShowEmojiPicker(false);
    },
    [userReactions, message.id, onAddReaction, onRemoveReaction]
  );

  // Handle delete
  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this message?')) {
      onDelete(message.id);
    }
  }, [message.id, onDelete]);

  // Render system message
  if (isSystemMessage) {
    return (
      <div className="flex items-center justify-center py-2 my-2">
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-full">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {message.content}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    );
  }

  // Render deleted message
  if (isDeleted) {
    return (
      <div className="flex items-center justify-center py-1 my-1 opacity-50">
        <span className="text-xs text-slate-400 dark:text-slate-500 italic">
          Message deleted
        </span>
      </div>
    );
  }

  return (
    <div
      id={`message-${message.id}`}
      className={[
        'group flex gap-4 px-4 py-3 transition-all duration-200 relative w-full hover:bg-slate-50 dark:hover:bg-slate-900/40',
        isOwnMessage ? 'flex-row-reverse' : 'flex-row',
      ].join(' ')}
    >
      {/* Avatar */}
      <div
        className={[
          'flex-shrink-0 w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-105',
          'text-white text-sm font-bold select-none ring-2 ring-white dark:ring-slate-900',
          getAvatarColor(message.senderId),
        ].join(' ')}
      >
        {getInitials(message.sender)}
      </div>

      {/* Message content */}
      <div className={['flex flex-col max-w-[75%] min-w-0', isOwnMessage ? 'items-end' : 'items-start'].join(' ')}>
        {/* Header (Sender Name) */}
        {!isOwnMessage && (
          <div className="flex items-center gap-2 mb-1 px-1">
            <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-wide uppercase">
              {message.sender?.name || message.sender?.email || 'Unknown'}
            </span>
          </div>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={[
              'flex items-center gap-2 mb-1 p-1.5 rounded',
              'bg-slate-100 dark:bg-slate-800/50 border-l-2 border-blue-400',
              'cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800',
              isOwnMessage ? 'flex-row-reverse border-r-2 border-l-0' : '',
            ].join(' ')}
            onClick={() => onLoadThread?.(message.replyTo!.id)}
          >
            <CornerDownRight className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {message.replyTo.sender?.name || message.replyTo.sender?.email}: {message.replyTo.content}
            </span>
          </div>
        )}

        {/* Message body */}
        <div className="relative group/bubble">
          {isEditing ? (
            <div className="flex flex-col gap-2 min-w-[300px]">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={[
                  'w-full px-4 py-3 text-sm rounded-2xl resize-none shadow-xl transition-all',
                  'bg-white dark:bg-slate-800 border-2 border-blue-500/50',
                  'text-slate-900 dark:text-slate-100',
                  'focus:outline-none focus:ring-4 focus:ring-blue-500/10',
                ].join(' ')}
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleEditSubmit();
                  }
                  if (e.key === 'Escape') {
                    handleEditCancel();
                  }
                }}
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={handleEditCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancel
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <div
              className={[
                'inline-block px-4 py-2.5 text-sm shadow-sm transition-all duration-200',
                isOwnMessage
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tl-2xl rounded-tr-sm rounded-br-2xl rounded-bl-2xl'
                  : 'bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 rounded-tl-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl',
              ].join(' ')}
              style={{ wordBreak: 'break-word' }}
            >
              <div className="leading-relaxed">{message.content}</div>
              
              {/* Internal Timestamp (Subtle) */}
              <div className={['mt-1 text-[10px] select-none block', isOwnMessage ? 'text-blue-100/60' : 'text-slate-400/70'].join(' ')}>
                {formatTime(message.createdAt)}
                {message.isEdited && <span className="ml-1 opacity-70">(edited)</span>}
              </div>
            </div>
          )}
        </div>

        {/* Reactions */}
        {groupedReactions.size > 0 && (
          <div className={['flex flex-wrap gap-1 mt-1', isOwnMessage ? 'justify-end' : ''].join(' ')}>
            {Array.from(groupedReactions.entries()).map(([emoji, users]) => {
              const hasReacted = userReactions.includes(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={[
                    'flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs',
                    'border transition-colors',
                    hasReacted
                      ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-600'
                      : 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
                    'hover:border-blue-300 dark:hover:border-blue-600',
                  ].join(' ')}
                  title={`Reacted by ${users.length} user${users.length > 1 ? 's' : ''}`}
                >
                  <span>{emoji}</span>
                  <span className={hasReacted ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}>
                    {users.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Reply count indicator */}
        {message.replyCount > 0 && (
          <button
            onClick={() => onLoadThread?.(message.id)}
            className={[
              'mt-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300',
              'flex items-center gap-1',
              isOwnMessage ? 'justify-end' : '',
            ].join(' ')}
          >
            <CornerDownRight className="w-3 h-3" />
            {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div
          className={[
            'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity',
            'flex-shrink-0',
          ].join(' ')}
        >
          {/* Emoji picker */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Add reaction"
            >
              <Smile className="w-4 h-4" />
            </button>

            {showEmojiPicker && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowEmojiPicker(false)}
                />
                <div className="absolute right-0 bottom-full mb-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
                  <div className="flex flex-wrap gap-1">
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReactionClick(emoji)}
                        className="w-8 h-8 flex items-center justify-center text-lg rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Reply button */}
          <button
            onClick={() => onReply(message)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Reply"
          >
            <CornerDownRight className="w-4 h-4" />
          </button>

          {/* More actions */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showActions && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 min-w-[120px]">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowActions(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatMessageComponent;
