import React from 'react';
import { NotesArea } from './NotesArea';
import { BadgesArea } from './BadgesArea';
import type { ChatMessage } from '../hooks/useChatMessages';

interface ChatPanelProps {
    isChatPanelOpen: boolean;
    setIsChatPanelOpen: (open: boolean) => void;
    activeTab: 'chat' | 'notes' | 'badges';
    setActiveTab: (tab: 'chat' | 'notes' | 'badges') => void;
    chatMessages: ChatMessage[];
    chatMessagesEndRef: React.RefObject<HTMLDivElement | null>;
    isRecording: boolean;
    userRecording: boolean;
    isProcessingResponse: boolean;
    isMusicPlayerMinimized: boolean;
    earnedBadges: number;
    setShowProfile: (show: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    isChatPanelOpen,
    setIsChatPanelOpen,
    activeTab,
    setActiveTab,
    chatMessages,
    chatMessagesEndRef,
    isRecording,
    userRecording,
    isProcessingResponse,
    isMusicPlayerMinimized,
    earnedBadges,
    setShowProfile
}) => {
    return (
        <>
            {/* Chat Panel */}
            <div style={{
                position: "fixed",
                top: 0,
                left: isChatPanelOpen ? 0 : -400,
                width: 400,
                height: `calc(100vh - ${isMusicPlayerMinimized ? 60 : 100}px)`,
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(8px)",
                borderRight: "1px solid rgba(255,255,255,0.1)",
                zIndex: 2000,
                transition: "left 0.3s ease-in-out",
                display: "flex",
                flexDirection: "column"
            }}>
                {/* Chat Panel Header */}
                <div style={{
                    background: "rgba(0,0,0,0.8)",
                    color: "#fff",
                    padding: "16px 20px",
                    fontSize: 18,
                    fontWeight: 600,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                }}>
                    <span>
                        {activeTab === 'chat' && '💬 Sohbet Geçmişi'}
                        {activeTab === 'notes' && '📝 Notlarım'}
                        {activeTab === 'badges' && '🏆 Rozetlerim'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setShowProfile(true)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#a78bfa",
                                fontSize: 18,
                                cursor: "pointer",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(167, 139, 250, 0.1)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                            }}
                            title="Profil"
                        >
                            👤
                        </button>
                        <button
                            onClick={() => setIsChatPanelOpen(false)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#fff",
                                fontSize: 20,
                                cursor: "pointer",
                                padding: "4px 8px"
                            }}
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Tab Bar */}
                <div style={{
                    display: "flex",
                    background: "rgba(0,0,0,0.3)",
                    borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}>
                    <button
                        onClick={() => setActiveTab('chat')}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            background: activeTab === 'chat' ? "rgba(255,255,255,0.1)" : "transparent",
                            border: "none",
                            color: activeTab === 'chat' ? "#fff" : "rgba(255,255,255,0.7)",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            borderBottom: activeTab === 'chat' ? "2px solid #fff" : "2px solid transparent",
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== 'chat') {
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                e.currentTarget.style.color = "#fff";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== 'chat') {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                            }
                        }}
                    >
                        💬 Sohbet
                    </button>

                    <button
                        onClick={() => setActiveTab('notes')}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            background: activeTab === 'notes' ? "rgba(255,255,255,0.1)" : "transparent",
                            border: "none",
                            color: activeTab === 'notes' ? "#fff" : "rgba(255,255,255,0.7)",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            borderBottom: activeTab === 'notes' ? "2px solid #fff" : "2px solid transparent",
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== 'notes') {
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                e.currentTarget.style.color = "#fff";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== 'notes') {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                            }
                        }}
                    >
                        📝 Notlar
                    </button>

                    <button
                        onClick={() => setActiveTab('badges')}
                        style={{
                            flex: 1,
                            padding: "12px 16px",
                            background: activeTab === 'badges' ? "rgba(255,255,255,0.1)" : "transparent",
                            border: "none",
                            color: activeTab === 'badges' ? "#fff" : "rgba(255,255,255,0.7)",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            borderBottom: activeTab === 'badges' ? "2px solid #fff" : "2px solid transparent",
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== 'badges') {
                                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                                e.currentTarget.style.color = "#fff";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== 'badges') {
                                e.currentTarget.style.background = "transparent";
                                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                            }
                        }}
                    >
                        🏆 Rozetler
                    </button>
                </div>

                {/* Content Area */}
                {activeTab === 'chat' ? (
                    <>
                        {/* Chat Messages Area */}
                        <div style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                            fontSize: 14,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}>
                            {chatMessages.length === 0 ? (
                                <div style={{
                                    color: "#a78bfa",
                                    textAlign: "center",
                                    marginTop: "50%",
                                    fontStyle: "italic",
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                                }}>
                                    Henüz konuşma yok...
                                </div>
                            ) : (
                                chatMessages.map((message) => (
                                    <div
                                        key={message.id}
                                        style={{
                                            alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '80%'
                                        }}
                                    >
                                        <div style={{
                                            background: message.type === 'user'
                                                ? "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)"
                                                : "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                                            color: "#fff",
                                            padding: "10px 14px",
                                            borderRadius: 16,
                                            fontSize: 13,
                                            lineHeight: 1.4,
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                                        }}>
                                                                    <div style={{
                            fontSize: 11,
                            opacity: 0.8,
                            marginBottom: 4,
                            fontWeight: 600,
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}>
                            {message.type === 'user' ? '👤 Sen' : '🤖 AI Buddy'}
                        </div>
                        <div style={{
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                            lineHeight: 1.5,
                            wordBreak: 'break-word'
                        }}>{message.text}</div>
                                            <div style={{
                                                fontSize: 10,
                                                opacity: 0.6,
                                                marginTop: 4,
                                                textAlign: 'right',
                                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                                            }}>
                                                {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Gerçek zamanlı durum göstergesi */}
                            {(isRecording || userRecording || isProcessingResponse) && (
                                <div style={{
                                    background: "rgba(0,0,0,0.3)",
                                    margin: "8px 16px",
                                    padding: "8px 12px",
                                    borderRadius: 12,
                                    fontSize: 12,
                                    color: "#fff",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    border: "1px solid rgba(124,58,237,0.3)",
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                                }}>
                                    <div style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: isRecording || userRecording ? "#ef4444" : "#10b981",
                                        animation: "pulse 1s infinite"
                                    }} />
                                    <span>
                                        {(isRecording || userRecording) && "🎤 Kayıt yapılıyor..."}
                                        {isProcessingResponse && !(isRecording || userRecording) && "🤖 AI düşünüyor..."}
                                    </span>
                                </div>
                            )}

                            {/* Auto-scroll için referans elementi */}
                            <div ref={chatMessagesEndRef} />
                        </div>

                        {/* Chat Panel Footer */}
                        <div style={{
                            background: "rgba(0,0,0,0.2)",
                            padding: "12px 16px",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                            fontSize: 12,
                            color: "#a78bfa",
                            textAlign: "center",
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                        }}>
                            Mikrofon kullanarak AI Buddy ile konuşabilirsin
                        </div>
                    </>
                ) : activeTab === 'notes' ? (
                    /* Notes Area */
                    <NotesArea />
                ) : (
                    /* Badges Area */
                    <BadgesArea earnedBadges={earnedBadges} />
                )}
            </div>

            {/* CSS animasyonları */}
            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>

            {/* Chat Panel Toggle Button - Sadece açma butonu */}
            {!isChatPanelOpen && (
                <button
                    onClick={() => setIsChatPanelOpen(true)}
                    style={{
                        position: "fixed",
                        top: 20,
                        left: 20,
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        border: "1px solid rgba(255,255,255,0.2)",
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(8px)",
                        color: "#fff",
                        fontSize: 20,
                        cursor: "pointer",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                        zIndex: 2100,
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                        e.currentTarget.style.background = "rgba(0,0,0,0.8)";
                        e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.4)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.background = "rgba(0,0,0,0.6)";
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
                    }}
                >
                    💬
                </button>
            )}
        </>
    );
}; 