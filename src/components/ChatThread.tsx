"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser, getPublicUrl } from '@/lib/supabase';
import { Avatar } from '@/components/avatar';
import { Send, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';

type Message = { id: string; threadId: string; authorId: string; type: 'TEXT'|'CODE'|'REWARD'; content: string; createdAt: string };

function mask(text: string) {
  return text
    .replace(/[\w.-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[email masqué]')
    .replace(/\+?\d[\d\s-]{8,}/g, '[téléphone masqué]');
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes} min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ChatThread({ threadId, initialMessages, currentUserId, otherUserId }: { threadId: string; initialMessages: Message[]; currentUserId: string; otherUserId: string }) {
  const [messages, setMessages] = useState<Message[]>(() => initialMessages);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [userInfo, setUserInfo] = useState<{ id: string; displayName?: string | null; avatar?: string | null } | null>(null);
  const [otherUserInfo, setOtherUserInfo] = useState<{ id: string; displayName?: string | null; avatar?: string | null } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = useMemo(() => supabaseBrowser(), []);

  // Composant pour formater le temps et éviter les erreurs d'hydratation
  const MessageTime = ({ createdAt }: { createdAt: string }) => {
    const [timeStr, setTimeStr] = useState('');
    useEffect(() => {
      setTimeStr(formatTime(new Date(createdAt)));
    }, [createdAt]);
    return <span className="text-xs text-muted-foreground px-1">{timeStr || '...'}</span>;
  };

  // Charger les informations de l'utilisateur actuel
  useEffect(() => {
    async function loadUserInfo() {
      try {
        const res = await fetch('/api/user/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUserInfo({ id: data.id, displayName: data.displayName, avatar: data.avatar });
        }
      } catch (e) {
        console.error('Error loading user info:', e);
      }
    }
    loadUserInfo();
  }, []);

  // Charger les informations de l'autre utilisateur
  useEffect(() => {
    async function loadOtherUserInfo() {
      try {
        // Récupérer les infos de l'autre utilisateur
        const userRes = await fetch(`/api/users/${otherUserId}`, { credentials: 'include' });
        if (userRes.ok) {
          const userData = await userRes.json();
          setOtherUserInfo({ id: otherUserId, displayName: userData.displayName, avatar: userData.avatar });
        }
      } catch (e) {
        console.error('Error loading other user info:', e);
      }
    }
    if (otherUserId) {
      loadOtherUserInfo();
    }
  }, [otherUserId]);

  useEffect(() => {
    // Postgres changes subscription on messages for this thread
    const channel = supabase.channel(`realtime:messages:thread-${threadId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Message', filter: `threadId=eq.${threadId}` }, (payload: any) => {
        const row = payload.new as Message;
        setMessages(prev => [...prev, row]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, threadId]);

  useEffect(() => {
    // Auto-scroll vers le bas quand de nouveaux messages arrivent
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    
    setSending(true);
    try {
      await fetch(`/api/threads/${threadId}/messages`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ type: 'TEXT', content: trimmed }) 
      });
      setContent('');
      // Focus sur l'input après envoi
      inputRef.current?.focus();
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const isOwnMessage = (message: Message) => message.authorId === currentUserId;

  return (
    <Card className="flex flex-col h-[600px] sm:h-[700px] shadow-lg">
      <CardHeader className="border-b pb-3">
        <h2 className="text-lg font-semibold">Messages</h2>
      </CardHeader>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-muted/20 to-background">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Aucun message. Commencez la conversation !</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message);
            const showAvatar = index === 0 || messages[index - 1].authorId !== message.authorId;
            const showTime = index === messages.length - 1 || 
              new Date(message.createdAt).getTime() - new Date(messages[index + 1].createdAt).getTime() > 300000; // 5 minutes
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                {showAvatar && (
                  <div className={`flex-shrink-0 ${isOwn ? 'ml-2' : 'mr-2'}`}>
                    <Avatar
                      src={isOwn ? userInfo?.avatar : otherUserInfo?.avatar}
                      alt={isOwn ? userInfo?.displayName || 'Vous' : otherUserInfo?.displayName || 'Utilisateur'}
                      name={isOwn ? userInfo?.displayName || 'Vous' : otherUserInfo?.displayName || 'Utilisateur'}
                      size="sm"
                      className="ring-2 ring-background"
                    />
                  </div>
                )}
                {!showAvatar && <div className="w-8 flex-shrink-0" />}
                <div className={`flex flex-col gap-1 max-w-[75%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  {showAvatar && (
                    <span className="text-xs font-medium text-muted-foreground px-1">
                      {isOwn ? 'Vous' : (otherUserInfo?.displayName || 'Utilisateur')}
                    </span>
                  )}
                  {message.type === 'REWARD' ? (
                    <Alert variant="default" className="my-4 bg-green-50 border-green-200">
                      <Gift className="h-5 w-5 text-green-600" />
                      <AlertTitle className="font-bold text-green-700">Récompense débloquée !</AlertTitle>
                      <AlertDescription className="whitespace-pre-wrap text-green-900">
                        {(() => {
                          // Extraire l'URL du média si présente
                          const mediaUrlMatch = message.content.match(/REWARD_MEDIA_URL:(.+)$/);
                          const mediaUrl = mediaUrlMatch ? mediaUrlMatch[1] : null;
                          const textContent = message.content.replace(/REWARD_MEDIA_URL:.+$/, '').trim();
                          
                          return (
                            <div className="space-y-2">
                              {textContent && <p>{textContent}</p>}
                              {mediaUrl && (
                                <div className="mt-2 relative">
                                  <Image
                                    src={getPublicUrl(mediaUrl, 'proofs') || ''}
                                    alt="Média de la récompense"
                                    width={300}
                                    height={300}
                                    className="rounded-md object-cover max-w-full"
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-br-sm'
                          : 'bg-card border border-border rounded-bl-sm'
                      }`}
                    >
                      {message.type === 'CODE' ? (
                        <CodeMasked content={message.content} />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap break-words">{mask(message.content)}</p>
                      )}
                    </div>
                  )}
                  {showTime && (
                    <MessageTime createdAt={message.createdAt} />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4 bg-background">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tapez votre message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] max-h-[120px] overflow-y-auto"
            style={{ 
              height: 'auto',
              minHeight: '44px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
            }}
          />
          <Button
            onClick={send}
            disabled={!content.trim() || sending}
            className="h-11 w-11 rounded-lg shrink-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Appuyez sur Entrée pour envoyer, Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </Card>
  );
}

function CodeMasked({ content }: { content: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      {!show ? (
        <button
          onClick={() => setShow(true)}
          className="text-sm underline hover:no-underline transition-all"
        >
          Code masqué (révéler)
        </button>
      ) : (
        <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto">
          <code>{content}</code>
        </pre>
      )}
    </div>
  );
}
