
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Message, User, TrustScoreLog, ModerationLog, Poll, PollVote } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { MessageModerator } from "./MessageModerator";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Users, Settings, Send, Bot, MessageSquare, Paperclip, File, X, Loader2, ArrowDown, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import LiveStockTicker from "./LiveStockTicker";
import MeetingControls from "./MeetingControls";
import TrustScoreBadge from "../ui/TrustScoreBadge";
import MessageContent from './MessageContent';
import CreatePollModal from '../polls/CreatePollModal';

// New imports for enhanced sidebar
import CommunitySentimentPoll from './CommunitySentimentPoll';
import TomorrowsPick from './TomorrowsPick';
import AdvisorRecommendedStocks from './AdvisorRecommendedStocks';

// New import for AdDisplay
import AdDisplay from "@/components/dashboard/AdDisplay";


// Sample users for fallback
const sampleUsers = [
  { id: 'user1', display_name: 'TraderJoe', profile_color: '#3B82F6', email: 'joe@example.com', trust_score: 85 },
  { id: 'user2', display_name: 'CryptoKing', profile_color: '#8B5CF6', email: 'king@example.com', trust_score: 45 },
  { id: 'user3', display_name: 'StockSensei', profile_color: '#10B981', email: 'sensei@example.com', trust_score: 15 }];


// Sample messages for fallback
const sampleMessages = [
  { id: 'msg1', chat_room_id: '1', user_id: 'user1', created_by: 'joe@example.com', content: 'RELIANCE looks strong today!', created_date: new Date(Date.now() - 5 * 60 * 1000) },
  { id: 'msg2', chat_room_id: '1', user_id: 'user2', created_by: 'king@example.com', content: 'Agreed, volume is picking up.', created_date: new Date(Date.now() - 4 * 60 * 1000) },
  { id: 'msg3', chat_room_id: '1', is_bot: true, content: '🤖 RELIANCE is up 2.3% today with strong community sentiment at 65% Buy! Volume surge indicates institutional interest. 📈', created_date: new Date(Date.now() - 3 * 60 * 1000), message_type: 'bot_insight' },
  { id: 'msg4', chat_room_id: '1', user_id: 'user3', created_by: 'sensei@example.com', content: 'Thanks bot! What are the target levels?', created_date: new Date(Date.now() - 2 * 60 * 1000) }];


// Trust Score Helper
const updateTrustScore = async (user, amount, reason, relatedEntityId = null) => {
  if (!user || !user.id) return;
  const currentScore = user.trust_score !== undefined ? user.trust_score : 50;
  const newScore = Math.max(0, Math.min(100, currentScore + amount));
  if (newScore === currentScore) return;

  try {
    await User.update(user.id, { trust_score: newScore });
    await TrustScoreLog.create({ user_id: user.id, change_amount: amount, reason, new_score: newScore, related_entity_id: relatedEntityId });
  } catch (error) {
    console.error("Failed to update trust score:", error);
  }
};

