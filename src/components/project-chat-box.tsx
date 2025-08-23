"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MessageCircle, 
  Send, 
  Paperclip, 
  Minimize2,
  Maximize2,
  X,
  Users,
  MoreHorizontal,
  Smile,
  Settings,
  File,
  Download,
  Reply,
  Clock,
  CheckCheck
} from "lucide-react";
import { ChatMessage, NewChatMessage, ProjectChat, ChatParticipant, ChatReaction } from "@/types/chat.types";
import { useSupabaseRealtimeChat } from "@/hooks/useSupabaseRealtimeChat";

interface ProjectChatBoxProps {
  projectId: string;
  projectName: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  isVisible: boolean;
  onToggleVisibility: () => void;
}

export function ProjectChatBox({
  projectId,
  projectName,
  currentUser,
  isVisible,
  onToggleVisibility
}: ProjectChatBoxProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [isTyping, setIsTyping] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Supabase realtime chat
  const { 
    isConnected,
    onNewMessage,
    onMessageUpdate, 
    onMessageDelete,
    onReactionUpdate
  } = useSupabaseRealtimeChat(projectId);

  // Set up callback handlers
  useEffect(() => {
    if (onNewMessage) {
      onNewMessage((message: ChatMessage) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.find(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      });
    }
  }, [onNewMessage]);

  useEffect(() => {
    if (onMessageUpdate) {
      onMessageUpdate((updatedMessage: ChatMessage) => {
        setMessages(prev => prev.map(msg => 
          msg.id === updatedMessage.id ? { ...msg, ...updatedMessage } : msg
        ));
      });
    }
  }, [onMessageUpdate]);

  useEffect(() => {
    if (onMessageDelete) {
      onMessageDelete((messageId: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      });
    }
  }, [onMessageDelete]);

  useEffect(() => {
    if (onReactionUpdate) {
      onReactionUpdate((messageId: string, reactions: ChatReaction[]) => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, reactions } : msg
        ));
      });
    }
  }, [onReactionUpdate]);

  // Initial data fetch when chat becomes visible
  useEffect(() => {
    if (isVisible) {
      fetchInitialData();
    }
  }, [isVisible, projectId]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      // First, ensure the user is a participant in the chat
      await fetch('/api/chat/join', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectId })
      });

      await Promise.all([
        fetchMessages(),
        fetchParticipants()
      ]);
    } catch (error) {
      console.error('Error fetching initial chat data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat?projectId=${projectId}&limit=50`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/chat/participants?projectId=${projectId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const participantsData = await response.json();
        setParticipants(participantsData);
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    setIsSending(true);
    try {
      if (attachments.length > 0) {
        // Use FormData for file uploads
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('content', newMessage);
        formData.append('messageType', 'file');
        if (replyingTo?.id) {
          formData.append('replyTo', replyingTo.id);
        }

        // Add all files to FormData
        attachments.forEach((file, index) => {
          formData.append(`file_${index}`, file);
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        if (response.ok) {
          // Message will be added via realtime subscription
          setNewMessage('');
          setAttachments([]);
          setReplyingTo(null);
        } else {
          console.error('Failed to send message with attachments');
        }
      } else {
        // Use JSON for text-only messages
        const messageData = {
          projectId,
          content: newMessage,
          messageType: 'text',
          replyTo: replyingTo?.id
        };

        const response = await fetch('/api/chat', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageData)
        });

        if (response.ok) {
          // Message will be added via realtime subscription
          setNewMessage('');
          setReplyingTo(null);
        } else {
          console.error('Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDownloadAttachment = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleReaction = async (messageId: string, reactionType: ChatReaction['type']) => {
    try {
      const response = await fetch('/api/chat/reactions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          reactionType
        })
      });

      if (!response.ok) {
        console.error('Failed to toggle reaction');
      }
      // Reaction updates will come via realtime subscription
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getInitials = (name: string): string => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getOnlineCount = (): number => {
    return participants.filter(p => p.isOnline).length;
  };

  const getReactionEmoji = (reactionType: string): string => {
    const emojiMap: Record<string, string> = {
      'like': '👍',
      'love': '❤️',
      'laugh': '😂',
      'angry': '😠',
      'sad': '😢'
    };
    return emojiMap[reactionType] || '👍';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 right-4 w-80 z-50">
      <Card className="shadow-lg border-t-4 border-t-blue-500">
        <CardHeader className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-sm">{projectName}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
                  <span>•</span>
                  <Users className="h-3 w-3" />
                  <span>{getOnlineCount()} online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-6 w-6"
                onClick={onToggleVisibility}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            {/* Participants Bar */}
            <div className="p-2 bg-gray-50 border-b">
              <div className="flex items-center gap-1 overflow-x-auto">
                {participants.map((participant) => (
                  <div key={participant.userId} className="flex items-center gap-1 shrink-0">
                    <div className="relative">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {getInitials(participant.userName || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      {participant.isOnline && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
                      )}
                    </div>
                    <span className="text-xs text-gray-600 truncate max-w-16">
                      {participant.userName.split(' ')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages Area */}
            <div className="h-80 overflow-y-auto p-3 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No messages yet</p>
                    <p className="text-xs text-gray-400">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.userId === currentUser.id;
                  const repliedMessage = message.replyTo ? messages.find(m => m.id === message.replyTo) : null;
                  
                  return (
                    <div key={message.id} className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.userName || 'Unknown')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`flex-1 max-w-[220px] ${isOwnMessage ? 'text-right' : ''}`}>
                        <div className={`inline-block p-3 rounded-lg ${
                          isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          {repliedMessage && (
                            <div className={`text-xs mb-2 p-2 rounded border-l-2 ${
                              isOwnMessage 
                                ? 'bg-blue-600 border-blue-300' 
                                : 'bg-gray-200 border-gray-400'
                            }`}>
                              <div className="font-medium">{repliedMessage.userName}</div>
                              <div className="truncate">{repliedMessage.content}</div>
                            </div>
                          )}
                          
                          <div className="text-sm">{message.content}</div>
                          
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {message.attachments.map((attachment, index) => (
                                <div key={index} className="flex items-center gap-2 text-xs">
                                  <File className="h-3 w-3" />
                                  <span className="truncate">{attachment.fileName}</span>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-4 w-4"
                                    onClick={() => handleDownloadAttachment(attachment.url, attachment.fileName)}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className={`flex items-center gap-2 mt-1 text-xs text-gray-500 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>{message.userName}</span>
                          <span>•</span>
                          <span>{formatTime(message.createdAt)}</span>
                          {message.isEdited && (
                            <>
                              <span>•</span>
                              <span className="italic">edited</span>
                            </>
                          )}
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-4 w-4">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setReplyingTo(message)}>
                                <Reply className="h-3 w-3 mr-2" />
                                Reply
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReaction(message.id, 'like')}>
                                <span className="mr-2">👍</span>
                                Like
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReaction(message.id, 'love')}>
                                <span className="mr-2">❤️</span>
                                Love
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReaction(message.id, 'laugh')}>
                                <span className="mr-2">😂</span>
                                Laugh
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReaction(message.id, 'angry')}>
                                <span className="mr-2">😠</span>
                                Angry
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReaction(message.id, 'sad')}>
                                <span className="mr-2">😢</span>
                                Sad
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {message.reactions && message.reactions.length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {/* Group reactions by type */}
                            {Object.entries(
                              message.reactions.reduce((acc, reaction) => {
                                if (!acc[reaction.type]) {
                                  acc[reaction.type] = [];
                                }
                                acc[reaction.type].push(reaction);
                                return acc;
                              }, {} as Record<string, ChatReaction[]>)
                            ).map(([type, reactions]) => (
                              <Badge 
                                key={type} 
                                variant="secondary" 
                                className="text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={() => handleReaction(message.id, type as ChatReaction['type'])}
                                title={`${reactions.map(r => r.userName).join(', ')} reacted with ${type}`}
                              >
                                {getReactionEmoji(type)} {reactions.length}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping.length > 0 && (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                  <span className="text-xs">
                    {isTyping.join(', ')} {isTyping.length === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="p-2 bg-blue-50 border-b flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Replying to {replyingTo.userName}</span>
                  <div className="text-gray-600 truncate">{replyingTo.content}</div>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={() => setReplyingTo(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Message Input */}
            <div className="p-3 border-t">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="border-0 focus-visible:ring-0 shadow-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending}
                  />
                </div>
                
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && attachments.length === 0) || isSending}
                >
                  {isSending ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Attachment Preview */}
              {attachments.length > 0 && (
                <div className="mt-2 space-y-1">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-gray-100 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <File className="h-3 w-3" />
                        <span>{file.name}</span>
                        <span className="text-gray-500">({formatFileSize(file.size)})</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-4 w-4"
                        onClick={() => removeAttachment(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileAttachment}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
