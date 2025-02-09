import { useState, useEffect, useRef } from "react";
import PropTypes from 'prop-types';
import './Home.css';
import { useAuth } from "../../../context/AuthContext";
import { saveConversation, updateConversation } from "../../../lib/firebase/chatHistory";
import { useLocation, useNavigate } from "react-router-dom";
import ChatHeader from "./chat/ChatHeader";
import MessageInput from "./chat/MessageInput";
import MessageList from "./chat/MessageList";

/**
 * Home Component
 * 
 * Main chat interface component that handles conversation display and interaction.
 * Manages message state and synchronizes with Firebase and URL state.
 * 
 * Features:
 * - Displays and manages chat messages
 * - Handles new thread creation
 * - Processes user input and AI responses
 * - Saves conversations to Firebase
 * 
 * State Management:
 * - Maintains local message state
 * - Syncs with Firebase for persistence
 * - Uses URL state for navigation and history updates
 * - Handles loading states during API calls
 * 
 * Props:
 * @param {Object[]} initialMessages - Initial messages for the conversation
 * @param {string} conversationId - ID of the current conversation
 */
function Home({ initialMessages = [], conversationId = null }) {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState(conversationId);
    const [messages, setMessages] = useState([]);
    const loadingRef = useRef(false);

    const handleNewThread = () => {
        // Clear all state first
        setMessages([]);
        setCurrentConversationId(null);
        // Force a clean navigation state
        navigate('/home', { 
            replace: true, 
            state: { 
                messages: [], 
                conversationId: null 
            } 
        });
    };

    // Single source of truth for message sorting
    const sortMessages = (msgs) => {
        return [...msgs].sort((a, b) => b.timestamp - a.timestamp);
    };

    useEffect(() => {
        if (loadingRef.current) return;
        
        const loadConversation = async () => {
            const messageData = location.state?.messages || initialMessages;
            const convId = location.state?.conversationId || conversationId;
            const isLoading = location.state?.isLoading;
            
            if (!convId) {
                setMessages([]);
                setCurrentConversationId(null);
                return;
            }

            try {
                loadingRef.current = true;
                
                // If we're in a loading state, just update the ID
                if (isLoading) {
                    setCurrentConversationId(convId);
                    setMessages([]);
                    return;
                }

                // Otherwise update both ID and messages
                setMessages(sortMessages(messageData));
                setCurrentConversationId(convId);
            } finally {
                loadingRef.current = false;
            }
        };

        loadConversation();
    }, [location.state?.conversationId, location.state?.messages, location.state?.isLoading, conversationId, initialMessages]);

    const handleSubmit = async (question) => {
        if (loading || !question.trim()) return;
        
        setLoading(true);
        try {
            const userMessage = {
                role: 'user',
                content: question,
                timestamp: Date.now()
            };

            // Add new message to existing messages
            const updatedMessages = sortMessages([...messages, userMessage]);
            setMessages(updatedMessages);

            // Format the question to include context
            const contextualQuestion = `Previous conversation: ${messages.map(m => 
                `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`
            ).join('\n')}\n\nCurrent question: ${question}`;

            const payload = { 
                messages: updatedMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                question: `${questionLead}\n\n${contextualQuestion}`
            };

            // Get AI response
            const response = await fetch(firebaseFunctionUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            
            // Create AI response message
            const assistantMessage = {
                role: 'assistant',
                content: data.answer,
                timestamp: Date.now()
            };

            // Prepare final message state
            const finalMessages = sortMessages([...updatedMessages, assistantMessage]);
            
            try {
                // Save to Firebase first
                let newId = currentConversationId;
                if (currentConversationId) {
                    await updateConversation(currentUser.uid, currentConversationId, finalMessages);
                } else {
                    newId = await saveConversation(currentUser.uid, finalMessages);
                    setCurrentConversationId(newId);
                }

                // Update local state and trigger ChatHistory refresh with navigation
                setMessages(finalMessages);
                navigate('/home', { 
                    replace: true, 
                    state: { 
                        conversationId: newId, 
                        messages: finalMessages,
                        isNewConversation: !currentConversationId // Flag to indicate new conversation
                    } 
                });
            } catch (error) {
                console.error("Error saving conversation:", error);
                setMessages(finalMessages); // Still update local state
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const questionLead = `You are a professional Dungeon Master. Answer this question with the following parameters:
    1) Answer through the lens of a Pathfinder 2e setting
    2) Try to keep the text clean and readable with line breaks
    3) Restrict the response to fit within the maximum number of tokens
    4) Don't say the words "Pathfinder 2e"( ex. any broad sweeping statements can refer to the world of Golorian)
    5) Be concise and don't speak too broadly`;

    // Replace with your Firebase Function URL
    const firebaseFunctionUrl = "https://us-central1-project-dm-helper.cloudfunctions.net/chat";

    return (
        <div className="home-container">
            <div className="chat-container">
                <div className="chat-input-area">
                    <ChatHeader onNewThread={handleNewThread} />
                    <MessageInput onSubmit={handleSubmit} loading={loading} />
                </div>
                <MessageList 
                    messages={messages}
                    conversationId={currentConversationId}
                    loading={location.state?.isLoading}
                />
            </div>
        </div>
    );
}

Home.propTypes = {
    initialMessages: PropTypes.arrayOf(PropTypes.shape({
        role: PropTypes.string.isRequired,
        content: PropTypes.string.isRequired,
        timestamp: PropTypes.number.isRequired
    })),
    conversationId: PropTypes.string
};

export default Home;