export default function ChatInterface({ room, user, onBack, onUpdateRoom, subscription }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState({});
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [priceData, setPriceData] = useState(null);
  const [showNewMessageBar, setShowNewMessageBar] = useState(false);
  const messagesEndRef = useRef(null);
  const chatFeedRef = useRef(null);
  const isMountedRef = useRef(true);
  const chatInitializedRef = useRef(false);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const [moderationWarning, setModerationWarning] = useState(null);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [pollRefreshTrigger, setPollRefreshTrigger] = useState(0); // New state to trigger poll refresh
  const [latestPollStockSymbol, setLatestPollStockSymbol] = useState(room?.stock_symbol || ""); // NEW: Track the stock symbol

  const isUserAtBottom = useCallback(() => {
    const feed = chatFeedRef.current;
    if (!feed) return true;
    return feed.scrollHeight - feed.scrollTop <= feed.clientHeight + 50;
  }, []);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
    setShowNewMessageBar(false);
  }, []);

  const loadInitialData = useCallback(async () => {
    if (!room?.id || !isMountedRef.current) return;
    setIsLoading(true);

    try {
      // Fetch messages
      const fetchedMessages = await Message.filter({ chat_room_id: room.id }, 'created_date').catch(() => []);
      if (!isMountedRef.current) return;
      const finalMessages = fetchedMessages.length > 0 ? fetchedMessages : sampleMessages.filter((m) => m.chat_room_id === room.id);
      setMessages(finalMessages);

      // Fetch users
      const userEmails = [...new Set(finalMessages.filter((m) => !m.is_bot && m.created_by).map((m) => m.created_by))];
      if (userEmails.length > 0) {
        const fetchedUsers = await User.list().catch(() => []);
        if (!isMountedRef.current) return;
        const usersMap = (fetchedUsers.length > 0 ? fetchedUsers : sampleUsers).reduce((acc, u) => {
          acc[u.email || u.id] = u;
          return acc;
        }, {});
        setUsers(usersMap);
      }
      
      // Removed poll loading logic as it's now handled by CommunitySentimentPoll component
      
    } catch (error) {
      if (!isMountedRef.current) return;
      console.error("Error loading initial data:", error);
      setMessages(sampleMessages.filter((m) => m.chat_room_id === room.id));
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [room?.id]); // Removed room?.stock_symbol, user from dependencies as poll logic is gone

  // Chatbot functionality
  const postBotMessage = useCallback(async (content) => {
    if (!room?.id || !isMountedRef.current) return;

    const botMessage = {
      id: 'bot_' + Date.now(),
      chat_room_id: room.id,
      content,
      is_bot: true,
      message_type: 'bot_insight',
      created_date: new Date()
    };

    // Add bot message immediately to UI
    setMessages((prev) => [...prev, botMessage]);

    // Try to save to backend
    try {
      await Message.create({
        chat_room_id: room.id,
        content,
        is_bot: true,
        message_type: 'bot_insight'
      });
    } catch (error) {
      console.error("Failed to save bot message to backend:", error);
    }
  }, [room?.id]);

  useEffect(() => {
    isMountedRef.current = true;
    loadInitialData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadInitialData]);

  useEffect(() => {
    if (isLoading) return;

    const wasAtBottom = isUserAtBottom();

    setTimeout(() => {
      if (wasAtBottom) {
        scrollToBottom('auto');
      } else {
        if (messages.length > 0) {
          setShowNewMessageBar(true);
        }
      }
    }, 50);

  }, [messages, isLoading, isUserAtBottom, scrollToBottom]);

  useEffect(() => {
    if (!isLoading && !chatInitializedRef.current && room?.id) {
      chatInitializedRef.current = true;
      setTimeout(() => {
        postBotMessage("🤖 AI Assistant is online! Use /ping to test or /trend for market data. Type /help for all commands.");
      }, 1000);
    }
  }, [isLoading, room?.id, postBotMessage]);

  const handleScroll = () => {
    if (isUserAtBottom()) {
      setShowNewMessageBar(false);
    } else if (messages.length > 0) {
      setShowNewMessageBar(true);
    }
  };

  // Removed handleVote function as poll voting is now handled within CommunitySentimentPoll

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !file || !user || isSending) return;

    setIsSending(true);

    if (user.trust_score !== undefined && user.trust_score < 20) {
      alert("Your trust score is too low. You are currently muted and cannot send messages.");
      setIsSending(false);
      return;
    }

    const content = newMessage.trim();

    if (file) {
      setIsUploading(true);
      const tempMessageId = Date.now().toString();
      const optimisticMessage = {
        id: tempMessageId,
        chat_room_id: room.id,
        content: content || file.name,
        user_id: user.id,
        message_type: file.type.startsWith('image/') ? 'image' : 'file',
        file_name: file.name,
        file_url: URL.createObjectURL(file),
        created_by: user.email,
        created_date: new Date(),
        isOptimistic: true
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");
      setFile(null);

      try {
        const { file_url } = await UploadFile({ file });

        const fileMessageData = {
          chat_room_id: room.id,
          content: content || file.name,
          user_id: user.id,
          message_type: file.type.startsWith('image/') ? 'image' : 'file',
          file_url,
          file_name: file.name,
          created_by: user.email
        };

        const createdMessage = await Message.create(fileMessageData);
        setMessages((prev) => prev.map((msg) => msg.id === tempMessageId ? createdMessage : msg));
        await updateTrustScore(user, 0.2, "Shared a file in chat", createdMessage.id);
      } catch (error) {
        console.error("File upload failed", error);
        alert("Failed to upload file. Please try again.");
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessageId));
      } finally {
        setIsUploading(false);
        setIsSending(false);
      }
      return;
    }

    const moderationResult = MessageModerator.moderateMessage(content);

    if (moderationResult.isViolation) {
      const violationMessage = MessageModerator.getViolationMessage(moderationResult.violations);
      setModerationWarning(violationMessage);

      try {
        await ModerationLog.create({
          user_id: user.id,
          chat_room_id: room.id,
          message_content: content,
          violation_type: moderationResult.violations[0].type,
          severity: moderationResult.violations[0].severity,
          action_taken: 'blocked'
        });

        const scoreDeduction = moderationResult.violations[0].severity === 'high' ? -10 : -5;
        await updateTrustScore(user, scoreDeduction, `Message blocked: ${moderationResult.violations[0].reason}`, null);
      } catch (error) {
        console.error("Failed to log moderation violation:", error);
      }

      setTimeout(() => setModerationWarning(null), 5000);
      setNewMessage("");
      setIsSending(false);
      return;
    }

    if (content.startsWith('/')) {
      const [command] = content.split(' ');
      switch (command) {
        case '/ping':
          postBotMessage('🤖 Bot is online and ready! ✅');
          break;
        case '/trend':
          if (priceData) {
            // Removed pollData dependent sentiment as it's now handled by CommunitySentimentPoll
            const trendMessage = `📊 ${priceData.symbol} is ₹${priceData.current_price.toFixed(2)}, ${priceData.change_percent >= 0 ? '📈' : '📉'} ${Math.abs(priceData.change_percent)}% today.`;
            postBotMessage(trendMessage);
          } else {
            postBotMessage('❌ Unable to fetch stock trend data at the moment. Please try later.');
          }
          break;
        case '/help':
          postBotMessage('🤖 Available commands:\n/ping - Check bot status\n/trend - Get current stock trend\n/rules - View community guidelines');
          break;
        case '/rules':
          postBotMessage('📋 Community Guidelines:\n• Keep discussions respectful and professional\n• No personal contact sharing (WhatsApp/Telegram)\n• No scam links or fraudulent content\n• Focus on legitimate trading strategies\n• Maintain a positive trading environment');
          break;
        default:
          postBotMessage(`❓ Unknown command: ${command}. Try /help for available commands.`);
      }
      setNewMessage("");
      setIsSending(false);
      return;
    }

    if (user.trust_score !== undefined && user.trust_score < 40) {
      setModerationWarning("⚠️ Your trust score is low. Messages may be reviewed by moderators.");
      setTimeout(() => setModerationWarning(null), 3000);
    }

    const tempId = Date.now().toString();
    const messageData = {
      id: tempId,
      chat_room_id: room.id,
      content: content,
      user_id: user.id,
      message_type: 'text',
      created_by: user.email,
      created_date: new Date()
    };

    setMessages((prev) => [...prev, messageData]);
    setNewMessage("");

    try {
      const createdMessage = await Message.create({
        chat_room_id: room.id,
        content: content,
        user_id: user.id,
        message_type: 'text',
        created_by: user.email
      });

      setMessages((prev) => prev.map((msg) => msg.id === tempId ? createdMessage : msg));
      await updateTrustScore(user, 0.1, "Sent a valid message in chat", createdMessage.id);
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Unsupported file type. Please upload a PNG, JPEG, or PDF.");
        e.target.value = null;
        setFile(null);
        return;
      }
      const maxSizeMB = 5;
      if (selectedFile.size > maxSizeMB * 1024 * 1024) {
        alert(`File size exceeds ${maxSizeMB}MB limit.`);
        e.target.value = null;
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const getUserForMessage = (message) => {
    if (message.is_bot) {
      return { display_name: 'AI Assistant', profile_color: '#6B7280', isBot: true };
    }
    const msgUser = users[message.created_by] || { display_name: 'Unknown', profile_color: '#64748B' };
    return msgUser;
  };

  // Removed refreshPolls function and its useEffect for periodic refresh
  // as poll functionality is now encapsulated in CommunitySentimentPoll

  const handleCreatePoll = async (pollData) => {
    if (!user) {
      toast.error("Please log in to create a poll!");
      return;
    }
    
    console.log("ChatInterface: Creating poll with data:", pollData); // Debug log
    
    try {
      // Create the poll with chatroom context
      const newPoll = await Poll.create({
        ...pollData,
        chatroom_id: room.id,
        creation_source: "chatroom",
        is_active: true, // Explicitly ensure it's active
        created_by_admin: user.app_role === 'admin' || user.app_role === 'super_admin',
        created_by_role: user.app_role
      });
      
      console.log("ChatInterface: Poll created successfully:", newPoll); // Debug log
      
      toast.success("Poll created successfully!");
      setShowCreatePollModal(false);
      
      // Update the latest poll stock symbol so CommunitySentimentPoll can fetch it
      setLatestPollStockSymbol(newPoll.stock_symbol);
      
      // Post a bot message about the new poll
      await postBotMessage(`📊 New poll created: "${newPoll.title}". Cast your vote in the sidebar!`);
      
      // Small delay to ensure poll is fully persisted
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Trigger poll refresh in CommunitySentimentPoll component
      console.log("ChatInterface: Triggering poll refresh with stock symbol:", newPoll.stock_symbol); // Debug log
      setPollRefreshTrigger(prev => prev + 1);
      
      // Reload messages to show the bot message
      await loadInitialData();
      
      // Notify parent to update room data if needed
      if (onUpdateRoom) {
        onUpdateRoom();
      }
    } catch (error) {
      console.error("ChatInterface: Error creating poll:", error);
      toast.error("Failed to create poll. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Live Stock Ticker & Meeting Controls */}
        <div className="p-4 pb-2 flex-shrink-0 space-y-2">
          <LiveStockTicker stockSymbol={latestPollStockSymbol || room.stock_symbol} onPriceUpdate={setPriceData} />
          <MeetingControls
            chatRoomId={room.id}
            stockSymbol={latestPollStockSymbol || room.stock_symbol}
            onMeetingStart={(meeting) => postBotMessage(`Meeting started! Join here: ${meeting.meeting_url}`)}
            onMeetingEnd={() => postBotMessage('Meeting has ended.')} />
        </div>

        <div className="flex-1 flex gap-4 px-4 pb-4 min-h-0">
          {/* Main Chat Area */}
          <Card className="flex-1 flex flex-col shadow-lg border-0 bg-white">
            {/* Chat Header */}
            <CardHeader className="flex-shrink-0 flex flex-row items-center gap-4 border-b bg-white">
              <Button
                size="icon"
                onClick={onBack}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-10 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">{room.name}</h1>
                <p className="text-xs md:text-sm text-slate-600 truncate">{room.description}</p>
              </div>
              <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  <Users className="w-3 h-3 mr-1" />
                  {room.participant_count || 0} members
                </Badge>
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={() => setShowCreatePollModal(true)}
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            {moderationWarning &&
              <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {moderationWarning}
              </div>
            }

            {/* Chat Messages - Scrollable with Manual Control */}
            <div className="relative flex-1 min-h-0">
              <CardContent
                ref={chatFeedRef}
                onScroll={handleScroll}
                className="overflow-y-auto p-4 md:p-6 space-y-4 h-full">

                {isLoading ?
                  <div className="space-y-4">
                    {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-2/3" />)}
                  </div> :
                  messages.length === 0 ?
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <MessageSquare className="w-12 h-12 mb-4" />
                      <h3 className="text-lg font-semibold">Welcome to {room.name}!</h3>
                      <p className="text-center">Start the discussion or use /trend to see market data.</p>
                    </div> :

                    <>
                      {/* Ad Display in Chat Rooms */}
                      {messages.length > 5 && messages.length % 10 === 0 && (
                        <div className="flex justify-center my-4">
                          <AdDisplay 
                            placement="chatrooms" 
                            userContext={{ stock_symbol: room.stock_symbol }}
                            className="max-w-sm"
                          />
                        </div>
                      )}

                      {messages.map((msg) => {
                        const msgUser = getUserForMessage(msg);
                        const isCurrentUser = msg.created_by === user?.email && !msg.is_bot;
                        const isBot = msg.is_bot;

                        return (
                          <div key={msg.id} className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                            {!isCurrentUser &&
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                {isBot ?
                                  <AvatarFallback className="bg-slate-600">
                                    <Bot className="w-4 h-4 text-white" />
                                  </AvatarFallback> :

                                  <AvatarFallback style={{ backgroundColor: msgUser.profile_color, color: 'white' }}>
                                    {msgUser.display_name?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                }
                              </Avatar>
                            }
                            <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                              isCurrentUser ? 'bg-blue-600 text-white rounded-br-none' :
                                isBot ? 'bg-slate-100 text-slate-800 rounded-bl-none border-l-4 border-blue-500' :
                                  'bg-slate-100 text-slate-800 rounded-bl-none'}`
                            }>
                              {!isCurrentUser &&
                                <div className={`text-xs font-bold mb-1 flex items-center gap-1 ${
                                  isBot ? 'text-blue-600' : ''}`
                                } style={!isBot ? { color: msgUser.profile_color } : {}}>
                                  <span>{msgUser.display_name}</span>
                                  {!isBot &&
                                    <TrustScoreBadge score={msgUser.trust_score} showScore={false} size="xs" />
                                  }
                                </div>
                              }
                              <MessageContent message={msg} />
                              <p className={`text-xs mt-1 ${
                                isCurrentUser ? 'text-blue-200' : 'text-slate-400'}`
                              }>
                                {formatDistanceToNow(new Date(msg.created_date), { addSuffix: true })}
                              </p>
                            </div>
                          </div>);
                      })}
                      <div ref={messagesEndRef} className="h-1" />
                    </>
                }
              </CardContent>

              {/* New Message Bar */}
              {showNewMessageBar &&
                <div
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">

                  <Button
                    onClick={() => scrollToBottom('smooth')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg animate-bounce">

                    <ArrowDown className="w-4 h-4 mr-2" />
                    New messages
                  </Button>
                </div>
              }
            </div>

            {/* Message Input */}
            <CardFooter className="flex-shrink-0 border-t p-4 bg-white flex flex-col">
              {file &&
                <div className="flex items-center gap-2 p-2 mb-2 bg-slate-100 border border-slate-200 rounded-lg w-full">
                  {file.type.startsWith('image/') ?
                    <img src={URL.createObjectURL(file)} alt="preview" className="h-8 w-8 object-cover rounded" /> :

                    <File className="w-5 h-5 text-slate-500" />
                  }
                  <span className="text-sm text-slate-700 truncate flex-1">{file.name}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              }
              <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0"
                  disabled={!user || user.trust_score !== undefined && user.trust_score < 20 || isUploading || isSending}>

                  <Paperclip className="h-4 w-4" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/png, image/jpeg, application/pdf" />

                <Input
                  placeholder={
                    !user ? "Please log in to chat..." :
                      user.trust_score !== undefined && user.trust_score < 20 ? "Account muted due to low trust score..." :
                        "Type your message or /command..."
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                  disabled={!user || user.trust_score !== undefined && user.trust_score < 20 || isUploading || isSending} />

                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() && !file || !user || user.trust_score !== undefined && user.trust_score < 20 || isUploading || isSending}
                  className="flex-shrink-0">

                  {isUploading || isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
              {user && user.trust_score < 20 &&
                <p className="text-xs text-red-600 mt-1">
                  Your account is muted due to low trust score. Contact support to resolve.
                </p>
              }
            </CardFooter>
          </Card>

          {/* Right Sidebar - STICKY with proper scrolling */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="h-full flex flex-col space-y-4 overflow-y-auto">
              {/* Community Sentiment Poll - Use latestPollStockSymbol if room doesn't have one */}
              <CommunitySentimentPoll 
                stockSymbol={latestPollStockSymbol || room.stock_symbol} 
                user={user}
                refreshTrigger={pollRefreshTrigger}
              />
              
              {/* Tomorrow's Pick */}
              <TomorrowsPick />
              
              {/* Advisor Recommended Stocks */}
              <AdvisorRecommendedStocks />
            </div>
          </div>
        </div>

        {/* Mobile Sidebar - Bottom Sheet */}
        <div className="lg:hidden">
          {/* Community Sentiment Poll */}
          <div className="p-4">
            <CommunitySentimentPoll 
              stockSymbol={latestPollStockSymbol || room.stock_symbol} 
              user={user}
              refreshTrigger={pollRefreshTrigger}
            />
          </div>
          
          {/* Tomorrow's Pick */}
          <div className="p-4">
            <TomorrowsPick />
          </div>
          
          {/* Advisor Recommended Stocks */}
          <div className="p-4">
            <AdvisorRecommendedStocks />
          </div>
        </div>
      </div>
      
      {/* Use the refactored CreatePollModal */}
      <CreatePollModal
        open={showCreatePollModal}
        onClose={() => setShowCreatePollModal(false)}
        room={room}
        user={user}
        onCreatePoll={handleCreatePoll}
      />
    </div>
  );
}
