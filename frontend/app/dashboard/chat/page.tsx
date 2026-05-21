'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Stethoscope,
  Shield,
  UserRound,
  Users as UsersIcon,
  X,
  Check,
  CheckCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/PageHeader';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { cn, initials } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import type { ChatUser, Conversation, Message, Role } from '@/lib/types';

const ROLE_ICON: Record<Role, any> = {
  admin: Shield,
  doctor: Stethoscope,
  receptionist: UsersIcon,
  patient: UserRound,
};

const ROLE_COLOR: Record<Role, string> = {
  admin: 'from-rose-500 to-rose-700',
  doctor: 'from-emerald-500 to-emerald-700',
  receptionist: 'from-amber-500 to-amber-700',
  patient: 'from-brand-500 to-brand-700',
};

function formatMessageDate(d: string) {
  const date = new Date(d);
  if (isToday(date)) return format(date, 'p');
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM');
}

function formatThreadDivider(d: string) {
  const date = new Date(d);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'dd MMM yyyy');
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');

  const [contactsOpen, setContactsOpen] = useState(false);
  const [contacts, setContacts] = useState<ChatUser[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    try {
      const res = await api.get('/messages/conversations');
      setConversations(res.data);
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadThread = async (otherUserId: string, silent = false) => {
    if (!silent) setLoadingThread(true);
    try {
      const res = await api.get(`/messages/with/${otherUserId}`);
      setActiveUser(res.data.user);
      setMessages(res.data.messages);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (!activeUser) return;
    const interval = setInterval(() => {
      loadThread(activeUser._id, true);
      loadConversations();
    }, 3500);
    return () => clearInterval(interval);
  }, [activeUser]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, activeUser?._id]);

  const openContacts = async () => {
    setContactsOpen(true);
    setContactsLoading(true);
    try {
      const res = await api.get('/messages/contacts');
      setContacts(res.data);
    } finally {
      setContactsLoading(false);
    }
  };

  const startChatWith = (u: ChatUser) => {
    setContactsOpen(false);
    setContactSearch('');
    loadThread(u._id);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeUser) return;
    const text = input.trim();
    setSending(true);

    const optimistic: Message = {
      _id: `tmp-${Date.now()}`,
      sender: user!._id,
      recipient: activeUser._id,
      content: text,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setInput('');

    try {
      await api.post('/messages', {
        recipient: activeUser._id,
        content: text,
      });
      await loadThread(activeUser._id, true);
      await loadConversations();
    } catch (err: any) {
      setMessages((m) => m.filter((x) => x._id !== optimistic._id));
      setInput(text);
      toast.error(err?.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = useMemo(
    () =>
      conversations.filter((c) =>
        c.user.name.toLowerCase().includes(search.toLowerCase())
      ),
    [conversations, search]
  );

  const filteredContacts = useMemo(
    () =>
      contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(contactSearch.toLowerCase())
      ),
    [contacts, contactSearch]
  );

  const groupedMessages = useMemo(() => {
    const groups: { date: string; items: Message[] }[] = [];
    messages.forEach((m) => {
      const dateKey = format(new Date(m.createdAt), 'yyyy-MM-dd');
      const last = groups[groups.length - 1];
      if (last && last.date === dateKey) {
        last.items.push(m);
      } else {
        groups.push({ date: dateKey, items: [m] });
      }
    });
    return groups;
  }, [messages]);

  return (
    <div>
      <PageHeader
        title="Messages"
        subtitle="Direct chat with your doctors, patients, and staff."
        actions={
          <button onClick={openContacts} className="btn-primary">
            <Plus className="h-4 w-4" /> New Chat
          </button>
        }
      />

      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="card flex flex-col overflow-hidden !p-0">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Search conversations"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="grid h-full place-items-center">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : filteredConvs.length === 0 ? (
              <EmptyState
                title="No conversations yet"
                description="Click 'New Chat' to start messaging."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredConvs.map((c) => {
                  const RoleIcon = ROLE_ICON[c.user.role];
                  const isActive = activeUser?._id === c.user._id;
                  return (
                    <li key={c.user._id}>
                      <button
                        onClick={() => loadThread(c.user._id)}
                        className={cn(
                          'flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-slate-50',
                          isActive && 'bg-brand-50 hover:bg-brand-50'
                        )}
                      >
                        <div
                          className={cn(
                            'relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br text-xs font-semibold text-white',
                            ROLE_COLOR[c.user.role]
                          )}
                        >
                          {initials(c.user.name)}
                          <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-white text-slate-600 ring-2 ring-white">
                            <RoleIcon className="h-2.5 w-2.5" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {c.user.name}
                            </p>
                            <span className="shrink-0 text-[11px] text-slate-400">
                              {formatMessageDate(c.lastMessageAt)}
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-slate-500">
                              {c.lastSenderIsMe && 'You: '}
                              {c.lastMessage}
                            </p>
                            {c.unreadCount > 0 && (
                              <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-600 px-1.5 text-[10px] font-semibold text-white">
                                {c.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <section className="card flex flex-col overflow-hidden !p-0">
          {!activeUser ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <p className="text-base font-semibold text-slate-900">
                  Select a conversation
                </p>
                <p className="mt-1 max-w-sm text-sm text-slate-500">
                  Pick a conversation from the left, or start a new one.
                </p>
                <button onClick={openContacts} className="btn-primary mt-4">
                  <Plus className="h-4 w-4" /> New Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                <div
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-xs font-semibold text-white',
                    ROLE_COLOR[activeUser.role]
                  )}
                >
                  {initials(activeUser.name)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{activeUser.name}</p>
                  <p className="flex items-center gap-1 text-xs capitalize text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {activeUser.role} • {activeUser.email}
                  </p>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto bg-slate-50/40 px-4 py-6"
              >
                {loadingThread ? (
                  <div className="grid h-full place-items-center">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                    <div>
                      <MessageSquare className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      Say hello to {activeUser.name.split(' ')[0]}!
                    </div>
                  </div>
                ) : (
                  groupedMessages.map((g) => (
                    <div key={g.date} className="space-y-2">
                      <div className="flex justify-center">
                        <span className="rounded-full bg-white px-3 py-0.5 text-[11px] font-medium text-slate-500 shadow-sm">
                          {formatThreadDivider(g.items[0].createdAt)}
                        </span>
                      </div>
                      {g.items.map((m, idx) => {
                        const mine = String(m.sender) === String(user!._id);
                        const prev = g.items[idx - 1];
                        const showAvatar =
                          !mine && (!prev || String(prev.sender) !== String(m.sender));
                        return (
                          <div
                            key={m._id}
                            className={cn(
                              'flex items-end gap-2',
                              mine ? 'justify-end' : 'justify-start'
                            )}
                          >
                            {!mine && (
                              <div
                                className={cn(
                                  'h-7 w-7 shrink-0 rounded-full bg-gradient-to-br text-[10px] font-semibold text-white grid place-items-center',
                                  ROLE_COLOR[activeUser.role],
                                  !showAvatar && 'invisible'
                                )}
                              >
                                {initials(activeUser.name)}
                              </div>
                            )}
                            <div
                              className={cn(
                                'group max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                                mine
                                  ? 'rounded-br-sm bg-brand-600 text-white'
                                  : 'rounded-bl-sm bg-white text-slate-800 border border-slate-100'
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">{m.content}</p>
                              <div
                                className={cn(
                                  'mt-1 flex items-center justify-end gap-1 text-[10px]',
                                  mine ? 'text-brand-100' : 'text-slate-400'
                                )}
                              >
                                {format(new Date(m.createdAt), 'p')}
                                {mine && (
                                  m.read ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={send}
                className="flex items-end gap-2 border-t border-slate-100 bg-white px-4 py-3"
              >
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send(e);
                    }
                  }}
                  placeholder={`Message ${activeUser.name.split(' ')[0]}...`}
                  className="input min-h-[42px] resize-none"
                />
                <button
                  type="submit"
                  disabled={sending || !input.trim()}
                  className="btn-primary !px-3 !py-2.5"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      <Modal
        open={contactsOpen}
        onClose={() => {
          setContactsOpen(false);
          setContactSearch('');
        }}
        title="Start a new conversation"
        description={
          user?.role === 'patient'
            ? 'Message a doctor or hospital staff.'
            : user?.role === 'doctor'
            ? 'Message a patient or staff member.'
            : 'Message any user in the system.'
        }
        size="lg"
      >
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              autoFocus
              className="input pl-9"
              placeholder="Search by name or email"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
            />
          </div>
          <div className="max-h-[50vh] overflow-y-auto">
            {contactsLoading ? (
              <div className="grid h-40 place-items-center">
                <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <EmptyState title="No matching users" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {filteredContacts.map((u) => {
                  const RoleIcon = ROLE_ICON[u.role];
                  return (
                    <li key={u._id}>
                      <button
                        onClick={() => startChatWith(u)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-slate-50"
                      >
                        <div
                          className={cn(
                            'grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br text-xs font-semibold text-white',
                            ROLE_COLOR[u.role]
                          )}
                        >
                          {initials(u.name)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-600">
                          <RoleIcon className="h-3 w-3" />
                          {u.role}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
