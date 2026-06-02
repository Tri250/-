import React, { useState } from 'react';
import { ChevronLeft, Plus, Trash2, Dog, Cat, Rabbit, Save } from 'lucide-react';
import { usePetStore } from '../store/petStore';

interface PetsPageProps {
  onNavigate: (page: string) => void;
}

export const PetsPage: React.FC<PetsPageProps> = ({ onNavigate }) => {
  const { pets, addPet, deletePet, setCurrentPet, currentPetId } = usePetStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPet, setNewPet] = useState({
    name: '',
    type: 'cat' as 'cat' | 'dog' | 'other',
    breed: '',
    gender: 'male' as 'male' | 'female',
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

  const petTypeIcons: Record<string, { icon: any; emoji: string; color: string }> = {
    cat: { icon: Cat, emoji: '🐱', color: 'bg-purple-100 text-purple-600' },
    dog: { icon: Dog, emoji: '🐕', color: 'bg-amber-100 text-amber-600' },
    other: { icon: Rabbit, emoji: '🐾', color: 'bg-blue-100 text-blue-600' },
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
              const typeInfo = petTypeIcons[pet.type] || petTypeIcons.cat;
              const TypeIcon = typeInfo.icon;
              
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-800">{pet.name}</h3>
                        <span className="text-xs text-neutral-400">
                          {pet.gender === 'male' ? '公' : '母'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-500">{pet.breed}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {pet.weight}kg · {pet.color}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (confirm(`确定删除${pet.name}吗？`)) {
                          deletePet(pet.id);
                        }
                      }}
                      className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="w-full bg-white rounded-t-3xl max-w-md mx-auto p-6 pb-8 animate-slide-up">
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
                <div className="grid grid-cols-3 gap-2">
                  {(['cat', 'dog', 'other'] as const).map((type) => {
                    const info = petTypeIcons[type];
                    const TypeIcon = info.icon;
                    return (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setNewPet({ ...newPet, type });
                        }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                          newPet.type === type
                            ? `${info.color} ring-2 ring-offset-2 ring-primary-500`
                            : 'bg-neutral-100 hover:bg-neutral-200'
                        }`}
                      >
                        <TypeIcon className="w-6 h-6" />
                        <span className="text-xs font-medium">
                          {type === 'cat' ? '猫咪' : type === 'dog' ? '狗狗' : '其他'}
                        </span>
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
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
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
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
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
    </div>
  );
};