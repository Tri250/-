// ============================================
// PawSync Pro - ServicesPage.tsx
//
// 作者: 带娃的小陈工
// 日期: 2026-05-26
// 描述: 综合服务页面（保险+医疗+训练）- 完整功能实现
// ============================================

import { useState } from 'react';
import { Shield, Stethoscope, ChevronRight, Sparkles, Activity, GraduationCap, FileText, Calendar, Clock, Award, CheckCircle, AlertCircle, Star, Heart, Zap, Phone, MessageSquare, TrendingUp, Play } from 'lucide-react';
import { useInsuranceStore } from '../store/insuranceStore';
import { useMedicalStore } from '../store/medicalStore';
import { useTrainingStore } from '../store/trainingStore';
import { usePetStore } from '../store/petStore';
import { Card, Button, Badge, ProgressRing } from '../components/DesignSystem';
import { useResponsiveStyle } from '../lib/responsiveStyle';

interface ServicesPageProps {
  onNavigate?: (page: string) => void;
}

export default function ServicesPage({ onNavigate }: ServicesPageProps) {
  const { plans, policies, claims } = useInsuranceStore();
  const { consultations, appointments, medicalRecords } = useMedicalStore();
  const { courses, trainingRecords, totalTrainingTime, streakDays } = useTrainingStore();
  const { pets, selectedPetId } = usePetStore();
  const responsive = useResponsiveStyle();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'medical' | 'insurance' | 'training'>('overview');

  const selectedPet = pets.find(p => p.id === selectedPetId);

  // 计算统计数据
  const totalCoverage = (policies || []).reduce((sum, p) => {
    const plan = (plans || []).find(pl => pl?.id === p?.planId);
    return sum + (plan?.annualLimit || 0);
  }, 0);
  const activePolicies = (policies || []).filter(p => p?.status === 'active').length;
  const pendingClaims = (claims || []).filter(c => c?.status === 'under_review').length;
  const upcomingAppointments = (appointments || []).filter(a => a?.status === 'scheduled').length;
  const completedCourses = (courses || []).filter(c => c?.progress === 100).length;
  const totalPointsEarned = (trainingRecords || []).reduce((sum, r) => sum + (r?.success ? 50 : 0), 0);

  const services = [
    {
      id: 'insurance',
      title: '宠物保险',
      description: '全方位保障，守护爱宠健康',
      icon: Shield,
      color: 'from-secondary-500 to-secondary-600',
      bg: 'bg-secondary-50',
      text: 'text-secondary-600',
      badge: activePolicies > 0 ? `${activePolicies}个保单` : '推荐',
      stats: {
        main: activePolicies > 0 ? `¥${totalCoverage.toLocaleString()}` : '立即投保',
        sub: activePolicies > 0 ? '保障总额' : '为爱宠保驾护航'
      }
    },
    {
      id: 'medical',
      title: '医疗咨询',
      description: 'AI 预诊 + 专业兽医问诊',
      icon: Stethoscope,
      color: 'from-warning-500 to-warning-600',
      bg: 'bg-warning-50',
      text: 'text-warning-600',
      badge: upcomingAppointments > 0 ? `${upcomingAppointments}个预约` : '热门',
      stats: {
        main: consultations.length > 0 ? `${consultations.length}次咨询` : 'AI智能预诊',
        sub: consultations.length > 0 ? '历史记录' : '快速诊断症状'
      }
    },
    {
      id: 'training',
      title: '宠物训练',
      description: 'AI 个性化训练课程',
      icon: GraduationCap,
      color: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      badge: completedCourses > 0 ? `${completedCourses}个完成` : '新功能',
      stats: {
        main: `${totalTrainingTime}分钟`,
        sub: '累计训练时长'
      }
    }
  ];

  const quickActions = [
    { icon: Activity, title: '健康档案', desc: '查看完整健康记录', color: 'bg-primary-50', textColor: 'text-primary-600' },
    { icon: Sparkles, title: '健康体检', desc: '预约年度体检服务', color: 'bg-success-50', textColor: 'text-success-600' },
    { icon: FileText, title: '理赔申请', desc: '快速提交理赔请求', color: 'bg-secondary-50', textColor: 'text-secondary-600' },
    { icon: Calendar, title: '预约兽医', desc: '在线预约问诊', color: 'bg-warning-50', textColor: 'text-warning-600' },
    { icon: MessageSquare, title: 'AI咨询', desc: '智能症状分析', color: 'bg-info-50', textColor: 'text-info-600' },
    { icon: Award, title: '训练课程', desc: '开始训练计划', color: 'bg-purple-50', textColor: 'text-purple-600' }
  ];

  // 获取最近活动
  const getRecentActivities = () => {
    const activities = [];
    
    // 最近咨询
    if (consultations.length > 0) {
      const latestConsultation = consultations[0];
      activities.push({
        type: 'consultation',
        title: 'AI咨询完成',
        description: latestConsultation.diagnosis?.slice(0, 50) || '症状分析完成',
        date: latestConsultation.date,
        icon: MessageSquare,
        color: 'warning'
      });
    }
    
    // 最近预约
    if (appointments.length > 0) {
      const latestAppointment = appointments[0];
      activities.push({
        type: 'appointment',
        title: latestAppointment.purpose,
        description: `${latestAppointment.clinicName} - ${latestAppointment.vetName}`,
        date: latestAppointment.date,
        icon: Calendar,
        color: 'secondary'
      });
    }
    
    // 最近训练
    if (trainingRecords.length > 0) {
      const latestTraining = trainingRecords[0];
      activities.push({
        type: 'training',
        title: latestTraining.courseTitle,
        description: `训练${latestTraining.success ? '成功' : '进行中'} - ${latestTraining.duration}分钟`,
        date: latestTraining.date,
        icon: GraduationCap,
        color: 'purple'
      });
    }
    
    // 最近理赔
    if (claims.length > 0) {
      const latestClaim = claims[0];
      activities.push({
        type: 'claim',
        title: '理赔申请',
        description: `¥${latestClaim.amount} - ${getClaimStatusLabel(latestClaim.status)}`,
        date: latestClaim.date,
        icon: FileText,
        color: 'secondary'
      });
    }
    
    return activities.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);
  };

  const getClaimStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      submitted: '已提交',
      under_review: '审核中',
      approved: '已批准',
      rejected: '已拒绝'
    };
    return labels[status] || status;
  };

  const getActivityColor = (color: string) => {
    const colors: Record<string, string> = {
      warning: 'bg-warning-100 text-warning-600',
      secondary: 'bg-secondary-100 text-secondary-600',
      purple: 'bg-purple-100 text-purple-600',
      primary: 'bg-primary-100 text-primary-600'
    };
    return colors[color] || 'bg-neutral-100 text-neutral-600';
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 text-white px-6 py-8" style={{ paddingTop: responsive.safeAreaPadding.paddingTop + 32 }}>
        <div style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
          <h1 className="text-2xl font-bold mb-2">爱宠服务</h1>
          <p className="text-secondary-100 mb-6">全面的宠物健康与保障服务</p>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <Shield className="w-5 h-5 mx-auto mb-1" />
              <div className="text-lg font-bold">{activePolicies}</div>
              <div className="text-xs text-secondary-100">保单</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1" />
              <div className="text-lg font-bold">{upcomingAppointments}</div>
              <div className="text-xs text-secondary-100">预约</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <GraduationCap className="w-5 h-5 mx-auto mb-1" />
              <div className="text-lg font-bold">{completedCourses}</div>
              <div className="text-xs text-secondary-100">课程</div>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-xl p-3 text-center">
              <Award className="w-5 h-5 mx-auto mb-1" />
              <div className="text-lg font-bold">{totalPointsEarned}</div>
              <div className="text-xs text-secondary-100">积分</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-4 sticky top-0 bg-neutral-50 z-10">
        <div className="flex gap-2" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
          {(['overview', 'medical', 'insurance', 'training'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-secondary-500 text-white shadow-lg'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {tab === 'overview' ? '概览' : tab === 'medical' ? '医疗' : tab === 'insurance' ? '保险' : '训练'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Main Services */}
            <div className="space-y-4">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <Card
                    key={service.id}
                    variant="default"
                    padding="lg"
                    hover
                    onClick={() => onNavigate?.(service.id)}
                    enableGlow={service.id === 'insurance' && activePolicies > 0}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-neutral-800">{service.title}</h3>
                          <Badge variant={service.id === 'insurance' ? 'secondary' : service.id === 'medical' ? 'warning' : 'purple'} size="sm">
                            {service.badge}
                          </Badge>
                        </div>
                        <p className="text-neutral-500 text-sm mb-3">{service.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-neutral-800">{service.stats.main}</span>
                            <span className="text-sm text-neutral-500 ml-2">{service.stats.sub}</span>
                          </div>
                          <div className="flex items-center text-secondary-600 font-medium text-sm">
                            <span>立即体验</span>
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-bold text-neutral-800 mb-4">快捷服务</h2>
              <div className="grid grid-cols-3 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={index}
                      variant="default"
                      padding="md"
                      hover
                      onClick={() => {
                        if (action.title === '理赔申请') onNavigate?.('insurance');
                        else if (action.title === '预约兽医' || action.title === 'AI咨询') onNavigate?.('medical');
                        else if (action.title === '训练课程') onNavigate?.('training');
                      }}
                    >
                      <div className={`w-10 h-10 ${action.color} rounded-xl flex items-center justify-center mb-2`}>
                        <Icon className={`w-5 h-5 ${action.textColor}`} />
                      </div>
                      <h4 className="font-semibold text-neutral-800 text-sm">{action.title}</h4>
                      <p className="text-neutral-500 text-xs">{action.desc}</p>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Recent Activities */}
            {getRecentActivities().length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-neutral-800 mb-4">最近活动</h2>
                <div className="space-y-3">
                  {getRecentActivities().map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <Card key={index} variant="default" padding="md" hover>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getActivityColor(activity.color)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-800">{activity.title}</h4>
                            <p className="text-sm text-neutral-500">{activity.description}</p>
                          </div>
                          <span className="text-xs text-neutral-400">
                            {activity.date.toLocaleDateString()}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Features */}
            <Card variant="gradient" padding="lg">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-secondary-500" />
                <h3 className="font-bold text-neutral-800">为什么选择我们</h3>
              </div>
              <div className="space-y-3">
                {[
                  { icon: Zap, text: '24/7 全天候在线服务' },
                  { icon: Heart, text: '专业兽医团队支持' },
                  { icon: TrendingUp, text: '快速理赔流程' },
                  { icon: Star, text: '个性化健康方案' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-white/50 rounded-lg">
                    <feature.icon className="w-4 h-4 text-secondary-500" />
                    <span className="text-neutral-700 text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Pending Items Alert */}
            {(pendingClaims > 0 || upcomingAppointments > 0) && (
              <Card variant="outlined" padding="md">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-warning-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-800">待处理事项</h4>
                    <p className="text-sm text-neutral-500">
                      {pendingClaims > 0 && `${pendingClaims}个理赔待审核`}
                      {pendingClaims > 0 && upcomingAppointments > 0 && ' · '}
                      {upcomingAppointments > 0 && `${upcomingAppointments}个预约待赴诊`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('insurance')}>
                    查看
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Medical Tab */}
        {activeTab === 'medical' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">医疗服务</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate?.('medical')}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                进入
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card variant="gradient" padding="md">
                <MessageSquare className="w-5 h-5 text-warning-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">{consultations.length}</div>
                <div className="text-sm text-neutral-500">AI咨询</div>
              </Card>
              <Card variant="gradient" padding="md">
                <Calendar className="w-5 h-5 text-secondary-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">{appointments.length}</div>
                <div className="text-sm text-neutral-500">预约次数</div>
              </Card>
              <Card variant="gradient" padding="md">
                <FileText className="w-5 h-5 text-primary-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">{medicalRecords.length}</div>
                <div className="text-sm text-neutral-500">医疗档案</div>
              </Card>
            </div>

            {/* Upcoming Appointments */}
            {upcomingAppointments > 0 && (
              <div>
                <h3 className="font-medium text-neutral-700 mb-3">即将赴诊</h3>
                <div className="space-y-2">
                  {appointments.filter(a => a.status === 'scheduled').slice(0, 3).map((appointment) => (
                    <Card key={appointment.id} variant="default" padding="sm" hover>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-warning-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-800">{appointment.purpose}</h4>
                          <p className="text-xs text-neutral-500">{appointment.date.toLocaleDateString()} {appointment.time}</p>
                        </div>
                        <Badge variant="warning" size="sm">待赴诊</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => onNavigate?.('medical')}
                icon={<MessageSquare className="w-5 h-5" />}
              >
                AI咨询
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => onNavigate?.('medical')}
                icon={<Calendar className="w-5 h-5" />}
              >
                预约兽医
              </Button>
            </div>
          </div>
        )}

        {/* Insurance Tab */}
        {activeTab === 'insurance' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">保险服务</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate?.('insurance')}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                进入
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card variant="gradient" padding="md">
                <Shield className="w-5 h-5 text-secondary-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">{activePolicies}</div>
                <div className="text-sm text-neutral-500">有效保单</div>
              </Card>
              <Card variant="gradient" padding="md">
                <FileText className="w-5 h-5 text-warning-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">{claims.length}</div>
                <div className="text-sm text-neutral-500">理赔申请</div>
              </Card>
              <Card variant="gradient" padding="md">
                <Activity className="w-5 h-5 text-success-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">¥{totalCoverage.toLocaleString()}</div>
                <div className="text-sm text-neutral-500">保障总额</div>
              </Card>
            </div>

            {/* Active Policies */}
            {policies.filter(p => p.status === 'active').length > 0 && (
              <div>
                <h3 className="font-medium text-neutral-700 mb-3">有效保单</h3>
                <div className="space-y-2">
                  {policies.filter(p => p.status === 'active').slice(0, 2).map((policy) => (
                    <Card key={policy.id} variant="default" padding="sm" hover>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-secondary-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-800">{policy.planName}</h4>
                          <p className="text-xs text-neutral-500">{policy.petName} · ¥{policy.premium}/月</p>
                        </div>
                        <Badge variant="success" size="sm">有效</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Claims */}
            {pendingClaims > 0 && (
              <Card variant="outlined" padding="md">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-warning-500" />
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-800">理赔审核中</h4>
                    <p className="text-sm text-neutral-500">{pendingClaims}个理赔申请正在审核</p>
                  </div>
                  <Badge variant="warning" size="md">{pendingClaims}</Badge>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => onNavigate?.('insurance')}
                icon={<FileText className="w-5 h-5" />}
              >
                申请理赔
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => onNavigate?.('insurance')}
                icon={<Shield className="w-5 h-5" />}
              >
                新投保
              </Button>
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-neutral-800">训练服务</h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onNavigate?.('training')}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                进入
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card variant="gradient" padding="md">
                <Clock className="w-5 h-5 text-purple-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">{totalTrainingTime}</div>
                <div className="text-sm text-neutral-500">训练分钟</div>
              </Card>
              <Card variant="gradient" padding="md">
                <GraduationCap className="w-5 h-5 text-success-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">{completedCourses}</div>
                <div className="text-sm text-neutral-500">完成课程</div>
              </Card>
              <Card variant="gradient" padding="md">
                <Award className="w-5 h-5 text-warning-500 mb-2" />
                <div className="text-2xl font-bold text-neutral-800">{totalPointsEarned}</div>
                <div className="text-sm text-neutral-500">获得积分</div>
              </Card>
            </div>

            {/* In Progress Courses */}
            {courses.filter(c => c.progress > 0 && c.progress < 100).length > 0 && (
              <div>
                <h3 className="font-medium text-neutral-700 mb-3">进行中的课程</h3>
                <div className="space-y-2">
                  {courses.filter(c => c.progress > 0 && c.progress < 100).slice(0, 2).map((course) => (
                    <Card key={course.id} variant="default" padding="sm" hover onClick={() => onNavigate?.('training')}>
                      <div className="flex items-center gap-3">
                        <ProgressRing progress={course.progress} size={40} strokeWidth={3} color="#8B5CF6" />
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-800">{course.title}</h4>
                          <p className="text-xs text-neutral-500">{course.completedSteps}/{course.totalSteps} 步骤</p>
                        </div>
                        <Button variant="ghost" size="sm" icon={<Play className="w-4 h-4" />}>
                          继续
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Streak */}
            {streakDays > 0 && (
              <Card variant="gradient" padding="md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-800">连续训练 {streakDays} 天</h4>
                    <p className="text-sm text-neutral-500">继续保持，解锁更多成就</p>
                  </div>
                  <Badge variant="purple" size="md">🔥 {streakDays}</Badge>
                </div>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                onClick={() => onNavigate?.('training')}
                icon={<GraduationCap className="w-5 h-5" />}
              >
                查看课程
              </Button>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => onNavigate?.('training')}
                icon={<Play className="w-5 h-5" />}
              >
                开始训练
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="px-4 mt-6" style={{ maxWidth: responsive.contentMaxWidth, margin: '0 auto' }}>
        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-neutral-400" />
            <div className="flex-1">
              <h4 className="font-medium text-neutral-800">需要帮助?</h4>
              <p className="text-sm text-neutral-500">联系客服获取专业指导</p>
            </div>
            <Button variant="ghost" size="sm" icon={<ChevronRight className="w-4 h-4" />}>
              联系
            </Button>
          </div>
        </Card>
      </div>

      <div className="h-8" />
    </div>
  );
}