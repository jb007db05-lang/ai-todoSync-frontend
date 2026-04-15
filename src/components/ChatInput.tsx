import { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import type { ChatMessage } from '@/types/chat';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_MESSAGE_LENGTH = 4000;

function ChatInput({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  replyingTo,
  onCancelReply,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const [content, setContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingTimeRef = useRef<number>(0);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [content]);

  // Focus when replying to changes
  useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  // Handle typing with debounce
  const handleTyping = useCallback(() => {
    const now = Date.now();
    lastTypingTimeRef.current = now;

    if (!isTyping) {
      setIsTyping(true);
      onTypingStart();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastTypingTimeRef.current >= 2000) {
        setIsTyping(false);
        onTypingStop();
      }
    }, 2000);
  }, [isTyping, onTypingStart, onTypingStop]);

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      if (value.length <= MAX_MESSAGE_LENGTH) {
        setContent(value);
        handleTyping();
      }
    },
    [handleTyping]
  );

  // Handle submit
  const handleSubmit = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;

    onSendMessage(trimmed);
    setContent('');

    // Clear typing state
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTyping(false);
    onTypingStop();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, disabled, onSendMessage, onTypingStop]);

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const characterCount = content.length;
  const isNearLimit = characterCount > MAX_MESSAGE_LENGTH * 0.9;
  const isAtLimit = characterCount >= MAX_MESSAGE_LENGTH;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      {/* Reply preview */}
      {replyingTo && (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1 flex items-center gap-2 overflow-hidden">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Replying to{' '}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {replyingTo.sender?.name || replyingTo.sender?.email}
              </span>
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
              "{replyingTo.content.slice(0, 100)}
              {replyingTo.content.length > 100 && '...'}"
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 p-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={[
              'w-full px-4 py-2.5 pr-20 rounded-xl resize-none',
              'bg-slate-100 dark:bg-slate-800 border-0',
              'text-slate-900 dark:text-slate-100 text-sm',
              'placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            ].join(' ')}
            style={{ minHeight: '44px', maxHeight: '150px' }}
          />

          {/* Character count */}
          <div
            className={[
              'absolute right-3 bottom-2.5 text-[10px] font-medium',
              isAtLimit
                ? 'text-red-500'
                : isNearLimit
                  ? 'text-amber-500'
                  : 'text-slate-400 dark:text-slate-500',
              content.length === 0 ? 'opacity-0' : 'opacity-100',
              'transition-opacity',
            ].join(' ')}
          >
            {characterCount}/{MAX_MESSAGE_LENGTH}
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled || isAtLimit}
          className={[
            'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center',
            'transition-all duration-200',
            content.trim() && !disabled && !isAtLimit
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed',
          ].join(' ')}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
