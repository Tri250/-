// ============================================
// PawSync Pro 3.0 - Alert Level Cards Component
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 分级健康预警卡片 - 不同等级预警对应不同视觉效果
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle2,
  Phone,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  Bell,
  MapPin,
  Stethoscope,
  X,
  Check
} from 'lucide-react';
import { aiHealthAlertService } from '../../services/aiHealthAlertService';
import type { AIBehaviorAlert, AlertLevel, VetHospital } from '../../types/advanced-health';

interface AlertCardsComponentProps {
  petId: string;
  petName: string;
}

export function AlertCardsComponent({ petId, petName }: AlertCardsComponentProps) {
  const [alerts, setAlerts] = useState<AIBehaviorAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [showVetModal, setShowVetModal] = useState(false);
  const [nearbyVets, setNearbyVets] = useState<VetHospital[]>([]);

  useEffect(() => {
    loadAlerts();
  }, [petId]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await aiHealthAlertService.getAIBehaviorAlerts(petId);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    await aiHealthAlertService.acknowledgeBehaviorAlert(alertId);
    setAlerts(prev => prev.map(a => 
      a.id === alertId 
        ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() }
        : a
    ));
  };

  const handleCallVet = async () => {
    const vets = await aiHealthAlertService.getNearbyVetHospitals();
    setNearbyVets(vets);
    setShowVetModal(true);
  };

  const getAlertLevelConfig = (level: AlertLevel) => {
    const configs = {
      green: {
        icon: CheckCircle2,
        bgGradient: 'from-green-50 to-emerald-50',
        borderColor: 'border-green-300',
        iconColor: 'text-green-600',
        iconBg: 'bg-green-100',
        pulseColor: 'bg-green-500',
        badge: 'bg-green-100 text-green-700',
        label: '正常'
      },
      yellow: {
        icon: Info,
        bgGradient: 'from-yellow-50 to-amber-50',
        borderColor: 'border-yellow-300',
        iconColor: 'text-yellow-600',
        iconBg: 'bg-yellow-100',
        pulseColor: 'bg-yellow-500',
        badge: 'bg-yellow-100 text-yellow-700',
        label: '注意'
      },
      orange: {
        icon: AlertCircle,
        bgGradient: 'from-orange-50 to-red-50',
        borderColor: 'border-orange-300',
        iconColor: 'text-orange-600',
        iconBg: 'bg-orange-100',
        pulseColor: 'bg-orange-500',
        badge: 'bg-orange-100 text-orange-700',
        label: '警告'
      },
      red: {
        icon: AlertTriangle,
        bgGradient: 'from-red-50 to-pink-50',
        borderColor: 'border-red-300',
        iconColor: 'text-red-600',
        iconBg: 'bg-red-100',
        pulseColor: 'bg-red-500',
        badge: 'bg-red-100 text-red-700',
        label: '紧急'
      }
    };
    return configs[level];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  const renderAlertCard = (alert: AIBehaviorAlert, index: number) => {
    const config = getAlertLevelConfig(alert.alertLevel);
    const Icon = config.icon;
    const isExpanded = expandedAlert === alert.id;
    const behaviorConfig = aiHealthAlertService.getBehaviorConfig(alert.behaviorType);

    return (
      <motion.div
        key={alert.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className={`relative bg-gradient-to-br ${config.bgGradient} rounded-2xl border-2 ${config.borderColor} overflow-hidden ${
          alert.alertLevel === 'red' ? 'shadow-lg shadow-red-500/20' : 'shadow-sm'
        }`}
      >
        {/* 呼吸/脉冲动画效果 */}
        {(alert.alertLevel === 'orange' || alert.alertLevel === 'red') && (
          <motion.div
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.02, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className={`w-full h-full ${config.pulseColor}`} />
          </motion.div>
        )}

        {/* 闪烁告警效果 - 仅红色 */}
        {alert.alertLevel === 'red' && (
          <motion.div
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute inset-0 bg-red-500 pointer-events-none"
          />
        )}

        <div className="relative z-10 p-4">
          {/* 头部信息 */}
          <div className="flex items-start gap-3 mb-3">
            <motion.div
              whileHover={{ scale: 1.1 }}
              className={`w-12 h-12 rounded-xl ${config.iconBg} flex items-center justify-center ${alert.alertLevel === 'red' ? 'animate-pulse' : ''}`}
            >
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </motion.div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-gray-800">
                  {behaviorConfig.label}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.badge}`}>
                  {config.label}
                </span>
                {alert.vetRequired && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    需就医
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{alert.description}</p>
            </div>

            {!alert.acknowledged && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAcknowledge(alert.id)}
                className="p-2 rounded-lg bg-white/80 hover:bg-white transition-colors"
              >
                <Check className="w-4 h-4 text-gray-600" />
              </motion.button>
            )}
          </div>

          {/* 置信度与时间 */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                AI置信度: <span className="font-medium text-gray-700">{(alert.confidence * 100).toFixed(0)}%</span>
              </span>
              {alert.frequency && (
                <span className="text-xs text-gray-500">
                  发生次数: <span className="font-medium text-gray-700">{alert.frequency}次</span>
                </span>
              )}
              {alert.duration && (
                <span className="text-xs text-gray-500">
                  持续: <span className="font-medium text-gray-700">{alert.duration}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {formatTimestamp(alert.timestamp)}
            </div>
          </div>

          {/* 可展开详情 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 border-t border-gray-200/50 space-y-3">
                  {/* 建议 */}
                  <div className="bg-white/60 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">AI建议</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{alert.recommendation}</p>
                  </div>

                  {/* 相关症状 */}
                  {behaviorConfig.symptoms.length > 0 && (
                    <div className="bg-white/60 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Stethoscope className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">可能症状</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {behaviorConfig.symptoms.map((symptom, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full">
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    {alert.vetRequired && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCallVet}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">拨打24小时兽医热线</span>
                      </motion.button>
                    )}
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-4 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      {alert.acknowledged ? '已确认' : '确认'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 展开/收起按钮 */}
          <button
            onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
            className="w-full mt-3 flex items-center justify-center gap-1 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? (
              <>
                收起详情 <ChevronUp className="w-4 h-4" />
              </>
            ) : (
              <>
                查看详情 <ChevronDown className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* 已确认标识 */}
        {alert.acknowledged && (
          <div className="absolute top-2 right-2">
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
              <Eye className="w-3 h-3" />
              已确认
            </span>
          </div>
        )}
      </motion.div>
    );
  };

  // 兽医电话模态框
  const VetModal = () => (
    <AnimatePresence>
      {showVetModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowVetModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md max-h-[80vh] overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-red-500" />
                附近24小时兽医医院
              </h3>
              <button
                onClick={() => setShowVetModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto max-h-96">
              {nearbyVets.map((vet) => (
                <motion.div
                  key={vet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-800">{vet.name}</h4>
                      {vet.is24Hours && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full mt-1 inline-block">
                          24小时营业
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      {vet.rating && (
                        <span className="text-sm font-medium text-yellow-500">⭐ {vet.rating}</span>
                      )}
                      {vet.distance && (
                        <span className="text-xs text-gray-500 block mt-1">{vet.distance}km</span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {vet.address}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <a
                      href={`tel:${vet.phone}`}
                      className="flex-1 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Phone className="w-4 h-4" />
                      立即拨打
                    </a>
                    {vet.emergencyServices && (
                      <span className="px-3 py-2.5 bg-red-100 text-red-600 rounded-xl text-xs flex items-center">
                        急诊服务
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowVetModal(false)}
                className="w-full py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                关闭
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  return (
    <div className="space-y-6">
      {/* 未确认预警 */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-semibold text-gray-800">
              待处理预警 ({unacknowledgedAlerts.length})
            </h3>
          </div>
          {unacknowledgedAlerts.map((alert, index) => renderAlertCard(alert, index))}
        </div>
      )}

      {/* 已确认预警 */}
      {acknowledgedAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-500 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            已确认记录 ({acknowledgedAlerts.length})
          </h3>
          {acknowledgedAlerts.map((alert, index) => renderAlertCard(alert, index))}
        </div>
      )}

      {/* 空状态 */}
      {alerts.length === 0 && (
        <div className="text-center py-12">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          </motion.div>
          <p className="text-lg font-medium text-gray-700 mb-2">
            {petName} 健康状态良好
          </p>
          <p className="text-sm text-gray-500">
            目前未检测到异常行为，继续保持！
          </p>
        </div>
      )}

      {/* 兽医电话模态框 */}
      <VetModal />
    </div>
  );
}
