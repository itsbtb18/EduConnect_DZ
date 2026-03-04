import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
  DashboardOutlined,
  BankOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  FileTextOutlined,
  HeartOutlined,
  BellOutlined,
  CrownOutlined,
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  DollarOutlined,
  SoundOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import './CommandPalette.css';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  section: string;
}

const CommandPalette: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  /* ── Commands list ── */
  const commands = useMemo<CommandItem[]>(() => {
    const superAdminItems: CommandItem[] = [
      { id: 'sa-dash', label: 'Tableau de bord', description: 'Vue d\'ensemble de la plateforme', icon: <DashboardOutlined />, path: '/platform/dashboard', section: 'Plateforme' },
      { id: 'sa-schools', label: 'Gestion des écoles', description: 'Gérer les établissements', icon: <BankOutlined />, path: '/platform/schools', section: 'Plateforme' },
      { id: 'sa-users', label: 'Utilisateurs plateforme', description: 'Gérer les utilisateurs', icon: <TeamOutlined />, path: '/platform/users', section: 'Plateforme' },
      { id: 'sa-plans', label: 'Abonnements & Plans', description: 'Gérer les plans tarifaires', icon: <CrownOutlined />, path: '/platform/plans', section: 'Plateforme' },
      { id: 'sa-analytics', label: 'Analytiques plateforme', description: 'Statistiques globales', icon: <BarChartOutlined />, path: '/platform/analytics', section: 'Plateforme' },
      { id: 'sa-logs', label: 'Journal d\'activité', description: 'Historique des actions', icon: <FileTextOutlined />, path: '/platform/activity-logs', section: 'Plateforme' },
      { id: 'sa-health', label: 'Santé du système', description: 'Monitoring infrastructure', icon: <HeartOutlined />, path: '/platform/system-health', section: 'Plateforme' },
      { id: 'sa-notifs', label: 'Notifications', description: 'Envoyer et gérer les notifications', icon: <BellOutlined />, path: '/platform/notifications', section: 'Plateforme' },
      { id: 'sa-settings', label: 'Paramètres plateforme', description: 'Configuration globale', icon: <SettingOutlined />, path: '/platform/settings', section: 'Configuration' },
    ];

    const schoolAdminItems: CommandItem[] = [
      { id: 'sc-dash', label: 'Tableau de bord', description: 'Vue d\'ensemble de l\'école', icon: <DashboardOutlined />, path: '/dashboard', section: 'Navigation' },
      { id: 'sc-students', label: 'Élèves', description: 'Gestion des élèves', icon: <UserOutlined />, path: '/students', section: 'Académique' },
      { id: 'sc-teachers', label: 'Enseignants', description: 'Gestion des enseignants', icon: <TeamOutlined />, path: '/teachers', section: 'Académique' },
      { id: 'sc-classes', label: 'Classes', description: 'Gestion des classes', icon: <BookOutlined />, path: '/classes', section: 'Académique' },
      { id: 'sc-grades', label: 'Notes & Bulletins', description: 'Gestion complète des notes, moyennes et recours', icon: <FileTextOutlined />, path: '/notes-bulletins', section: 'Académique' },
      { id: 'sc-attendance', label: 'Absences', description: 'Suivi des absences', icon: <CalendarOutlined />, path: '/attendance', section: 'Académique' },
      { id: 'sc-timetable', label: 'Emploi du temps', description: 'Planning des cours', icon: <CalendarOutlined />, path: '/timetable', section: 'Académique' },
      { id: 'sc-homework', label: 'Devoirs', description: 'Gestion des devoirs', icon: <BookOutlined />, path: '/homework', section: 'Académique' },
      { id: 'sc-announcements', label: 'Annonces', description: 'Publier des annonces', icon: <SoundOutlined />, path: '/announcements', section: 'Communication' },
      { id: 'sc-messaging', label: 'Messagerie', description: 'Discussions et messages', icon: <MessageOutlined />, path: '/messaging', section: 'Communication' },
      { id: 'sc-finance', label: 'Paiements', description: 'Gestion des paiements', icon: <DollarOutlined />, path: '/financial', section: 'Administration' },
      { id: 'sc-analytics', label: 'Analytiques', description: 'Statistiques de l\'école', icon: <BarChartOutlined />, path: '/analytics', section: 'Administration' },
      { id: 'sc-notifs', label: 'Notifications', description: 'Voir les notifications', icon: <BellOutlined />, path: '/notifications', section: 'Communication' },
      { id: 'sc-settings', label: 'Paramètres', description: 'Configuration de l\'école', icon: <SettingOutlined />, path: '/settings', section: 'Administration' },
    ];

    return isSuperAdmin ? superAdminItems : schoolAdminItems;
  }, [isSuperAdmin]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q),
    );
  }, [commands, query]);

  /* ── Grouped ── */
  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((c) => {
      const arr = map.get(c.section) || [];
      arr.push(c);
      map.set(c.section, arr);
    });
    return map;
  }, [filtered]);

  /* ── Keyboard shortcut (Ctrl+K / Cmd+K) ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ── Navigate on selected ── */
  const execute = useCallback(
    (item: CommandItem) => {
      if (item.path) navigate(item.path);
      if (item.action) item.action();
      setOpen(false);
    },
    [navigate],
  );

  /* ── Keyboard navigation ── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter' && filtered[selectedIdx]) {
        execute(filtered[selectedIdx]);
      }
    },
    [filtered, selectedIdx, execute],
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('.cmd-item--active');
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-palette" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-search">
          <SearchOutlined className="cmd-search__icon" />
          <input
            ref={inputRef}
            className="cmd-search__input"
            type="text"
            placeholder="Rechercher une page ou une action…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <kbd className="cmd-kbd">ESC</kbd>
        </div>

        <div className="cmd-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="cmd-empty">Aucun résultat pour &laquo; {query} &raquo;</div>
          )}
          {Array.from(grouped.entries()).map(([section, items]) => (
            <div key={section} className="cmd-group">
              <div className="cmd-group__title">{section}</div>
              {items.map((item) => {
                flatIdx++;
                const idx = flatIdx;
                return (
                  <div
                    key={item.id}
                    className={`cmd-item ${idx === selectedIdx ? 'cmd-item--active' : ''}`}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelectedIdx(idx)}
                  >
                    <span className="cmd-item__icon">{item.icon}</span>
                    <div className="cmd-item__text">
                      <span className="cmd-item__label">{item.label}</span>
                      {item.description && <span className="cmd-item__desc">{item.description}</span>}
                    </div>
                    <span className="cmd-item__arrow">↵</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="cmd-footer">
          <span><kbd>↑↓</kbd> naviguer</span>
          <span><kbd>↵</kbd> ouvrir</span>
          <span><kbd>esc</kbd> fermer</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
