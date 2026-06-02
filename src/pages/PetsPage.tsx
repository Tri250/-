import React, { useState, useRef } from 'react';
import { ChevronLeft, Plus, Trash2, Dog, Cat, Rabbit, Edit2, Save, Upload, X, AlertTriangle, Check, Copy } from 'lucide-react';
import { usePetStore } from '../store/petStore';
import { Pet, PetType, PET_TEMPLATES, getPetTemplate } from '../types/pet';

interface PetsPageProps {
  onNavigate: (page: string) => void;
}

const PET_ICONS: Record<PetType, { emoji: string; color: string }> = {
  dog: { emoji: '🐕', color: 'bg-amber-100 text-amber-600' },
  cat: { emoji: '🐱', color: 'bg-purple-100 text-purple-600' },
  rabbit: { emoji: '🐰', color: 'bg-pink-100 text-pink-600' },
  hamster: { emoji: '🐹', color: 'bg-orange-100 text-orange-600' },
  guinea_pig: { emoji: '🐹', color: 'bg-yellow-100 text-yellow-600' },
  parrot: { emoji: '🦜', color: 'bg-green-100 text-green-600' },
  cockatiel: { emoji: '🦜', color: 'bg-lime-100 text-lime-600' },
  turtle: { emoji: '🐢', color: 'bg-teal-100 text-teal-600' },
  lizard: { emoji: '🦎', color: 'bg-emerald-100 text-emerald-600' },
  snake: { emoji: '🐍', color: 'bg-slate-100 text-slate-600' },
  fish: { emoji: '🐠', color: 'bg-blue-100 text-blue-600' },
  other: { emoji: '🐾', color: 'bg-gray-100 text-gray-600' },
};

