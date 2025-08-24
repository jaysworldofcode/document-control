"use client";

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  MessageCircle, 
  Search,
  Users,
  Clock,
  Paperclip,
  Download,
  ThumbsUp,
  Heart,
  Smile,
  Frown,
  X
} from "lucide-react";
import { useSupabaseRealtimeMessages, Message, MessageAttachment, MessageReaction } from '@/hooks/useSupabaseRealtimeMessages';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Conversation {
  userId: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageSender: string;
  isRead: boolean;
  unreadCount: number;
}

export default function MessagesPage() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Initialize realtime messages hook
  const { 
    isConnected,
    onNewMessage,
    onReactionChange,
    sendMessage,
    markAsRead,
    sendReaction,
    removeReaction,
    uploadAttachment
  } = useSupabaseRealtimeMessages(
    user?.id || '',
    user?.organizationId || 'org_global'
  );

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load conversations"
      });
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (userId: string) => {
    try {
      setLoadingMessages(true);
      const response = await fetch(`/api/messages?userId=${userId}&limit=100`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const data = await response.json();
      setMessages(data.messages?.reverse() || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages"
      });
    } finally {
      setLoadingMessages(false);
    }
  };

  // Fetch available users for new conversations
  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users/list');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Send a new message
  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedConversation || sendingMessage) {
      return;
    }

    setSendingMessage(true);
    setIsUploading(selectedFiles.length > 0);
    
    try {
      // Send message with any attached files
      const sentMessage = await sendMessage(selectedConversation, newMessage.trim(), selectedFiles);
      
      if (sentMessage) {
        setNewMessage('');
        setSelectedFiles([]);
        // No need to add message to state, it will come through the realtime subscription
      } else {
        console.error('Failed to send message - null response');
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
    } finally {
      setSendingMessage(false);
      setIsUploading(false);
    }
  };

  // Start new conversation
  const startConversation = (user: User) => {
    setSelectedConversation(user.id);
    setShowUserList(false);
    setMessages([]);
    
    // Add to conversations if not already there
    const existingConversation = conversations.find(c => c.userId === user.id);
    if (!existingConversation) {
      const newConversation: Conversation = {
        userId: user.id,
        user,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        lastMessageSender: '',
        isRead: true,
        unreadCount: 0
      };
      setConversations(prev => [newConversation, ...prev]);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
    }
  };
  
  // Remove a selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  
  // Handle message reaction
  const handleReaction = async (messageId: string, reaction: string) => {
    // Check if user already reacted with this emoji
    const message = messages.find(m => m.id === messageId);
    const existingReaction = message?.reactions?.find(
      r => r.user_id === user?.id && r.reaction === reaction
    );
    
    if (existingReaction) {
      // Remove reaction
      const success = await removeReaction(messageId, reaction);
      if (success) {
        // Update local state to reflect the change
        setMessages(prev => 
          prev.map(m => {
            if (m.id === messageId) {
              return {
                ...m,
                reactions: m.reactions?.filter(r => 
                  !(r.user_id === user?.id && r.reaction === reaction)
                )
              };
            }
            return m;
          })
        );
      }
    } else {
      // Add reaction
      const success = await sendReaction(messageId, reaction);
      if (success) {
        // Update local state to reflect the change
        setMessages(prev => 
          prev.map(m => {
            if (m.id === messageId) {
              const newReaction = {
                id: `temp-${Date.now()}`,
                message_id: messageId,
                user_id: user?.id || '',
                reaction,
                created_at: new Date().toISOString(),
                user: {
                  id: user?.id || '',
                  first_name: user?.firstName || '',
                  last_name: user?.lastName || ''
                }
              };
              return {
                ...m,
                reactions: m.reactions ? [...m.reactions, newReaction] : [newReaction]
              };
            }
            return m;
          })
        );
      }
    }
  };

  // Filter available users
  const filteredUsers = availableUsers.filter(user => 
    `${user.first_name} ${user.last_name} ${user.email}`
      .toLowerCase()
      .includes(searchUsers.toLowerCase())
  );

  // Get user initials
  const getUserInitials = (user: User) => {
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  };

  // Format time
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Set up real-time message handling
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    
    // Register callback for new messages
    onNewMessage((message) => {
      // Determine if this message belongs to the currently selected conversation
      const isForCurrentConversation = selectedConversation && 
        ((message.sender_id === selectedConversation && message.recipient_id === user.id) || 
         (message.recipient_id === selectedConversation && message.sender_id === user.id));
      
      if (isForCurrentConversation) {
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          if (prev.find(m => m.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
        
        // Mark message as read if it's incoming
        if (message.sender_id === selectedConversation) {
          markAsRead(message.id);
        }
        
        setTimeout(scrollToBottom, 100);
      }
      
      // Always refresh conversations to update unread counts and latest messages
      fetchConversations();
    });
  }, [user?.id, user?.organizationId, selectedConversation, onNewMessage, markAsRead]);
  
  // Set up reaction change listener
  useEffect(() => {
    if (!user?.id || !user?.organizationId) {
      return;
    }
    
    // Register callback for reaction changes
    onReactionChange((messageId, reaction, isAdded) => {
      setMessages(prev => 
        prev.map(m => {
          if (m.id === messageId) {
            if (isAdded) {
              // Add reaction if it doesn't exist already
              const reactionExists = m.reactions?.some(r => 
                r.id === reaction.id || 
                (r.user_id === reaction.user_id && r.reaction === reaction.reaction)
              );
              
              if (reactionExists) {
                return m;
              }
              
              return {
                ...m,
                reactions: m.reactions ? [...m.reactions, reaction] : [reaction]
              };
            } else {
              // Remove reaction
              return {
                ...m,
                reactions: m.reactions?.filter(r => 
                  !(r.user_id === reaction.user_id && r.reaction === reaction.reaction)
                ) || []
              };
            }
          }
          return m;
        })
      );
    });
  }, [user?.id, user?.organizationId, onReactionChange]);
  
  // Handle auth state
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
  }, [user, authLoading, router]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch data
        await Promise.all([
          fetchConversations(),
          fetchAvailableUsers()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const ConversationSkeleton = () => (
    <div className="p-3 rounded-lg animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-muted" />
        <div className="flex-1">
          <div className="h-4 w-24 bg-muted rounded mb-2" />
          <div className="h-3 w-32 bg-muted rounded" />
        </div>
      </div>
    </div>
  );

  const MessageSkeleton = ({ align = "start" }: { align?: "start" | "end" }) => (
    <div className={`flex ${align === "end" ? "justify-end" : "justify-start"}`}>
      <div className="max-w-xs lg:max-w-md animate-pulse">
        <div className={`h-8 w-48 rounded-lg ${align === "end" ? "bg-primary/50" : "bg-muted"}`} />
        <div className={`h-3 w-16 mt-1 rounded bg-muted ${align === "end" ? "ml-auto" : ""}`} />
      </div>
    </div>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="h-[calc(100vh-4rem)] flex">
          {/* Conversations Sidebar Skeleton */}
          <div className="w-80 border-r bg-muted/10">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                <div className="h-8 w-8 bg-muted rounded animate-pulse" />
              </div>
            </div>
            <div className="p-2 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <ConversationSkeleton key={i} />
              ))}
            </div>
          </div>

          {/* Chat Area Skeleton */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b bg-background animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div>
                  <div className="h-5 w-32 bg-muted rounded mb-1" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </div>
              </div>
            </div>

            <div className="flex-1 p-4">
              <div className="space-y-4">
                <MessageSkeleton align="start" />
                <MessageSkeleton align="end" />
                <MessageSkeleton align="start" />
                <MessageSkeleton align="end" />
                <MessageSkeleton align="start" />
              </div>
            </div>

            <div className="p-4 border-t bg-background">
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
                <div className="h-10 w-10 bg-muted rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)] flex">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r bg-muted/10">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-semibold">Messages</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUserList(!showUserList)}
                >
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {showUserList && (
              <div className="space-y-2">
                <Input
                  placeholder="Search users..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  className="h-8"
                />
                <ScrollArea className="h-40">
                  <div className="space-y-1">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => startConversation(user)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Separator />
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations.map((conversation) => (
                <div
                  key={conversation.userId}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation === conversation.userId
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedConversation(conversation.userId)}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getUserInitials(conversation.user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">
                          {conversation.user.first_name} {conversation.user.last_name}
                        </p>
                        <div className="flex items-center text-center justify-center gap-1">
                          {conversation.unreadCount > 0 && (
                            <Badge variant="destructive" className="flex items-center text-center justify-center h-5 w-5 p-0 text-xs">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatTime(conversation.lastMessageTime)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conversation.lastMessage || 'Start a conversation...'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {conversations.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground">Click the users button to start chatting</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getUserInitials(
                          conversations.find(c => c.userId === selectedConversation)?.user ||
                          availableUsers.find(u => u.id === selectedConversation) ||
                          { first_name: '', last_name: '', email: '', id: '' }
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {(() => {
                          const user = conversations.find(c => c.userId === selectedConversation)?.user ||
                                     availableUsers.find(u => u.id === selectedConversation);
                          return user ? `${user.first_name} ${user.last_name}` : 'Unknown User';
                        })()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(() => {
                          const user = conversations.find(c => c.userId === selectedConversation)?.user ||
                                     availableUsers.find(u => u.id === selectedConversation);
                          return user?.email || '';
                        })()}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {loadingMessages ? (
                    <>
                      <MessageSkeleton align="start" />
                      <MessageSkeleton align="end" />
                      <MessageSkeleton align="start" />
                      <MessageSkeleton align="end" />
                      <MessageSkeleton align="start" />
                    </>
                  ) : messages.map((message) => {
                    const isOwnMessage = message.sender?.id !== selectedConversation;
                    const hasAttachments = message.attachments && message.attachments.length > 0;
                    const hasReactions = message.reactions && message.reactions.length > 0;
                    
                    // Group reactions by emoji
                    const reactionCounts: {[key: string]: {count: number, users: string[]}} = {};
                    if (hasReactions) {
                      message.reactions?.forEach(reaction => {
                        if (!reactionCounts[reaction.reaction]) {
                          reactionCounts[reaction.reaction] = { count: 0, users: [] };
                        }
                        reactionCounts[reaction.reaction].count++;
                        if (reaction.user?.id) {
                          reactionCounts[reaction.reaction].users.push(reaction.user.id);
                        }
                      });
                    }
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 group relative`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {/* Message text */}
                          <p className="text-sm">{message.message}</p>
                          
                          {/* Attachments */}
                          {hasAttachments && (
                            <div className="mt-2 space-y-2">
                              {message.attachments?.map((attachment) => {
                                const isImage = attachment.file_type.startsWith('image/');
                                const fileUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/chat-attachments/${attachment.file_path}`;
                                
                                return (
                                  <div 
                                    key={attachment.id}
                                    className="flex items-center gap-2 p-2 rounded bg-background/30"
                                  >
                                    {isImage ? (
                                      <a 
                                        href={fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="block w-full"
                                      >
                                        <img 
                                          src={fileUrl} 
                                          alt={attachment.file_name}
                                          className="max-h-40 max-w-full rounded object-contain"
                                        />
                                      </a>
                                    ) : (
                                      <>
                                        <Paperclip className="h-4 w-4" />
                                        <span className="flex-1 text-xs truncate">
                                          {attachment.file_name}
                                        </span>
                                        <a 
                                          href={fileUrl} 
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="p-1 hover:bg-background rounded"
                                        >
                                          <Download className="h-4 w-4" />
                                        </a>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* Message time and reactions */}
                          <div className={`flex items-center gap-1 mt-1 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <Clock className="h-3 w-3 opacity-70" />
                            <p className="text-xs opacity-70">
                              {formatTime(message.sent_at)}
                            </p>
                            {isOwnMessage && message.read_at && (
                              <p className="text-xs opacity-70">• Read</p>
                            )}
                          </div>
                          
                          {/* Reactions */}
                          {hasReactions && (
                            <div className={`mt-2 flex flex-wrap gap-1 ${
                              isOwnMessage ? 'justify-end' : 'justify-start'
                            }`}>
                              {Object.entries(reactionCounts).map(([emoji, data]) => {
                                const userReacted = data.users.includes(user?.id || '');
                                return (
                                  <button
                                    key={emoji}
                                    className={`text-xs py-0.5 px-1.5 rounded-full ${
                                      userReacted 
                                        ? 'bg-primary/30 text-primary-foreground' 
                                        : 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
                                    }`}
                                    onClick={() => handleReaction(message.id, emoji)}
                                  >
                                    {emoji} {data.count}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        {/* Add reaction button (shows on hover) - positioned based on message direction */}
                        <div className={`absolute bottom-0 ${isOwnMessage ? 'right-0' : 'left-0'} translate-y-full opacity-0 group-hover:opacity-100 transition-opacity pt-1 z-50`}>
                          <div className="flex items-center space-x-1 bg-background rounded-full shadow-md p-1">
                            <button 
                              className="p-1 hover:bg-muted rounded-full" 
                              onClick={() => handleReaction(message.id, '👍')}
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-muted rounded-full" 
                              onClick={() => handleReaction(message.id, '❤️')}
                            >
                              <Heart className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-muted rounded-full" 
                              onClick={() => handleReaction(message.id, '😊')}
                            >
                              <Smile className="h-3 w-3" />
                            </button>
                            <button 
                              className="p-1 hover:bg-muted rounded-full" 
                              onClick={() => handleReaction(message.id, '😔')}
                            >
                              <Frown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                  {sendingMessage && (
                    <div className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-primary/50 animate-pulse">
                        <div className="h-4 w-24 bg-primary-foreground/20 rounded" />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t bg-background">
                {/* Selected files preview */}
                {selectedFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center bg-muted rounded p-1 pr-2 text-xs">
                        <Paperclip className="h-3 w-3 mr-1" />
                        <span className="max-w-[100px] truncate">{file.name}</span>
                        <button 
                          className="ml-1 hover:text-destructive" 
                          onClick={() => removeSelectedFile(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Hidden file input */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                />
                
                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      onClick={openFilePicker}
                      disabled={sendingMessage}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && selectedConversation && (newMessage.trim() || selectedFiles.length > 0) && !sendingMessage) {
                          handleSendMessage();
                        }
                      }}
                      disabled={sendingMessage}
                      className="flex-1"
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      if (selectedConversation && (newMessage.trim() || selectedFiles.length > 0) && !sendingMessage) {
                        handleSendMessage();
                      }
                    }}
                    disabled={!newMessage.trim() && selectedFiles.length === 0 || sendingMessage}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // No conversation selected
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the sidebar to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
