import React, { useState, useMemo } from 'react';
import { User, ChevronDown, Check, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '../store/usePlayerStore';
import { BottomSheet } from './ui/BottomSheet';
import type { Player } from '../types';

interface PlayerPickerModalProps {
  value: string | null;
  onChange: (playerId: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  filterPlayer?: (player: Player) => boolean;
}

export function PlayerPickerModal({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  filterPlayer,
}: PlayerPickerModalProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { players } = usePlayerStore();

  const displayLabel = label || t('common.select_player', 'Chọn cầu thủ');
  const displayPlaceholder = placeholder || t('common.tap_to_select_player', '-- Bấm để chọn cầu thủ --');

  const selectedPlayer = useMemo(() => {
    if (!value) return null;
    return players.find((p) => p.id === value) || null;
  }, [value, players]);

  const availablePlayers = useMemo(() => {
    let list = players;
    if (filterPlayer) {
      list = list.filter(filterPlayer);
    }
    return list;
  }, [players, filterPlayer]);

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availablePlayers;
    return availablePlayers.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchNumber = p.jersey_number !== null && p.jersey_number !== undefined && String(p.jersey_number).includes(q);
      const matchPos = p.positions && p.positions.some((pos) => pos.toLowerCase().includes(q));
      return matchName || matchNumber || matchPos;
    });
  }, [availablePlayers, searchQuery]);

  return (
    <div className="w-full">
      {/* TRIGGER BUTTON - Pure Hallmark UI Card */}
      <button
        type="button"
        onClick={() => {
          setSearchQuery('');
          setIsOpen(true);
        }}
        className={`w-full border-2 bg-surface p-3 rounded-none outline-none font-bold text-left flex items-center justify-between transition-colors ${
          isOpen ? 'border-primary' : 'border-border-main hover:border-primary/60'
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedPlayer ? (
            <div className="flex items-center gap-2 truncate">
              {selectedPlayer.jersey_number !== null && selectedPlayer.jersey_number !== undefined && (
                <span className="px-1.5 py-0.5 text-[11px] font-display font-bold bg-primary text-white shrink-0">
                  #{selectedPlayer.jersey_number}
                </span>
              )}
              <span className="font-bold text-sm text-primary truncate">
                {selectedPlayer.name}
              </span>
            </div>
          ) : (
            <span className="text-sm text-text-muted font-medium truncate">
              {displayPlaceholder}
            </span>
          )}
        </div>

        <ChevronDown size={18} className="text-primary shrink-0 ml-2" />
      </button>

      {/* POPUP BOX / BOTTOMSHEET FOR SELECTION */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        zIndex={115}
        title={
          <span className="flex items-center gap-2">
            <User size={20} className="text-primary" /> {displayLabel}
          </span>
        }
      >
        <div className="space-y-3 pb-2">
          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('common.search_player_placeholder', 'Tìm theo tên hoặc số áo...')}
              className="w-full border-2 border-border-main bg-surface p-2.5 pl-9 rounded-none outline-none focus:border-primary font-medium text-sm text-text-main"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-0.5"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Player Cards List */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-text-muted text-sm border-2 border-dashed border-border-main">
                {t('common.no_players_found', 'Không tìm thấy cầu thủ nào.')}
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = player.id === value;
                return (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      onChange(player.id);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 border-2 text-left flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border-main bg-surface text-text-main hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 border-2 flex items-center justify-center font-display font-bold text-sm shrink-0 ${
                        isSelected 
                          ? 'border-primary bg-primary text-white' 
                          : 'border-border-main bg-accent/20 text-primary'
                      }`}>
                        {player.jersey_number !== null && player.jersey_number !== undefined
                          ? player.jersey_number < 10 ? `0${player.jersey_number}` : player.jersey_number
                          : '•'}
                      </div>

                      <div className="min-w-0 font-bold text-sm truncate">
                        {player.name}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 bg-primary text-white flex items-center justify-center shrink-0 ml-2">
                        <Check size={13} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
