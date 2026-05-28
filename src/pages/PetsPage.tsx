
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Dog, Cat, PawPrint, Heart, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Card } from '../components/DesignSystem/Card';
import { Button } from '../components/DesignSystem/Button';

export default function PetsPage() {
  const { pets, currentPet, setCurrentPet, addPet, updatePet, deletePet } = useAppStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPet, setEditingPet] = useState<typeof pets[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'CAT' as const,
    breed: '',
    gender: 'UNKNOWN' as const,
    birthday: '',
    weight: '',
    color: '',
    characteristics: '',
  });

  const handleAddPet = () => {
    if (!formData.name || !formData.breed) return;
    
    addPet({
      ...formData,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      healthStatus: 'GOOD',
    });
    
    setFormData({
      name: '',
      type: 'CAT',
      breed: '',
      gender: 'UNKNOWN',
      birthday: '',
      weight: '',
      color: '',
      characteristics: '',
    });
    setShowAddModal(false);
  };

  const handleEditPet = () => {
    if (!editingPet || !formData.name) return;
    
    updatePet(editingPet.id, {
      ...formData,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
    });
    
    setEditingPet(null);
    setShowEditModal(false);
  };

  const openEditModal = (pet: typeof pets[0]) => {
    setEditingPet(pet);
    setFormData({
      name: pet.name,
      type: pet.type,
      breed: pet.breed,
      gender: pet.gender,
      birthday: pet.birthday || '',
      weight: pet.weight?.toString() || '',
      color: pet.color || '',
      characteristics: pet.characteristics || '',
    });
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 头部 */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-neutral-800">我的宠物</h1>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={20} className="mr-2" />
            添加宠物
          </Button>
        </div>
      </div>

      {/* 宠物列表 */}
      <div className="px-4 py-6">
        <div className="grid gap-4">
          {pets.map((pet, index) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                hover 
                className={`p-4 ${currentPet?.id === pet.id ? 'ring-2 ring-primary-500' : ''}`}
                onClick={() => setCurrentPet(pet)}
              >
                <div className="flex items-center gap-4">
                  {/* 宠物头像 */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                    pet.type === 'DOG' ? 'bg-primary-100' :
                    pet.type === 'CAT' ? 'bg-purple-100' :
                    'bg-neutral-100'
                  }`}>
                    {pet.type === 'DOG' ? (
                      <Dog size={32} className="text-primary-600" />
                    ) : pet.type === 'CAT' ? (
                      <Cat size={32} className="text-purple-600" />
                    ) : (
                      <PawPrint size={32} className="text-neutral-600" />
                    )}
                  </div>
                  
                  {/* 宠物信息 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-neutral-800">{pet.name}</h3>
                      {currentPet?.id === pet.id && (
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">当前</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-500">{pet.breed} · {pet.gender === 'MALE' ? '公' : pet.gender === 'FEMALE' ? '母' : '未知'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-neutral-400">{pet.weight}kg</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        pet.healthStatus === 'EXCELLENT' ? 'bg-success-100 text-success-600' :
                        pet.healthStatus === 'GOOD' ? 'bg-green-100 text-green-600' :
                        pet.healthStatus === 'FAIR' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {pet.healthStatus === 'EXCELLENT' ? '极佳' :
                         pet.healthStatus === 'GOOD' ? '良好' :
                         pet.healthStatus === 'FAIR' ? '一般' : '关注'}
                      </span>
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditModal(pet); }}
                      className="p-2 text-neutral-400 hover:text-primary-500 transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePet(pet.id); }}
                      className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                    <ChevronRight size={20} className="text-neutral-400" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* 空状态 */}
        {pets.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <Heart size={40} className="text-neutral-400" />
            </div>
            <p className="text-neutral-500 mb-4">还没有添加宠物</p>
            <Button onClick={() => setShowAddModal(true)}>添加第一只宠物</Button>
          </div>
        )}
      </div>

      {/* 添加宠物弹窗 */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-neutral-800 mb-6">添加宠物</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">宠物名字</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="输入宠物名字"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">宠物类型</label>
                  <div className="flex gap-2">
                    {(['CAT', 'DOG', 'OTHER'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, type })}
                        className={`flex-1 py-3 rounded-xl border transition-all ${
                          formData.type === type 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {type === 'CAT' ? <Cat size={20} /> : type === 'DOG' ? <Dog size={20} /> : <PawPrint size={20} />}
                        <span className="ml-2 text-sm">{type === 'CAT' ? '猫咪' : type === 'DOG' ? '狗狗' : '其他'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">品种</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="输入品种"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">性别</label>
                  <div className="flex gap-2">
                    {(['MALE', 'FEMALE', 'UNKNOWN'] as const).map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setFormData({ ...formData, gender })}
                        className={`flex-1 py-3 rounded-xl border transition-all ${
                          formData.gender === gender 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-sm">{gender === 'MALE' ? '公' : gender === 'FEMALE' ? '母' : '未知'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">生日</label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">体重 (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="0.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">颜色</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="如：金色、银渐层"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">特点描述</label>
                  <textarea
                    value={formData.characteristics}
                    onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                    placeholder="描述一下你的宠物"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-medium"
                >
                  取消
                </button>
                <Button onClick={handleAddPet} className="flex-1">
                  添加宠物
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 编辑宠物弹窗 */}
      <AnimatePresence>
        {showEditModal && editingPet && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full rounded-t-3xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-neutral-800 mb-6">编辑宠物信息</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">宠物名字</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">宠物类型</label>
                  <div className="flex gap-2">
                    {(['CAT', 'DOG', 'OTHER'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, type })}
                        className={`flex-1 py-3 rounded-xl border transition-all ${
                          formData.type === type 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {type === 'CAT' ? <Cat size={20} /> : type === 'DOG' ? <Dog size={20} /> : <PawPrint size={20} />}
                        <span className="ml-2 text-sm">{type === 'CAT' ? '猫咪' : type === 'DOG' ? '狗狗' : '其他'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">品种</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">性别</label>
                  <div className="flex gap-2">
                    {(['MALE', 'FEMALE', 'UNKNOWN'] as const).map((gender) => (
                      <button
                        key={gender}
                        onClick={() => setFormData({ ...formData, gender })}
                        className={`flex-1 py-3 rounded-xl border transition-all ${
                          formData.gender === gender 
                            ? 'border-primary-500 bg-primary-50' 
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <span className="text-sm">{gender === 'MALE' ? '公' : gender === 'FEMALE' ? '母' : '未知'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">生日</label>
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">体重 (kg)</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">颜色</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">特点描述</label>
                  <textarea
                    value={formData.characteristics}
                    onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-200 text-neutral-700 font-medium"
                >
                  取消
                </button>
                <Button onClick={handleEditPet} className="flex-1">
                  保存修改
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
