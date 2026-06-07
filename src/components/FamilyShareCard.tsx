import React, { useState } from 'react';
import { Users, UserPlus, Shield, Bell, Share2, Crown, MoreVertical, X, Check } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member';
  permissions: {
    viewHealth: boolean;
    editHealth: boolean;
    viewLocation: boolean;
    receiveAlerts: boolean;
  };
  lastActive?: string;
}

interface FamilyShareCardProps {
  members: FamilyMember[];
  onInvite?: () => void;
  onUpdatePermissions?: (memberId: string, permissions: Partial<FamilyMember['permissions']>) => void;
  onRemoveMember?: (memberId: string) => void;
  className?: string;
}

const roleLabels = {
  owner: { label: '主人', color: 'bg-orange-100 text-orange-700', icon: Crown },
  admin: { label: '管理员', color: 'bg-blue-100 text-blue-700', icon: Shield },
  member: { label: '成员', color: 'bg-gray-100 text-gray-700', icon: Users },
};

export const FamilyShareCard: React.FC<FamilyShareCardProps> = ({
  members,
  onInvite,
  onUpdatePermissions,
  onRemoveMember,
  className = '',
}) => {
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  const owner = members.find(m => m.role === 'owner');
  const admins = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role === 'member');

  const togglePermission = (memberId: string, permission: keyof FamilyMember['permissions']) => {
    const member = members.find(m => m.id === memberId);
    if (member && onUpdatePermissions) {
      onUpdatePermissions(memberId, {
        [permission]: !member.permissions[permission],
      });
    }
  };

  return (
    <Card className={`p-4 ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          <h3 className="font-bold text-gray-800">家庭共享</h3>
          <Badge color="orange" size="small">
            {members.length}人
          </Badge>
        </div>
        <Button
          variant="primary"
          size="small"
          icon={<UserPlus className="w-4 h-4" />}
          onClick={onInvite}
        >
          邀请
        </Button>
      </div>

      {/* 成员列表 */}
      <div className="space-y-3">
        {/* 主人 */}
        {owner && (
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
              {owner.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{owner.name}</span>
                <Badge className="bg-orange-100 text-orange-700 text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  主人
                </Badge>
              </div>
              <p className="text-xs text-gray-500">拥有所有权限</p>
            </div>
          </div>
        )}

        {/* 管理员 */}
        {admins.map(admin => (
          <div 
            key={admin.id}
            className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer"
            onClick={() => setExpandedMember(expandedMember === admin.id ? null : admin.id)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {admin.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{admin.name}</span>
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  管理员
                </Badge>
              </div>
              <p className="text-xs text-gray-500">
                {admin.lastActive ? `最近活跃: ${admin.lastActive}` : '邀请中...'}
              </p>
            </div>
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </div>
        ))}

        {/* 普通成员 */}
        {regularMembers.map(member => (
          <div key={member.id}>
            <div 
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white font-bold">
                {member.name[0]}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{member.name}</span>
                  <Badge className="bg-gray-100 text-gray-700 text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    成员
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {member.lastActive ? `最近活跃: ${member.lastActive}` : '邀请中...'}
                </p>
              </div>
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </div>

            {/* 权限设置展开 */}
            {expandedMember === member.id && (
              <div className="mt-2 p-3 bg-white border border-gray-100 rounded-xl animate-in slide-in-from-top-2">
                <p className="text-xs font-medium text-gray-600 mb-3">权限设置</p>
                <div className="space-y-2">
                  {[
                    { key: 'viewHealth', label: '查看健康', icon: Shield },
                    { key: 'editHealth', label: '编辑健康', icon: Shield },
                    { key: 'viewLocation', label: '查看位置', icon: Share2 },
                    { key: 'receiveAlerts', label: '接收提醒', icon: Bell },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => togglePermission(member.id, key as keyof FamilyMember['permissions'])}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{label}</span>
                      </div>
                      {member.permissions[key as keyof FamilyMember['permissions']] ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
                
                {onRemoveMember && (
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="w-full mt-3 p-2 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    移除成员
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 提示 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <span className="font-medium">💡 提示：</span>
          邀请家人一起守护毛孩子，共享健康数据和实时动态
        </p>
      </div>
    </Card>
  );
};

export default FamilyShareCard;
