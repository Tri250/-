import { useState } from 'react';
import { PawPrint, Cat, Dog, Plus, ChevronRight, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppStore } from '../store/appStore';

interface OnboardingPageProps {
  onComplete: () => void;
}

type PetType = 'cat' | 'dog' | 'other';

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState(1);
  const [petData, setPetData] = useState({
    name: '',
    type: 'cat' as PetType,
    breed: '',
    age: '',
  });
  const { addPet, setCurrentPet, completeOnboarding } = useAppStore();

  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const finishOnboarding = () => {
    const newPet = {
      name: petData.name,
      type: petData.type,
      breed: petData.breed || (petData.type === 'cat' ? '田园猫' : petData.type === 'dog' ? '田园犬' : '小宝贝'),
      age: petData.age ? parseInt(petData.age) : 1,
      avatarUrl: '',
    };
    addPet(newPet);
    setCurrentPet({ ...newPet, id: Date.now().toString() });
    completeOnboarding();
    onComplete();
  };

  const updatePetData = (field: string, value: any) => {
    setPetData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep1 = () => (
    <div className="text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-peach-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <PawPrint className="w-12 h-12 text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">欢迎加入！</h2>
      <p className="text-gray-500 mb-8">让我们一起开始这段美好的旅程吧</p>
      
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">你的毛孩子是？</h3>
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => updatePetData('type', 'cat')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              petData.type === 'cat'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-300'
            }`}
          >
            <Cat className={`w-12 h-12 mx-auto mb-2 ${petData.type === 'cat' ? 'text-orange-500' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${petData.type === 'cat' ? 'text-orange-600' : 'text-gray-600'}`}>
              猫咪
            </p>
          </button>
          <button
            onClick={() => updatePetData('type', 'dog')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              petData.type === 'dog'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-300'
            }`}
          >
            <Dog className={`w-12 h-12 mx-auto mb-2 ${petData.type === 'dog' ? 'text-orange-500' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${petData.type === 'dog' ? 'text-orange-600' : 'text-gray-600'}`}>
              狗狗
            </p>
          </button>
          <button
            onClick={() => updatePetData('type', 'other')}
            className={`p-6 rounded-2xl border-2 transition-all ${
              petData.type === 'other'
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-300'
            }`}
          >
            <PawPrint className={`w-12 h-12 mx-auto mb-2 ${petData.type === 'other' ? 'text-orange-500' : 'text-gray-400'}`} />
            <p className={`text-sm font-medium ${petData.type === 'other' ? 'text-orange-600' : 'text-gray-600'}`}>
              其他
            </p>
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="text-5xl">
          {petData.type === 'cat' ? '🐱' : petData.type === 'dog' ? '🐶' : '🐾'}
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">它叫什么名字？</h2>
      <p className="text-gray-500 mb-8">告诉我们你宝贝的名字</p>

      <div className="space-y-4">
        <input
          type="text"
          value={petData.name}
          onChange={(e) => updatePetData('name', e.target.value)}
          className="w-full px-4 py-4 text-center text-xl border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
          placeholder="输入名字..."
          autoFocus
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">品种（可选）</label>
          <input
            type="text"
            value={petData.breed}
            onChange={(e) => updatePetData('breed', e.target.value)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            placeholder="比如：布偶猫、金毛犬..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <div className="text-5xl">🎂</div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">它多大了？</h2>
      <p className="text-gray-500 mb-8">这有助于我们提供更贴心的建议</p>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">年龄</label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                const current = parseInt(petData.age) || 1;
                if (current > 1) updatePetData('age', (current - 1).toString());
              }}
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <span className="text-2xl">-</span>
            </button>
            <input
              type="number"
              value={petData.age}
              onChange={(e) => updatePetData('age', e.target.value)}
              className="w-24 text-center text-4xl font-bold text-gray-800 border-b-2 border-orange-500 focus:outline-none"
              min="0"
            />
            <button
              onClick={() => {
                const current = parseInt(petData.age) || 0;
                updatePetData('age', (current + 1).toString());
              }}
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <span className="text-2xl">+</span>
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">岁</p>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-peach-50 rounded-xl p-4 border border-orange-100">
          <p className="text-sm text-gray-600">
            准备好了吗？让我们开始了解 {petData.name || '你的宝贝'} 吧！
          </p>
        </div>
      </div>
    </div>
  );

  const isStepValid = () => {
    if (step === 1) return true;
    if (step === 2) return petData.name.trim().length > 0;
    if (step === 3) return true;
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-peach-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  s < step
                    ? 'bg-orange-500 text-white'
                    : s === step
                    ? 'bg-orange-500 text-white scale-110'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-1 mx-1 rounded transition-all ${
                    s < step ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card variant="default" padding="large" className="shadow-xl">
          <div className="min-h-[400px]">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </div>

          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handleBack}
              >
                上一步
              </Button>
            )}
            <Button
              className={`flex-1 ${step === 1 ? 'w-full' : ''}`}
              onClick={handleNext}
              disabled={!isStepValid()}
            >
              {step === totalSteps ? '完成' : '下一步'}
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}