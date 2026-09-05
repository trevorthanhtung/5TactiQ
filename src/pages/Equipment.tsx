import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Package, User, Trash2, Search, X
} from 'lucide-react';
import { useEquipmentStore } from '../store/useEquipmentStore';
import { usePlayerStore } from '../store/usePlayerStore';
import { EquipmentSkeleton } from '../components/ui/EquipmentSkeleton';
import { BottomSheet } from '../components/ui/BottomSheet';
import { PlayerPickerModal } from '../components/PlayerPickerModal';
import { OptionPickerModal } from '../components/OptionPickerModal';
import { useTranslation } from 'react-i18next';
import type { EquipmentItem } from '../types';

export default function Equipment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'items' | 'jerseys'>('items');

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'all': return t('equipment.cat_all', 'Tất cả');
      case 'ball': return t('equipment.cat_ball', 'Bóng');
      case 'bib': return t('equipment.cat_bib', 'Áo bib');
      case 'medical': return t('equipment.cat_medical', 'Y tế');
      case 'training': return t('equipment.cat_training', 'Tập luyện');
      case 'other': return t('equipment.cat_other', 'Khác');
      default: return cat;
    }
  };

  const getConditionInfo = (cond: string) => {
    switch (cond) {
      case 'good': return { label: t('equipment.cond_good', 'Tốt'), color: 'bg-emerald-600' };
      case 'fair': return { label: t('equipment.cond_fair', 'Bình thường'), color: 'bg-amber-600' };
      case 'damaged': return { label: t('equipment.cond_damaged', 'Hư hỏng'), color: 'bg-rose-600' };
      case 'missing': return { label: t('equipment.cond_missing', 'Thất lạc'), color: 'bg-slate-600' };
      default: return { label: t('equipment.cond_good', 'Tốt'), color: 'bg-emerald-600' };
    }
  };

  const getCategoryOptions = () => [
    { value: 'ball', label: t('equipment.cat_ball', 'Bóng') },
    { value: 'bib', label: t('equipment.cat_bib', 'Áo bib') },
    { value: 'medical', label: t('equipment.cat_medical', 'Y tế') },
    { value: 'training', label: t('equipment.cat_training', 'Tập luyện') },
    { value: 'other', label: t('equipment.cat_other', 'Khác') },
  ];

  const getConditionOptions = () => [
    { value: 'good', label: t('equipment.cond_good', 'Tốt'), badge: t('equipment.badge_cond_good', '100%') },
    { value: 'fair', label: t('equipment.cond_fair', 'Bình thường'), badge: t('equipment.badge_cond_fair', 'Dùng được') },
    { value: 'damaged', label: t('equipment.cond_damaged', 'Hư hỏng'), badge: t('equipment.badge_cond_damaged', 'Cần sửa/thay') },
    { value: 'missing', label: t('equipment.cond_missing', 'Thất lạc'), badge: t('equipment.badge_cond_missing', 'Mất') },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const { 
    items, 
    jerseys, 
    addItem, 
    updateItem, 
    deleteItem, 
    assignItem,
    setJersey,
    unassignJersey 
  } = useEquipmentStore();

  const { players, updatePlayer } = usePlayerStore();

  // Modals & Filters
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedJerseyNumber, setSelectedJerseyNumber] = useState<number | null>(null);
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [jerseyFilter, setJerseyFilter] = useState<'all' | 'assigned' | 'available'>('all');

  // Form state for new equipment
  const [newItemData, setNewItemData] = useState<{
    name: string;
    category: EquipmentItem['category'];
    quantity: number;
    condition: EquipmentItem['condition'];
    assignedPlayerId: string;
    notes: string;
  }>({
    name: '',
    category: 'ball',
    quantity: 1,
    condition: 'good',
    assignedPlayerId: '',
    notes: ''
  });

  // Form state for editing equipment
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [editItemData, setEditItemData] = useState<{
    name: string;
    category: EquipmentItem['category'];
    quantity: number;
    condition: EquipmentItem['condition'];
    assignedPlayerId: string;
    notes: string;
  }>({
    name: '',
    category: 'ball',
    quantity: 1,
    condition: 'good',
    assignedPlayerId: '',
    notes: ''
  });
  const [showDeleteItemConfirm, setShowDeleteItemConfirm] = useState(false);

  // Jersey Assign Form State
  const [jerseyPlayerId, setJerseyPlayerId] = useState<string>('');
  const [jerseySize, setJerseySize] = useState<'S' | 'M' | 'L' | 'XL' | 'XXL'>('L');

  // Compute jersey slots (1 to 99 as standard squad numbers)
  const jerseySlots = useMemo(() => {
    const maxNumber = Math.max(99, ...players.map(p => p.jersey_number || 0));
    const slots: { number: number; player: any; size?: string }[] = [];

    for (let num = 1; num <= maxNumber; num++) {
      const playerWithJersey = players.find(p => p.jersey_number === num);
      const customJersey = jerseys.find(j => j.jerseyNumber === num);

      slots.push({
        number: num,
        player: playerWithJersey || null,
        size: customJersey?.size || 'L'
      });
    }

    return slots;
  }, [players, jerseys]);

  const filteredItems = useMemo(() => {
    return (items || []).filter(item => {
      const matchCat = categoryFilter === 'all' || item.category === categoryFilter;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [items, categoryFilter, searchQuery]);

  const filteredJerseys = useMemo(() => {
    return jerseySlots.filter(slot => {
      if (jerseyFilter === 'assigned') return !!slot.player;
      if (jerseyFilter === 'available') return !slot.player;
      return true;
    });
  }, [jerseySlots, jerseyFilter]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemData.name.trim()) return;

    addItem({
      name: newItemData.name.trim(),
      category: newItemData.category,
      quantity: Number(newItemData.quantity) || 1,
      condition: newItemData.condition,
      assignedPlayerId: newItemData.assignedPlayerId || null,
      assignedDate: newItemData.assignedPlayerId ? new Date().toISOString().split('T')[0] : undefined,
      notes: newItemData.notes.trim()
    });

    setShowAddItemModal(false);
    setNewItemData({
      name: '',
      category: 'ball',
      quantity: 1,
      condition: 'good',
      assignedPlayerId: '',
      notes: ''
    });
  };

  const handleOpenEditItem = (item: EquipmentItem) => {
    setEditingItem(item);
    setEditItemData({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      condition: item.condition,
      assignedPlayerId: item.assignedPlayerId || '',
      notes: item.notes || ''
    });
    setShowDeleteItemConfirm(false);
  };

  const handleSaveEditItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editItemData.name.trim()) return;

    updateItem(editingItem.id, {
      name: editItemData.name.trim(),
      category: editItemData.category,
      quantity: Number(editItemData.quantity) || 1,
      condition: editItemData.condition,
      assignedPlayerId: editItemData.assignedPlayerId || null,
      assignedDate: editItemData.assignedPlayerId 
        ? (editingItem.assignedPlayerId === editItemData.assignedPlayerId ? editingItem.assignedDate : new Date().toISOString().split('T')[0])
        : undefined,
      notes: editItemData.notes.trim()
    });

    setEditingItem(null);
  };

  const handleDeleteItem = () => {
    if (!editingItem) return;
    deleteItem(editingItem.id);
    setShowDeleteItemConfirm(false);
    setEditingItem(null);
  };

  const handleOpenJerseyModal = (num: number, currentOwnerId?: string, currentSize?: string) => {
    setSelectedJerseyNumber(num);
    setJerseyPlayerId(currentOwnerId || '');
    setJerseySize((currentSize as any) || 'L');
  };

  const handleSaveJerseyAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJerseyNumber === null) return;

    // 1. If someone else had this number, remove it
    const previousOwner = players.find(p => p.jersey_number === selectedJerseyNumber);
    if (previousOwner && previousOwner.id !== jerseyPlayerId) {
      updatePlayer(previousOwner.id, { jersey_number: null });
    }

    // 2. Assign to new player if selected
    if (jerseyPlayerId) {
      updatePlayer(jerseyPlayerId, { jersey_number: selectedJerseyNumber });
      setJersey(selectedJerseyNumber, {
        playerId: jerseyPlayerId,
        size: jerseySize,
        status: 'assigned'
      });
    } else {
      // Unassign
      unassignJersey(selectedJerseyNumber);
    }

    setSelectedJerseyNumber(null);
  };

  const getPlayer = (id?: string | null) => {
    if (!id) return null;
    return players.find(p => p.id === id) || null;
  };

  if (isLoading) {
    return <EquipmentSkeleton />;
  }

  return (
    <div className="p-3 sm:p-4 flex flex-col max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={() => navigate('/more')}
            className="p-1.5 sm:p-2 text-primary hover:bg-primary/10 border-2 border-primary/30 hover:border-primary transition-all shrink-0"
            title={t('common.back_to_more', 'Trở về Thêm')}
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-2xl md:text-3xl font-display uppercase text-primary leading-tight truncate">
              <span>{t('equipment.page_title', 'Đồ & Áo Đấu')}</span>
            </h1>
          </div>
        </div>

        {activeTab === 'items' && (
          <button 
            onClick={() => setShowAddItemModal(true)}
            className="hallmark-btn flex items-center justify-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0 whitespace-nowrap active:scale-95"
          >
            <Plus size={15} /> <span>{t('equipment.btn_new_item', 'Thêm đồ')}</span>
          </button>
        )}
      </div>

      <div className="hallmark-divider my-2 sm:my-3"></div>

      {/* Main Tabs */}
      <div className="flex border-b-2 border-border-main mb-4">
        <button
          onClick={() => setActiveTab('items')}
          className={`flex-1 sm:flex-initial flex items-center justify-center px-3 sm:px-5 py-2.5 sm:py-3 font-display uppercase tracking-wider text-xs sm:text-sm transition-colors border-b-4 -mb-[2px] cursor-pointer ${
            activeTab === 'items' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <span>{t('equipment.tab_items', 'Dụng Cụ')}</span>
        </button>
        <button
          onClick={() => setActiveTab('jerseys')}
          className={`flex-1 sm:flex-initial flex items-center justify-center px-3 sm:px-5 py-2.5 sm:py-3 font-display uppercase tracking-wider text-xs sm:text-sm transition-colors border-b-4 -mb-[2px] cursor-pointer ${
            activeTab === 'jerseys' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
        >
          <span>{t('equipment.tab_jerseys', 'Số Áo')}</span>
        </button>
      </div>

      {/* TAB 1: TRANG THIẾT BỊ & DỤNG CỤ */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('equipment.search_placeholder', 'Tìm kiếm dụng cụ...')}
                className="w-full bg-surface border-2 border-border-main pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary font-medium text-text-main placeholder:text-text-muted/60 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main p-1 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
              {(['all', 'ball', 'bib', 'medical', 'training', 'other'] as const).map((catKey) => (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategoryFilter(catKey)}
                  className={`px-3.5 py-2 text-xs font-display uppercase tracking-wider whitespace-nowrap transition-all border-2 shrink-0 active:scale-95 ${
                    categoryFilter === catKey 
                      ? 'bg-primary text-white border-primary font-bold shadow-xs' 
                      : 'bg-surface border-border-main text-text-muted hover:text-text-main hover:border-primary/50'
                  }`}
                >
                  {getCategoryLabel(catKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredItems.length === 0 ? (
              <div className="col-span-full bg-surface border-2 border-dashed border-border-main p-8 text-center text-text-muted font-medium">
                {t('equipment.empty_items', 'Không tìm thấy dụng cụ nào. Bấm "Thêm đồ" để bổ sung trang thiết bị.')}
              </div>
            ) : (
              filteredItems.map(item => {
                const assignedPlayer = getPlayer(item.assignedPlayerId);
                const conditionInfo = getConditionInfo(item.condition);

                return (
                  <div 
                    key={item.id}
                    onClick={() => handleOpenEditItem(item)}
                    className="bg-surface border-2 border-border-main p-4 flex flex-col justify-between gap-3 relative cursor-pointer hover:border-primary/60 active:scale-[0.99] transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-display font-bold text-lg text-primary leading-tight">
                          {item.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-[10px] font-display uppercase font-bold text-white ${conditionInfo.color} shrink-0`}>
                          {conditionInfo.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                        <span className="font-bold text-primary">{t('equipment.label_qty', 'SL')}: {item.quantity}</span>
                        <span>•</span>
                        <span>{t('equipment.label_type', 'Loại')}: {getCategoryLabel(item.category)}</span>
                      </div>

                      {item.notes && (
                        <p className="text-xs text-text-muted italic line-clamp-2 mb-2">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Assigned Player Section */}
                    <div className="border-t border-border-main/50 pt-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs min-w-0">
                        <User size={14} className={assignedPlayer ? 'text-secondary shrink-0' : 'text-text-muted shrink-0'} />
                        <span className="text-text-muted shrink-0">{t('equipment.label_holder', 'Người giữ')}:</span>
                        <span className="font-bold text-primary truncate">
                          {assignedPlayer ? assignedPlayer.name : t('equipment.unassigned', 'Chưa giao cho ai')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SỐ ÁO & ĐỒNG PHỤC */}
      {activeTab === 'jerseys' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-xs text-text-muted font-medium">
              {t('equipment.jersey_instruction', 'Bấm vào số áo bất kỳ để cấp phát cho thành viên hoặc thu hồi số áo.')}
            </div>

            <div className="flex border-2 border-border-main text-xs font-display uppercase tracking-wider bg-surface w-full sm:w-auto">
              <button
                onClick={() => setJerseyFilter('all')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 text-center transition-colors ${jerseyFilter === 'all' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('equipment.filter_all', 'Tất cả')}
              </button>
              <button
                onClick={() => setJerseyFilter('assigned')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 border-l border-border-main text-center transition-colors ${jerseyFilter === 'assigned' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('equipment.filter_assigned', 'Đã cấp')}
              </button>
              <button
                onClick={() => setJerseyFilter('available')}
                className={`flex-1 sm:flex-initial px-3 py-1.5 border-l border-border-main text-center transition-colors ${jerseyFilter === 'available' ? 'bg-primary text-white' : 'text-text-muted hover:text-text-main'}`}
              >
                {t('equipment.filter_available', 'Còn trống')}
              </button>
            </div>
          </div>

          {/* Jersey Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {filteredJerseys.map((slot) => {
              const isAssigned = !!slot.player;

              return (
                <div
                  key={slot.number}
                  onClick={() => handleOpenJerseyModal(slot.number, slot.player?.id, slot.size)}
                  className={`p-3.5 border-2 flex flex-col items-center justify-between cursor-pointer transition-all hover:border-primary active:scale-95 text-center min-h-[110px] ${
                    isAssigned 
                      ? 'bg-surface border-border-main' 
                      : 'bg-accent/10 border-dashed border-border-main/80 text-text-muted hover:bg-surface'
                  }`}
                >
                  <div className="flex justify-between items-center w-full text-[10px] uppercase font-bold text-text-muted">
                    <span>{t('equipment.badge_jersey', 'ÁO ĐẤU')}</span>
                    <span className="px-1.5 py-0.2 border border-border-main font-mono">{slot.size || 'L'}</span>
                  </div>

                  <div className={`font-display font-bold text-3xl my-1 ${isAssigned ? 'text-primary' : 'text-text-muted/60'}`}>
                    {slot.number < 10 ? `0${slot.number}` : slot.number}
                  </div>

                  <div className="w-full truncate text-xs font-medium">
                    {isAssigned ? (
                      <span className="font-bold text-primary truncate block" title={slot.player.name}>
                        {slot.player.name}
                      </span>
                    ) : (
                      <span className="text-text-muted text-[11px] uppercase tracking-wider block">
                        {t('equipment.unassigned_jersey', 'Còn trống')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Thêm Trang Thiết Bị */}
      <BottomSheet
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        title={
          <span className="flex items-center gap-2">
            <Plus size={20} /> {t('equipment.modal_add_item_title', 'Thêm Trang Thiết Bị')}
          </span>
        }
      >
        <form onSubmit={handleCreateItem} className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('equipment.label_item_name', 'Tên dụng cụ / Đồ dùng')} *
            </label>
            <input 
              type="text"
              required
              value={newItemData.name}
              onChange={e => setNewItemData({...newItemData, name: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-primary"
              placeholder={t('equipment.placeholder_item_name', 'Ví dụ: Bóng futsal thi đấu, Hộp y tế, Áo bib cam...')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('equipment.label_category', 'Phân loại')}
              </label>
              <OptionPickerModal
                value={newItemData.category}
                onChange={(cat) => setNewItemData({ ...newItemData, category: cat as any })}
                title={t('equipment.picker_category_title', 'Chọn Phân Loại Dụng Cụ')}
                options={getCategoryOptions()}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('equipment.label_quantity', 'Số lượng')}
              </label>
              <input 
                type="number"
                min="1"
                required
                value={newItemData.quantity}
                onChange={e => setNewItemData({...newItemData, quantity: parseInt(e.target.value) || 1})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('equipment.label_condition', 'Tình trạng')}
              </label>
              <OptionPickerModal
                value={newItemData.condition}
                onChange={(cond) => setNewItemData({ ...newItemData, condition: cond as any })}
                title={t('equipment.picker_condition_title', 'Chọn Tình Trạng Dụng Cụ')}
                options={getConditionOptions()}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('equipment.label_custodian', 'Giao cho ai giữ?')}
              </label>
              <PlayerPickerModal
                value={newItemData.assignedPlayerId || null}
                onChange={(id) => setNewItemData({ ...newItemData, assignedPlayerId: id })}
                label={t('equipment.picker_custodian_label', 'Chọn người giữ dụng cụ')}
                placeholder={t('equipment.placeholder_custodian', '-- Bấm để chọn người giữ --')}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('equipment.label_notes', 'Ghi chú')}
            </label>
            <input 
              type="text"
              value={newItemData.notes}
              onChange={e => setNewItemData({...newItemData, notes: e.target.value})}
              className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
              placeholder={t('equipment.placeholder_notes', 'Thương hiệu, đặc điểm nhận dạng...')}
            />
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full hallmark-btn flex items-center justify-center py-3 text-sm font-bold uppercase tracking-wider">
              {t('equipment.btn_save_item', 'LƯU DỤNG CỤ')}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal: Chỉnh Sửa Dụng Cụ */}
      <BottomSheet
        isOpen={editingItem !== null}
        onClose={() => setEditingItem(null)}
        title={
          <span className="flex items-center gap-2">
            <Package size={20} /> {t('equipment.modal_edit_item_title', 'Chỉnh Sửa Dụng Cụ')}
          </span>
        }
      >
        {editingItem && (
          <form onSubmit={handleSaveEditItem} className="space-y-4 pr-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('equipment.label_item_name', 'Tên dụng cụ / Đồ dùng')} *
              </label>
              <input 
                type="text"
                required
                value={editItemData.name}
                onChange={e => setEditItemData({...editItemData, name: e.target.value})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-primary"
                placeholder={t('equipment.placeholder_item_name', 'Ví dụ: Bóng futsal thi đấu, Hộp y tế, Áo bib cam...')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                  {t('equipment.label_category', 'Phân loại')}
                </label>
                <OptionPickerModal
                  value={editItemData.category}
                  onChange={(cat) => setEditItemData({ ...editItemData, category: cat as any })}
                  title={t('equipment.picker_category_title', 'Chọn Phân Loại Dụng Cụ')}
                  options={getCategoryOptions()}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                  {t('equipment.label_quantity', 'Số lượng')}
                </label>
                <input 
                  type="number"
                  min="1"
                  required
                  value={editItemData.quantity}
                  onChange={e => setEditItemData({...editItemData, quantity: parseInt(e.target.value) || 1})}
                  className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-bold text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                  {t('equipment.label_condition', 'Tình trạng')}
                </label>
                <OptionPickerModal
                  value={editItemData.condition}
                  onChange={(cond) => setEditItemData({ ...editItemData, condition: cond as any })}
                  title={t('equipment.picker_condition_title', 'Chọn Tình Trạng Dụng Cụ')}
                  options={getConditionOptions()}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                  {t('equipment.label_custodian', 'Người giữ đồ')}
                </label>
                <PlayerPickerModal
                  value={editItemData.assignedPlayerId || null}
                  onChange={(id) => setEditItemData({ ...editItemData, assignedPlayerId: id })}
                  label={t('equipment.picker_custodian_label', 'Chọn người giữ dụng cụ')}
                  placeholder={t('equipment.placeholder_edit_custodian', '-- Chưa giao cho ai --')}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
                {t('equipment.label_notes', 'Ghi chú')}
              </label>
              <input 
                type="text"
                value={editItemData.notes}
                onChange={e => setEditItemData({...editItemData, notes: e.target.value})}
                className="w-full border-2 border-border-main bg-surface p-3 rounded-none focus:border-primary outline-none font-medium"
                placeholder={t('equipment.placeholder_notes', 'Thương hiệu, đặc điểm nhận dạng...')}
              />
            </div>

            <div className="pt-2 flex items-center gap-2.5 sm:gap-3">
              <button 
                type="button"
                onClick={() => setShowDeleteItemConfirm(true)}
                className="px-3.5 sm:px-4 py-3 bg-rose-500/10 border-2 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500 font-display uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-bold whitespace-nowrap shrink-0 active:scale-95"
                title={t('equipment.btn_delete_item', 'XÓA DỤNG CỤ')}
              >
                <Trash2 size={16} className="shrink-0" />
                <span>{t('equipment.btn_delete_item', 'XÓA DỤNG CỤ')}</span>
              </button>
              <button 
                type="submit" 
                className="flex-1 hallmark-btn flex items-center justify-center py-3 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer whitespace-nowrap active:scale-95"
              >
                {t('equipment.btn_save_changes', 'LƯU THAY ĐỔI')}
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Modal: Xác Nhận Xóa Dụng Cụ */}
      <BottomSheet
        isOpen={showDeleteItemConfirm && editingItem !== null}
        onClose={() => setShowDeleteItemConfirm(false)}
        variant="danger"
        title={
          <span className="flex items-center gap-2 text-rose-600">
            <Trash2 size={22} /> {t('equipment.modal_delete_item_title', 'XÁC NHẬN XÓA DỤNG CỤ')}
          </span>
        }
      >
        <div className="space-y-4">
          <p className="text-text-main text-sm leading-relaxed">
            {t('equipment.delete_item_prompt', 'Bạn có chắc chắn muốn xóa dụng cụ khỏi danh sách không?')} <span className="font-bold text-primary">"{editingItem?.name}"</span>
          </p>
          <p className="text-xs text-text-muted italic">
            {t('equipment.delete_item_note', 'Hành động này không thể hoàn tác sau khi thực hiện.')}
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteItemConfirm(false)}
              className="flex-1 bg-surface text-text-muted font-display uppercase tracking-wider py-3 border-2 border-border-main hover:bg-surface-2 transition-colors cursor-pointer text-xs font-bold"
            >
              {t('equipment.btn_cancel', 'HỦY BỎ')}
            </button>
            <button
              type="button"
              onClick={handleDeleteItem}
              className="flex-1 bg-rose-600 text-white font-display uppercase tracking-wider py-3 border-2 border-rose-700 hover:bg-rose-700 transition-colors cursor-pointer text-xs font-bold"
            >
              {t('equipment.btn_confirm_delete', 'XÁC NHẬN XÓA')}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* Modal: Cấp Phát Số Áo */}
      <BottomSheet
        isOpen={selectedJerseyNumber !== null}
        onClose={() => setSelectedJerseyNumber(null)}
        title={`${t('equipment.modal_assign_jersey_title', 'Cấp Phát Số Áo')} #${selectedJerseyNumber}`}
      >
        <form onSubmit={handleSaveJerseyAssignment} className="space-y-4 pr-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('equipment.label_select_player_jersey', 'Chọn cầu thủ nhận số áo')} #{selectedJerseyNumber}
            </label>
            <PlayerPickerModal
              value={jerseyPlayerId || null}
              onChange={(id) => setJerseyPlayerId(id)}
              label={`${t('equipment.label_select_player_jersey', 'Chọn cầu thủ nhận số áo')} #${selectedJerseyNumber}`}
              placeholder={t('equipment.placeholder_select_player', '-- Bấm để chọn cầu thủ --')}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              {t('equipment.label_jersey_size', 'Cỡ áo (Size)')}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['S', 'M', 'L', 'XL', 'XXL'] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setJerseySize(size)}
                  className={`py-2 text-sm font-display font-bold border-2 transition-colors ${
                    jerseySize === size 
                      ? 'bg-primary text-white border-primary' 
                      : 'bg-surface border-border-main text-text-muted hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            {jerseyPlayerId && (
              <button 
                type="button"
                onClick={() => {
                  if (selectedJerseyNumber !== null) {
                    const previousOwner = players.find(p => p.jersey_number === selectedJerseyNumber);
                    if (previousOwner) {
                      updatePlayer(previousOwner.id, { jersey_number: null });
                    }
                    unassignJersey(selectedJerseyNumber);
                    setSelectedJerseyNumber(null);
                  }
                }}
                className="flex-1 bg-rose-500/10 border-2 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500 font-display uppercase tracking-wider py-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-bold"
              >
                {t('equipment.btn_revoke_jersey', 'Thu hồi số áo')}
              </button>
            )}
            <button 
              type="submit" 
              className="flex-1 hallmark-btn flex items-center justify-center py-3 text-xs sm:text-sm font-bold uppercase tracking-wider cursor-pointer"
            >
              {t('equipment.btn_confirm_jersey', 'XÁC NHẬN CẤP SỐ ÁO')}
            </button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