export const PetsPage: React.FC<PetsPageProps> = ({ onNavigate }) => {
  const { pets, addPet, deletePet, updatePet, setCurrentPet, currentPetId, importPetsFromCSV, importPetsFromJSON } = usePetStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [keepHealthData, setKeepHealthData] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; duplicates: number; errors: string[] } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newPet, setNewPet] = useState({
    name: '',
    type: 'cat' as PetType,
    breed: '',
    gender: 'male' as 'male' | 'female' | 'unknown',
    birthday: '',
    weight: '',
    color: '',
    characteristics: '',
  });

  const handleAddPet = () => {
    if (!newPet.name.trim()) return;
    
    addPet({
      ...newPet,
      weight: parseFloat(newPet.weight) || 0,
      healthStatus: 'good',
      avatar: '',
    });
    
    setNewPet({
      name: '',
      type: 'cat',
      breed: '',
      gender: 'male',
      birthday: '',
      weight: '',
      color: '',
      characteristics: '',
    });
    setShowAddForm(false);
  };

  const handleEditPet = () => {
    if (!editingPet || !editingPet.name.trim()) return;
    
    updatePet(editingPet.id, {
      name: editingPet.name,
      type: editingPet.type,
      breed: editingPet.breed,
      gender: editingPet.gender,
      birthday: editingPet.birthday,
      weight: editingPet.weight,
      color: editingPet.color,
      characteristics: editingPet.characteristics,
    });
    
    setEditingPet(null);
    setShowEditForm(false);
  };

  const handleDeletePet = (petId: string) => {
    deletePet(petId, keepHealthData);
    setShowDeleteConfirm(null);
    setKeepHealthData(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      if (file.name.endsWith('.csv')) {
        const result = importPetsFromCSV(content);
        setImportResult(result);
      } else if (file.name.endsWith('.json')) {
        try {
          const jsonData = JSON.parse(content);
          const pets = Array.isArray(jsonData) ? jsonData : jsonData.pets || [];
          const result = importPetsFromJSON(pets);
          setImportResult(result);
        } catch {
          setImportResult({ success: 0, duplicates: 0, errors: ['JSON文件格式错误'] });
        }
      }
    };
    reader.readAsText(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyUniqueCode = (code: string, petId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(petId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (pet: Pet) => {
    setEditingPet({ ...pet });
    setShowEditForm(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <header className="bg-gradient-to-br from-primary-500 to-primary-600 text-white px-4 py-6">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNavigate('home');
            }}
            className="p-2 -ml-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">宠物档案</h1>
            <p className="text-sm text-white/80">管理您的宠物信息</p>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowImportModal(true);
            }}
            className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
          >
            <Upload className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowAddForm(true);
            }}
            className="p-2 rounded-full bg-white/20 backdrop-blur hover:bg-white/30 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {pets.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
              <Dog className="w-12 h-12 text-primary-500" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">还没有宠物</h2>
            <p className="text-sm text-neutral-500 mb-6">添加您的第一只宠物开始记录</p>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddForm(true);
              }}
              className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              添加宠物
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pets.map((pet) => {
              const typeInfo = PET_ICONS[pet.type] || PET_ICONS.other;
              
              return (
                <div 
                  key={pet.id}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    pet.id === currentPetId
                      ? 'bg-white border-primary-500 shadow-lg'
                      : 'bg-white border-neutral-200 hover:border-primary-300'
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentPet(pet.id);
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl ${typeInfo.color} flex items-center justify-center`}>
                      {pet.avatar ? (
                        <img src={pet.avatar} alt={pet.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <span className="text-2xl">{typeInfo.emoji}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-800 truncate">{pet.name}</h3>
                        <span className="text-xs text-neutral-400">
                          {pet.gender === 'male' ? '公' : pet.gender === 'female' ? '母' : '未知'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500 truncate">{pet.breed || getPetTemplate(pet.type)?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-neutral-400 truncate">
                          {pet.weight}kg · {pet.color}
                        </p>
                      </div>
                      <div 
                        className="flex items-center gap-1 mt-1 cursor-pointer hover:bg-neutral-100 rounded px-1 py-0.5 -ml-1"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          copyUniqueCode(pet.uniqueCode, pet.id);
                        }}
                      >
                        <span className="text-xs text-primary-500 font-mono">{pet.uniqueCode}</span>
                        {copiedId === pet.id ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 text-neutral-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startEdit(pet);
                        }}
                        className="p-2 rounded-full hover:bg-blue-50 text-blue-500 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowDeleteConfirm(pet.id);
                        }}
                        className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-w-md mx-auto p-6 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">添加新宠物</h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowAddForm(false);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">宠物名称 *</label>
                <input
                  type="text"
                  value={newPet.name}
                  onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                  placeholder="输入宠物名字"
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">宠物类型</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {PET_TEMPLATES.map((template) => {
                    const info = PET_ICONS[template.type];
                    return (
                      <button
                        key={template.type}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNewPet({ ...newPet, type: template.type });
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                          newPet.type === template.type
                            ? `${info.color} ring-2 ring-offset-2 ring-primary-500`
                            : 'bg-neutral-100 hover:bg-neutral-200'
                        }`}
                      >
                        <span className="text-lg">{template.icon}</span>
                        <span className="text-xs font-medium truncate w-full text-center">{template.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">品种</label>
                  <input
                    type="text"
                    value={newPet.breed}
                    onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                    placeholder="品种"
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">性别</label>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNewPet({ ...newPet, gender: 'male' });
                      }}
                      className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        newPet.gender === 'male'
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      公
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setNewPet({ ...newPet, gender: 'female' });
                      }}
                      className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        newPet.gender === 'female'
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      母
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">生日</label>
                  <input
                    type="date"
                    value={newPet.birthday}
                    onChange={(e) => setNewPet({ ...newPet, birthday: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newPet.weight}
                    onChange={(e) => setNewPet({ ...newPet, weight: e.target.value })}
                    placeholder="0.0"
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">毛色</label>
                <input
                  type="text"
                  value={newPet.color}
                  onChange={(e) => setNewPet({ ...newPet, color: e.target.value })}
                  placeholder="例如：橘白"
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">性格特点</label>
                <textarea
                  value={newPet.characteristics}
                  onChange={(e) => setNewPet({ ...newPet, characteristics: e.target.value })}
                  placeholder="描述宠物的性格特点..."
                  rows={2}
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                />
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddPet();
                }}
                disabled={!newPet.name.trim()}
                className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  newPet.name.trim()
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-5 h-5" />
                保存宠物信息
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && editingPet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-w-md mx-auto p-6 pb-8 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">编辑宠物信息</h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEditForm(false);
                  setEditingPet(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">宠物名称 *</label>
                <input
                  type="text"
                  value={editingPet.name}
                  onChange={(e) => setEditingPet({ ...editingPet, name: e.target.value })}
                  placeholder="输入宠物名字"
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">宠物类型</label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                  {PET_TEMPLATES.map((template) => {
                    const info = PET_ICONS[template.type];
                    return (
                      <button
                        key={template.type}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingPet({ ...editingPet, type: template.type });
                        }}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                          editingPet.type === template.type
                            ? `${info.color} ring-2 ring-offset-2 ring-primary-500`
                            : 'bg-neutral-100 hover:bg-neutral-200'
                        }`}
                      >
                        <span className="text-lg">{template.icon}</span>
                        <span className="text-xs font-medium truncate w-full text-center">{template.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">品种</label>
                  <input
                    type="text"
                    value={editingPet.breed || ''}
                    onChange={(e) => setEditingPet({ ...editingPet, breed: e.target.value })}
                    placeholder="品种"
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">性别</label>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingPet({ ...editingPet, gender: 'male' });
                      }}
                      className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        editingPet.gender === 'male'
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      公
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingPet({ ...editingPet, gender: 'female' });
                      }}
                      className={`flex-1 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                        editingPet.gender === 'female'
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                      }`}
                    >
                      母
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">生日</label>
                  <input
                    type="date"
                    value={editingPet.birthday || ''}
                    onChange={(e) => setEditingPet({ ...editingPet, birthday: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">体重 (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingPet.weight || ''}
                    onChange={(e) => setEditingPet({ ...editingPet, weight: parseFloat(e.target.value) || 0 })}
                    placeholder="0.0"
                    className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">毛色</label>
                <input
                  type="text"
                  value={editingPet.color || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, color: e.target.value })}
                  placeholder="例如：橘白"
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">性格特点</label>
                <textarea
                  value={editingPet.characteristics || ''}
                  onChange={(e) => setEditingPet({ ...editingPet, characteristics: e.target.value })}
                  placeholder="描述宠物的性格特点..."
                  rows={2}
                  className="w-full px-4 py-3 bg-neutral-100 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                />
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleEditPet();
                }}
                disabled={!editingPet.name.trim()}
                className={`w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  editingPet.name.trim()
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:shadow-lg'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
              >
                <Save className="w-5 h-5" />
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-800">确认删除</h3>
                <p className="text-sm text-neutral-500">此操作无法撤销</p>
              </div>
            </div>
            
            <p className="text-neutral-600 mb-4">
              确定要删除这只宠物吗？删除后档案将无法恢复。
            </p>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={keepHealthData}
                onChange={(e) => setKeepHealthData(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-neutral-600">保留健康数据（疫苗、体检、成长记录）</span>
            </label>

            <div className="flex gap-3">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowDeleteConfirm(null);
                  setKeepHealthData(false);
                }}
                className="flex-1 py-3 rounded-xl bg-neutral-100 text-neutral-600 font-medium hover:bg-neutral-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeletePet(showDeleteConfirm);
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-w-md mx-auto p-6 pb-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-800">导入宠物档案</h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-neutral-500">
                支持 CSV 和 JSON 格式的文件导入。导入时会自动跳过重复的宠物记录。
              </p>

              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileImport}
                  className="hidden"
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors"
                >
                  选择文件
                </button>
                <p className="text-xs text-neutral-400 mt-2">支持 .csv 和 .json 文件</p>
              </div>

              {importResult && (
                <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">成功导入 {importResult.success} 条记录</span>
                  </div>
                  {importResult.duplicates > 0 && (
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">跳过 {importResult.duplicates} 条重复记录</span>
                    </div>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="text-red-500 text-sm">
                      {importResult.errors.map((error, i) => (
                        <div key={i}>{error}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="bg-neutral-50 rounded-xl p-4">
                <h4 className="text-sm font-medium text-neutral-700 mb-2">CSV 格式要求：</h4>
                <p className="text-xs text-neutral-500">
                  标题行包含：name(名称), type(类型), breed(品种), gender(性别), birthday(生日), weight(体重), color(毛色)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};