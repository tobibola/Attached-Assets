import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowUp,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  FolderOpen,
  Gauge,
  Headphones,
  Loader2,
  Menu,
  Mic,
  MoreHorizontal,
  Moon,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  X,
  Volume2,
  WandSparkles,
  Zap,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  getGetSettingsQueryKey,
  getListMemoryQueryKey,
  getListMessagesQueryKey,
  getListStoriesQueryKey,
  useClearMemory,
  useCreateStory,
  useDeleteStory,
  useGetSettings,
  useListMemory,
  useListMessages,
  useListStories,
  useSendMessage,
  useUpdateSettings,
  useUpdateStory,
} from '@workspace/api-client-react';
import type {
  Message,
  ProviderSetting,
  SettingsTheme,
  Story,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';
import './index.css';

const queryClient = new QueryClient();
const COLORS = ['#e87551', '#73a99d', '#c5a35f', '#8b8fc7', '#db8ba0'];

function useTheme(theme: SettingsTheme | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);
    root.classList.toggle('dark', isDark);
  }, [theme]);
}

function Shell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const settings = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  useTheme(settings.data?.theme);

  const nav = [
    { href: '/', label: 'Conversar', icon: Sparkles },
    { href: '/historias', label: 'Histórias', icon: BookOpen },
    { href: '/memoria', label: 'Memória', icon: WandSparkles },
    { href: '/configuracoes', label: 'Configurações', icon: Settings2 },
  ];

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`} data-testid="sidebar-navigation">
        <div className="brand-mark">
          <div className="brand-glyph" aria-hidden="true"><span /></div>
          <div><strong>MIAR</strong><small>AI workspace</small></div>
        </div>
        <div className="sidebar-kicker">Seu espaço</div>
        <nav className="nav-stack" aria-label="Navegação principal">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              href={href}
              key={href}
              className={`nav-link ${location === href ? 'nav-link-active' : ''}`}
              data-testid={`link-nav-${label.toLowerCase()}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>
              {href === '/' && <span className="nav-pulse" />}
            </Link>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="privacy-note">
          <ShieldCheck size={16} />
          <div><strong>Seu contexto é seu.</strong><span>Privacidade por padrão.</span></div>
        </div>
        <button className="sidebar-help" data-testid="button-help" onClick={() => setLocation('/configuracoes')}>
          <CircleHelp size={16} /> Como funciona
        </button>
      </aside>
      <div className="main-column">
        <header className="mobile-header">
          <button className="icon-button" aria-label="Abrir menu" data-testid="button-open-menu" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="mobile-brand"><div className="brand-glyph"><span /></div><strong>MIAR</strong></div>
          <Link href="/configuracoes" className="icon-button" data-testid="link-mobile-settings"><Settings2 size={19} /></Link>
        </header>
        <main className="page-shell">{children}</main>
      </div>
      {mobileOpen && <button className="mobile-scrim" aria-label="Fechar menu" data-testid="button-close-menu" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}

