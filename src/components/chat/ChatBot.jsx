import React, { useEffect, useRef } from "react";

export default function ChatBot({ chatRoomId, onPostBotMessage }) {
  const welcomeSentRef = useRef(false);

  useEffect(() => {
    // Reset welcome message status when room changes
    welcomeSentRef.current = false;
  }, [chatRoomId]);

  useEffect(() => {
    // Ensure this effect runs only once per chat room and that props are ready.
    if (!chatRoomId || !onPostBotMessage || welcomeSentRef.current) {
        return;
    };

    // Post welcome message only once per room visit
    onPostBotMessage("🤖 AI Assistant is online! Use /ping to test or /trend for market data. Type /help for all commands.");
    welcomeSentRef.current = true; // Mark as sent for this room visit
    
    // This component no longer runs periodic checks to reduce noise and API calls.
    // Its main purpose is now to post the initial welcome message.

  }, [chatRoomId, onPostBotMessage]);

  // This component doesn't render anything - it just handles logic
  return null;
}