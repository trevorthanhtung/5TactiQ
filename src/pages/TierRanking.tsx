import { useState, useEffect, useMemo } from 'react';
import { usePlayerStore } from '../store/usePlayerStore';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { compareVietnameseNames } from '../utils/sortUtils';
import { BottomSheet } from '../components/ui/BottomSheet';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

type Tier = 'S' | 'A' | 'B' | 'C';

const TIER_CONFIG: Record<Tier, { label: string; color: string; textColor: string; bgColor: string; borderColor: string }> = {
  S: { label: 'S', color: '#f59e0b', textColor: 'text-amber-400', bgColor: 'bg-amber-500', borderColor: 'border-amber-500/40' },
  A: { label: 'A', color: '#10b981', textColor: 'text-emerald-400', bgColor: 'bg-emerald-500', borderColor: 'border-emerald-500/40' },
  B: { label: 'B', color: '#3b82f6', textColor: 'text-sky-400', bgColor: 'bg-sky-500', borderColor: 'border-sky-500/40' },
  C: { label: 'C', color: '#94a3b8', textColor: 'text-slate-400', bgColor: 'bg-slate-500', borderColor: 'border-slate-500/40' },
};

const TIERS: Tier[] = ['S', 'A', 'B', 'C'];

// Draggable player chip
function DraggableChip({ player, tier }: { player: { id: string; name: string; jersey_number: number | null; positions: string[] }; tier?: Tier | null }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    data: { player, currentTier: tier },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    touchAction: 'none' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        flex items-center px-3 py-1.5 border-2 cursor-grab active:cursor-grabbing select-none
        ${tier ? `border-[${TIER_CONFIG[tier].color}]/30 bg-[${TIER_CONFIG[tier].color}]/10` : 'border-border-main bg-surface'}
        hover:brightness-110 transition-[filter]
      `}
    >
      <span className="text-xs font-bold text-text-main uppercase whitespace-nowrap">
        {player.name}
      </span>
    </div>
  );
}

// Droppable tier row
function DroppableTierRow({ tier, children, isOver }: { tier: Tier; children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: `tier-${tier}` });
  const config = TIER_CONFIG[tier];

  return (
    <div
      ref={setNodeRef}
      className={`
        flex border-2 transition-all min-h-[56px]
        ${config.borderColor}
        ${isOver ? 'ring-2 ring-offset-1 scale-[1.01] brightness-110' : ''}
      `}
      style={isOver ? { boxShadow: `0 0 20px ${config.color}40` } : {}}
    >
      {/* Tier label */}
      <div
        className="w-14 shrink-0 flex items-center justify-center border-r-2"
        style={{
          backgroundColor: `${config.color}20`,
          borderColor: `${config.color}40`,
        }}
      >
        <span className="font-display text-2xl font-black" style={{ color: config.color }}>{tier}</span>
      </div>

      {/* Players area */}
      <div className="flex-1 flex flex-wrap gap-1.5 p-2 items-start content-start min-h-[56px]">
        {children}
      </div>
    </div>
  );
}

// Droppable unranked area
function DroppableUnranked({ children, isOver }: { children: React.ReactNode; isOver: boolean }) {
  const { setNodeRef } = useDroppable({ id: 'tier-unranked' });

  return (
    <div
      ref={setNodeRef}
      className={`
        border-2 border-dashed border-border-main p-2.5 transition-all min-h-[60px]
        ${isOver ? 'ring-2 ring-offset-1 ring-red-500/30 border-red-500/40 bg-red-500/5' : ''}
      `}
    >
      <div className="flex flex-wrap gap-1.5 items-start content-start">
        {children}
      </div>
    </div>
  );
}

// Overlay chip (what you see while dragging)
function OverlayChip({ player }: { player: { name: string; jersey_number: number | null } }) {
  return (
    <div className="flex items-center px-3 py-1.5 border-2 border-secondary bg-secondary text-white shadow-xl cursor-grabbing select-none scale-110 z-50">
      <span className="text-xs font-bold uppercase whitespace-nowrap">{player.name}</span>
    </div>
  );
}

export default function TierRanking() {
  const { t } = useTranslation();
  const { players, updatePlayer } = usePlayerStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overTier, setOverTier] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const confirmResetAll = () => {
    players.forEach(p => {
      if (p.tier) {
        updatePlayer(p.id, { tier: null });
      }
    });
    setShowResetConfirm(false);
  };

  const grouped = useMemo(() => {
    const result: Record<Tier | 'unranked', typeof players> = { S: [], A: [], B: [], C: [], unranked: [] };
    players.forEach(p => {
      const tier = p.tier as Tier | null | undefined;
      if (tier && TIERS.includes(tier)) {
        result[tier].push(p);
      } else {
        result.unranked.push(p);
      }
    });
    Object.keys(result).forEach(key => {
      result[key as keyof typeof result].sort((a, b) => compareVietnameseNames(a.name, b.name));
    });
    return result;
  }, [players]);

  const activePlayer = activeId ? players.find(p => p.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: any) => {
    const overId = event.over?.id as string | null;
    setOverTier(overId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverTier(null);

    if (!over) return;

    const playerId = active.id as string;
    const targetId = over.id as string;

    let newTier: Tier | null = null;
    if (targetId.startsWith('tier-')) {
      const tierStr = targetId.replace('tier-', '');
      if (TIERS.includes(tierStr as Tier)) {
        newTier = tierStr as Tier;
      }
      // 'tier-unranked' → null
    }

    const player = players.find(p => p.id === playerId);
    if (player && player.tier !== newTier) {
      updatePlayer(playerId, { tier: newTier });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setOverTier(null);
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto w-full animate-pulse space-y-4">
        <div className="h-10 bg-surface rounded w-48" />
        <div className="h-6 bg-surface rounded w-32" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 bg-surface rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 flex flex-col min-h-full max-w-5xl mx-auto w-full pb-24">
      {/* Header */}
      <header className="mb-5 pt-2">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold text-text-muted hover:text-secondary transition-colors mb-3 uppercase tracking-wider">
          <ArrowLeft size={16} /> {t('tier.back')}
        </button>
        <h1 className="text-3xl sm:text-4xl font-display uppercase text-primary leading-none">{t('tier.title')}</h1>
        <p className="text-xs sm:text-sm text-text-muted mt-2 font-medium">{t('tier.subtitle')}</p>
        <div className="hallmark-divider mt-4" />
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {/* Tier Rows */}
        <div className="space-y-2">
          {TIERS.map(tier => {
            const tierPlayers = grouped[tier];
            const isOver = overTier === `tier-${tier}`;
            return (
              <DroppableTierRow key={tier} tier={tier} isOver={isOver}>
                {tierPlayers.length > 0 ? (
                  tierPlayers.map(p => (
                    <DraggableChip key={p.id} player={p} tier={tier} />
                  ))
                ) : (
                  !activeId && (
                    <div className="w-full text-center py-2 text-[10px] text-text-muted font-medium uppercase tracking-wider opacity-40">
                      {t('tier.empty_tier')}
                    </div>
                  )
                )}
              </DroppableTierRow>
            );
          })}
        </div>

        {/* Unranked */}
        <div className="mt-5">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-display font-bold text-text-muted uppercase tracking-widest">
              {t('tier.unranked')} ({grouped.unranked.length})
            </h2>
            {players.some(p => p.tier) && (
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="hallmark-btn flex items-center gap-1.5 bg-secondary text-white text-xs py-1 px-3"
              >
                <RotateCcw size={13} />
                <span>{t('tier.reset_all', 'LÀM MỚI')}</span>
              </button>
            )}
          </div>
          <DroppableUnranked isOver={overTier === 'tier-unranked'}>
            {grouped.unranked.length > 0 ? (
              grouped.unranked.map(p => (
                <DraggableChip key={p.id} player={p} />
              ))
            ) : (
              !activeId && (
                <div className="w-full text-center py-4 text-sm font-bold text-slate-400/70 uppercase tracking-wider border-2 border-dashed border-transparent">
                  {t('tier.drag_to_unrank', 'KÉO THẢ VÀO ĐÂY ĐỂ GỠ HẠNG')}
                </div>
              )
            )}
          </DroppableUnranked>
        </div>

        {/* Drag Overlay — the floating chip that follows cursor/finger */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activePlayer ? <OverlayChip player={activePlayer} /> : null}
        </DragOverlay>
      </DndContext>

      {players.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          <p className="font-medium">{t('tier.no_players')}</p>
        </div>
      )}

      {/* Reset Confirmation BottomSheet Modal */}
      <BottomSheet
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title={t('tier.reset_all', 'LÀM MỚI XẾP HẠNG')}
      >
        <div className="flex flex-col">
          <p className="text-text-muted text-sm md:text-base font-sans mb-8 leading-relaxed">
            {t('tier.confirm_reset', 'Bạn có chắc chắn muốn làm mới (gỡ) toàn bộ xếp hạng của cầu thủ?')}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 bg-transparent text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface transition-colors active:scale-95"
            >
              {t('common.cancel', 'HỦY')}
            </button>
            <button 
              onClick={confirmResetAll}
              className="flex-1 bg-secondary text-white font-display uppercase tracking-wider py-3 border-2 border-secondary hover:bg-secondary/90 transition-colors active:scale-95"
            >
              {t('tier.reset_all', 'LÀM MỚI')}
            </button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