function PageIntro({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return <div className="page-intro">
    <div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{detail}</p></div>
    {action}
  </div>;
}

function LoadingBlock({ label = 'Carregando seu espaço' }: { label?: string }) {
  return <div className="loading-block" data-testid="status-loading"><div className="skeleton-line wide" /><div className="skeleton-line medium" /><div className="loading-label"><Loader2 size={14} className="spin" /> {label}</div></div>;
}

function ErrorBlock({ onRetry, label = 'Não foi possível carregar este espaço.' }: { onRetry: () => void; label?: string }) {
  return <div className="empty-state error-state" data-testid="status-error"><div className="empty-icon"><Zap size={21} /></div><h2>Algo saiu do eixo</h2><p>{label}</p><button className="button secondary" onClick={onRetry} data-testid="button-retry">Tentar de novo</button></div>;
}

function StoryPicker({ stories, selected, onSelect }: { stories: Story[]; selected?: string; onSelect: (id: string) => void }) {
  const current = stories.find((story) => story.id === selected) ?? stories[0];
  return <div className="story-picker-wrap">
    <div className="picker-label">História ativa</div>
    <button className="story-picker" data-testid="button-story-picker">
      <span className="story-dot" style={{ background: current?.color ?? COLORS[0] }} />
      <span className="picker-name">{current?.name ?? 'Escolha uma história'}</span><ChevronDown size={15} />
    </button>
    <div className="story-picker-menu" aria-label="Selecionar história">
      {stories.filter((story) => !story.archived).map((story) => <button key={story.id} className={`picker-option ${story.id === current?.id ? 'selected' : ''}`} data-testid={`button-select-story-${story.id}`} onClick={() => onSelect(story.id)}><span className="story-dot" style={{ background: story.color }} />{story.name}{story.id === current?.id && <Check size={14} />}</button>)}
    </div>
  </div>;
}

function Home() {
  const stories = useListStories({ query: { queryKey: getListStoriesQueryKey() } });
  const [activeId, setActiveId] = useState<string>();
  const activeStory = stories.data?.find((story) => story.id === activeId) ?? stories.data?.find((story) => !story.archived);
  const messages = useListMessages(activeStory?.id ?? '', { query: { queryKey: getListMessagesQueryKey(activeStory?.id ?? ''), enabled: Boolean(activeStory?.id) } });
  const sendMessage = useSendMessage();
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [speaking, setSpeaking] = useState<string>();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.data?.length]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || !activeStory || sendMessage.isPending) return;
    const text = draft.trim();
    setDraft('');
    sendMessage.mutate({ storyId: activeStory.id, data: { text, attachments: attachments.length ? attachments : undefined } }, {
      onSuccess: () => {
        setAttachments([]);
        qc.invalidateQueries({ queryKey: getListMessagesQueryKey(activeStory.id) });
      },
      onError: () => setDraft(text),
    });
  };
  const speak = (message: Message) => {
    if (!('speechSynthesis' in window)) return;
    if (speaking === message.id) { window.speechSynthesis.cancel(); setSpeaking(undefined); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.text);
    utterance.lang = 'pt-BR';
    utterance.onend = () => setSpeaking(undefined);
    window.speechSynthesis.speak(utterance);
    setSpeaking(message.id);
  };

  if (stories.isLoading) return <LoadingBlock />;
  if (stories.isError) return <ErrorBlock onRetry={() => stories.refetch()} />;
  if (!stories.data?.length || !activeStory) return <EmptyStories />;
  const list = messages.data ?? [];

  return <div className="conversation-page">
    <div className="conversation-topbar">
      <StoryPicker stories={stories.data} selected={activeStory.id} onSelect={setActiveId} />
      <div className="topbar-actions"><span className="saved-indicator"><span /> contexto sincronizado</span><button className="icon-button" data-testid="button-conversation-more" aria-label="Mais opções"><MoreHorizontal size={19} /></button></div>
    </div>
    <div className="conversation-scroll" data-testid="conversation-messages">
      <div className="conversation-heading">
        <div className="date-chip">Hoje</div>
        <h1>{activeStory.name}</h1>
        <p>{activeStory.context || 'Uma conversa sem pressa, com espaço para o que importa.'}</p>
        <div className="context-rule"><span /> contexto carregado <span /></div>
      </div>
      {messages.isLoading ? <LoadingBlock label="Reabrindo a conversa" /> : messages.isError ? <ErrorBlock onRetry={() => messages.refetch()} label="As mensagens não puderam ser recuperadas." /> : list.length === 0 ? <div className="conversation-empty" data-testid="empty-messages"><Sparkles size={24} /><h2>Por onde começamos?</h2><p>Escreva o que está ocupando espaço na sua cabeça. Eu mantenho o fio daqui.</p></div> : list.map((message) => <MessageBubble key={message.id} message={message} speaking={speaking === message.id} onSpeak={() => speak(message)} />)}
      {sendMessage.isPending && <div className="message-row assistant"><div className="assistant-avatar"><span /></div><div className="typing-bubble"><i /><i /><i /></div></div>}
      {sendMessage.isError && <div className="send-error" data-testid="status-send-error">A mensagem não foi enviada. Revise e tente novamente.</div>}
      <div ref={endRef} />
    </div>
    <form className="composer" onSubmit={submit} data-testid="form-message-composer">
      {attachments.length > 0 && <div className="attachment-tray">{attachments.map((file) => <span key={file} className="attachment-pill"><FileText size={13} />{file}<button type="button" onClick={() => setAttachments((current) => current.filter((item) => item !== file))} data-testid={`button-remove-attachment-${file}`} aria-label={`Remover ${file}`}><X size={12} /></button></span>)}</div>}
      <div className="composer-inner">
        <label className="icon-button attach-button" data-testid="label-attach-file" aria-label="Anexar arquivo"><Paperclip size={19} /><input type="file" multiple onChange={(event) => setAttachments(Array.from(event.target.files ?? []).map((file) => file.name))} data-testid="input-attachment" /></label>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event); } }} placeholder="Escreva para MIAR…" rows={1} data-testid="input-message" aria-label="Mensagem" />
        <button type="button" className="icon-button voice-button" data-testid="button-voice-input" aria-label="Entrada por voz"><Mic size={18} /></button>
        <button type="submit" className="send-button" disabled={!draft.trim() || sendMessage.isPending} data-testid="button-send-message" aria-label="Enviar mensagem"><ArrowUp size={20} /></button>
      </div>
      <div className="composer-footer"><span>Enter para enviar · Shift + Enter para nova linha</span><span className="privacy-micro"><ShieldCheck size={12} /> privado</span></div>
    </form>
  </div>;
}

function MessageBubble({ message, speaking, onSpeak }: { message: Message; speaking: boolean; onSpeak: () => void }) {
  return <div className={`message-row ${message.role}`} data-testid={`message-${message.id}`}>
    {message.role === 'assistant' ? <div className="assistant-avatar" aria-label="MIAR"><span /></div> : null}
    <div className="message-content"><div className="message-meta">{message.role === 'assistant' ? 'MIAR' : 'Você'} <time>{new Date(message.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time></div><div className="message-bubble">{message.text}</div>{message.attachments?.length ? <div className="message-attachments">{message.attachments.map((file) => <span key={file}><FileText size={12} />{file}</span>)}</div> : null}{message.role === 'assistant' && <button className={`speak-button ${speaking ? 'speaking' : ''}`} onClick={onSpeak} data-testid={`button-speak-${message.id}`}><Volume2 size={13} /> {speaking ? 'parar áudio' : 'ouvir'}</button>}</div>
  </div>;
}

function EmptyStories() {
  const [, setLocation] = useLocation();
  return <div className="empty-page"><div className="empty-orbit"><BookOpen size={24} /></div><div className="eyebrow">Primeiro passo</div><h1>Crie uma história<br /><em>para começar.</em></h1><p>Histórias guardam o contexto que você não quer repetir. Um projeto, uma fase, uma pergunta — dê um nome ao que importa agora.</p><button className="button primary" onClick={() => setLocation('/historias')} data-testid="button-create-first-story"><Plus size={16} /> Criar primeira história</button></div>;
}

function HistoriesPage() {
  const stories = useListStories({ query: { queryKey: getListStoriesQueryKey() } });
  const createStory = useCreateStory();
  const updateStory = useUpdateStory();
  const deleteStory = useDeleteStory();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<Story | 'new' | null>(null);
  const [notice, setNotice] = useState('');
  const filtered = useMemo(() => (stories.data ?? []).filter((story) => story.archived === showArchived && `${story.name} ${story.context}`.toLowerCase().includes(search.toLowerCase())), [stories.data, search, showArchived]);
  const archive = (story: Story) => {
    updateStory.mutate({ storyId: story.id, data: { archived: !story.archived } }, { onSuccess: () => { setNotice(story.archived ? 'História restaurada.' : 'História arquivada.'); qc.invalidateQueries({ queryKey: getListStoriesQueryKey() }); } });
  };
  const remove = (story: Story) => { if (window.confirm(`Excluir “${story.name}”? Esta ação não pode ser desfeita.`)) deleteStory.mutate({ storyId: story.id }, { onSuccess: () => qc.invalidateQueries({ queryKey: getListStoriesQueryKey() }) }); };
  return <div className="content-page">
    <PageIntro eyebrow="Organizar o pensamento" title="Histórias" detail="Cada história é um lugar para uma linha de pensamento. O contexto fica, mesmo quando a conversa muda." action={<button className="button primary" onClick={() => setEditor('new')} data-testid="button-create-story"><Plus size={16} /> Nova história</button>} />
    <div className="list-toolbar"><label className="search-field"><Search size={17} /><input type="search" placeholder="Buscar histórias" value={search} onChange={(event) => setSearch(event.target.value)} data-testid="input-search-stories" /></label><button className={`archive-filter ${showArchived ? 'active' : ''}`} onClick={() => setShowArchived((value) => !value)} data-testid="button-toggle-archived"><Archive size={15} /> {showArchived ? 'Arquivadas' : 'Ativas'}</button></div>
    {notice && <div className="notice" data-testid="status-story-notice"><Check size={14} /> {notice}</div>}
    {stories.isLoading ? <LoadingBlock /> : stories.isError ? <ErrorBlock onRetry={() => stories.refetch()} /> : filtered.length === 0 ? <div className="empty-state" data-testid="empty-stories"><div className="empty-icon"><FolderOpen size={21} /></div><h2>{search ? 'Nada encontrado' : showArchived ? 'Nenhum arquivo ainda' : 'Seu espaço está em branco'}</h2><p>{search ? 'Tente outra palavra ou limpe a busca.' : 'Comece uma história para dar ao seu pensamento um lugar para pousar.'}</p>{!search && !showArchived && <button className="button secondary" onClick={() => setEditor('new')} data-testid="button-create-empty-story"><Plus size={15} /> Criar história</button>}</div> : <div className="story-list" data-testid="stories-list">{filtered.map((story) => <StoryCard key={story.id} story={story} onEdit={() => setEditor(story)} onArchive={() => archive(story)} onDelete={() => remove(story)} />)}</div>}
    {editor && <StoryEditor story={editor === 'new' ? undefined : editor} saving={createStory.isPending || updateStory.isPending} onClose={() => setEditor(null)} onSave={(data) => { if (editor === 'new') createStory.mutate({ data }, { onSuccess: () => { setEditor(null); qc.invalidateQueries({ queryKey: getListStoriesQueryKey() }); } }); else updateStory.mutate({ storyId: editor.id, data }, { onSuccess: () => { setEditor(null); qc.invalidateQueries({ queryKey: getListStoriesQueryKey() }); } }); }} />}
  </div>;
}

function StoryCard({ story, onEdit, onArchive, onDelete }: { story: Story; onEdit: () => void; onArchive: () => void; onDelete: () => void }) {
  return <article className="story-card" data-testid={`card-story-${story.id}`}><div className="story-card-accent" style={{ background: story.color }} /><div className="story-card-main"><div className="story-card-top"><span className="story-index" style={{ color: story.color }}>●</span><span className="story-date">{new Date(story.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span><button className="card-more" onClick={onEdit} data-testid={`button-edit-story-${story.id}`} aria-label={`Editar ${story.name}`}><MoreHorizontal size={18} /></button></div><h2>{story.name}</h2><p>{story.context || 'Sem contexto adicional.'}</p><div className="story-card-bottom"><span><span className="status-dot" /> {story.readAll ? 'Contexto completo' : 'Contexto parcial'}</span><div className="card-actions"><button onClick={onEdit} data-testid={`button-open-story-${story.id}`}>Abrir</button><button onClick={onArchive} data-testid={`button-archive-story-${story.id}`}><Archive size={14} /> {story.archived ? 'Restaurar' : 'Arquivar'}</button><button className="delete-action" onClick={onDelete} data-testid={`button-delete-story-${story.id}`} aria-label={`Excluir ${story.name}`}><Trash2 size={14} /></button></div></div></div></article>;
}

function StoryEditor({ story, saving, onClose, onSave }: { story?: Story; saving: boolean; onClose: () => void; onSave: (data: { name: string; context: string; color: string; readAll: boolean }) => void }) {
  const [name, setName] = useState(story?.name ?? '');
  const [context, setContext] = useState(story?.context ?? '');
  const [color, setColor] = useState(story?.color ?? COLORS[0]);
  const [readAll, setReadAll] = useState(story?.readAll ?? true);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="story-editor-title" data-testid="dialog-story-editor"><div className="modal-header"><div><div className="eyebrow">{story ? 'Editar história' : 'Nova história'}</div><h2 id="story-editor-title">{story ? 'Ajuste o contexto.' : 'Dê um lugar ao que importa.'}</h2></div><button className="icon-button" onClick={onClose} data-testid="button-close-story-editor" aria-label="Fechar"><X size={18} /></button></div><label className="field-label">Nome<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex.: O livro, a mudança, o próximo passo" data-testid="input-story-name" autoFocus /></label><label className="field-label">Contexto <span>opcional</span><textarea value={context} onChange={(event) => setContext(event.target.value)} placeholder="O que MIAR precisa saber para acompanhar esta história?" rows={4} data-testid="input-story-context" /></label><div className="field-label">Cor da história<div className="color-options">{COLORS.map((item) => <button key={item} type="button" className={`color-swatch ${color === item ? 'chosen' : ''}`} style={{ background: item }} onClick={() => setColor(item)} aria-label={`Escolher cor ${item}`} data-testid={`button-color-${item.replace('#', '')}`}>{color === item && <Check size={14} />}</button>)}</div></div><label className="check-row"><input type="checkbox" checked={readAll} onChange={(event) => setReadAll(event.target.checked)} data-testid="input-story-read-all" /><span><strong>Usar todo o contexto</strong><small>MIAR pode consultar esta história em outras conversas.</small></span></label><div className="modal-actions"><button className="button secondary" onClick={onClose} data-testid="button-cancel-story">Cancelar</button><button className="button primary" disabled={!name.trim() || saving} onClick={() => onSave({ name: name.trim(), context, color, readAll })} data-testid="button-save-story">{saving ? <Loader2 size={15} className="spin" /> : <Check size={15} />} {saving ? 'Salvando…' : story ? 'Salvar alterações' : 'Criar história'}</button></div></section></div>;
}

function MemoryPage() {
  const memory = useListMemory({ query: { queryKey: getListMemoryQueryKey() } });
  const clearMemory = useClearMemory();
  const qc = useQueryClient();
  const stories = useListStories({ query: { queryKey: getListStoriesQueryKey() } });
  const [confirm, setConfirm] = useState(false);
  const resolveStory = (id: string | null) => stories.data?.find((story) => story.id === id)?.name;
  return <div className="content-page memory-page"><PageIntro eyebrow="O que fica" title="Memória" detail="Pequenos detalhes que ajudam MIAR a estar presente sem você precisar recomeçar do zero." action={<button className="button danger-outline" onClick={() => setConfirm(true)} disabled={!memory.data?.length || clearMemory.isPending} data-testid="button-clear-memory"><Trash2 size={15} /> Limpar memória</button>} /><div className="memory-intro"><div className="memory-signal"><span /><span /><span /><span /></div><div><strong>{memory.data?.length ?? 0} lembranças guardadas</strong><p>Você sempre pode revisar ou apagar tudo por aqui.</p></div></div>{memory.isLoading ? <LoadingBlock label="Reunindo suas lembranças" /> : memory.isError ? <ErrorBlock onRetry={() => memory.refetch()} /> : !memory.data?.length ? <div className="empty-state" data-testid="empty-memory"><div className="empty-icon"><WandSparkles size={21} /></div><h2>A memória começa vazia</h2><p>À medida que suas histórias ganham forma, MIAR guarda apenas o que ajuda a conversa a continuar.</p></div> : <div className="memory-list" data-testid="memory-list">{memory.data.map((entry) => <article className="memory-entry" key={entry.id} data-testid={`memory-entry-${entry.id}`}><div className="memory-entry-mark"><Sparkles size={14} /></div><div><p>{entry.content}</p><div className="memory-meta">{resolveStory(entry.storyId) ?? 'Memória geral'} <span>·</span> {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div></article>)}</div>}{confirm && <div className="modal-backdrop"><section className="modal confirm-modal" role="dialog" aria-modal="true" data-testid="dialog-clear-memory"><div className="confirm-icon"><Trash2 size={20} /></div><h2>Apagar toda a memória?</h2><p>As lembranças serão removidas de todas as histórias. Essa ação não pode ser desfeita.</p><div className="modal-actions"><button className="button secondary" onClick={() => setConfirm(false)} data-testid="button-cancel-clear-memory">Manter</button><button className="button danger" disabled={clearMemory.isPending} onClick={() => clearMemory.mutate(undefined, { onSuccess: () => { setConfirm(false); qc.invalidateQueries({ queryKey: getListMemoryQueryKey() }); } })} data-testid="button-confirm-clear-memory">{clearMemory.isPending ? 'Apagando…' : 'Apagar tudo'}</button></div></section></div>}</div>;
}

function SettingsPage() {
  const settings = useGetSettings({ query: { queryKey: getGetSettingsQueryKey() } });
  const update = useUpdateSettings();
  const qc = useQueryClient();
  const [theme, setTheme] = useState<SettingsTheme>('system');
  const [speed, setSpeed] = useState(1);
  const [providers, setProviders] = useState<ProviderSetting[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => { if (settings.data) { setTheme(settings.data.theme); setSpeed(settings.data.voiceSpeed); setProviders(settings.data.providers); } }, [settings.data]);
  useTheme(theme);
  const save = () => update.mutate({ data: { theme, voiceSpeed: speed, providers } }, { onSuccess: () => { setSaved(true); qc.invalidateQueries({ queryKey: getGetSettingsQueryKey() }); window.setTimeout(() => setSaved(false), 2500); } });
  if (settings.isLoading) return <LoadingBlock label="Abrindo configurações" />;
  if (settings.isError || !settings.data) return <ErrorBlock onRetry={() => settings.refetch()} />;
  return <div className="content-page settings-page"><PageIntro eyebrow="Seu jeito de pensar" title="Configurações" detail="Ajuste o ambiente para que ele desapareça quando você estiver pensando." action={<button className="button primary" onClick={save} disabled={update.isPending} data-testid="button-save-settings">{update.isPending ? <Loader2 size={15} className="spin" /> : saved ? <Check size={15} /> : <Check size={15} />} {update.isPending ? 'Salvando…' : saved ? 'Salvo' : 'Salvar alterações'}</button>} /><div className="settings-grid"><section className="settings-section"><div className="section-heading"><div className="section-icon"><Sun size={17} /></div><div><h2>Aparência</h2><p>Escolha como MIAR se sente no seu dia.</p></div></div><div className="theme-options">{([['light', Sun, 'Claro', 'Leve e luminoso'], ['dark', Moon, 'Escuro', 'Suave para a noite'], ['system', Gauge, 'Sistema', 'Segue seu dispositivo']] as const).map(([value, Icon, label, description]) => <button className={`theme-option ${theme === value ? 'selected' : ''}`} key={value} onClick={() => setTheme(value)} data-testid={`button-theme-${value}`}><Icon size={18} /><span><strong>{label}</strong><small>{description}</small></span>{theme === value && <Check size={15} className="theme-check" />}</button>)}</div></section><section className="settings-section"><div className="section-heading"><div className="section-icon terracotta"><Volume2 size={17} /></div><div><h2>Voz da MIAR</h2><p>Ouça respostas quando preferir escutar.</p></div></div><div className="range-label"><span>Velocidade</span><strong>{speed === 0 ? 'Mais calma' : speed === 1 ? 'Natural' : speed === 2 ? 'Rápida' : 'Muito rápida'}</strong></div><input type="range" min="0" max="3" step="1" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="speed-range" data-testid="input-voice-speed" /><div className="range-ticks"><span>calma</span><span>natural</span><span>rápida</span><span>muito rápida</span></div><button className="listen-button" onClick={() => { const utterance = new SpeechSynthesisUtterance('Olá. Este é o ritmo da sua MIAR.'); utterance.lang = 'pt-BR'; utterance.rate = 0.8 + speed * 0.2; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); }} data-testid="button-test-voice"><Headphones size={15} /> Ouvir uma amostra</button></section><section className="settings-section providers-section"><div className="section-heading"><div className="section-icon teal"><Zap size={17} /></div><div><h2>Provedores</h2><p>Escolha quais modelos podem acompanhar suas histórias.</p></div></div><div className="provider-list">{providers.map((provider, index) => <div className="provider-row" key={provider.name}><div className="provider-avatar">{provider.name.slice(0, 1)}</div><div className="provider-details"><strong>{provider.name}</strong><span>{provider.model || 'Modelo padrão'} · {provider.connected ? 'conectado' : 'não conectado'}</span></div><button className={`toggle ${provider.enabled ? 'on' : ''}`} onClick={() => setProviders((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: !item.enabled } : item))} aria-label={`${provider.enabled ? 'Desativar' : 'Ativar'} ${provider.name}`} data-testid={`button-toggle-provider-${provider.name.toLowerCase()}`}><span /></button></div>)}</div><p className="settings-footnote"><ShieldCheck size={13} /> As chaves ficam protegidas no ambiente da sua conta.</p></section></div></div>;
}

function AppRouter() {
  return <ErrorBoundary><Shell><Switch><Route path="/" component={Home} /><Route path="/historias" component={HistoriesPage} /><Route path="/memoria" component={MemoryPage} /><Route path="/configuracoes" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><AppRouter /></QueryClientProvider>;
}

export default App;