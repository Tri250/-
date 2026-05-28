/**
 * PawSync Pro - O2O宠物服务地图服务
 * 集成高德/腾讯地图API，展示附近宠物服务
 * 作者: 带娃的小陈工
 */

export interface PetService {
  id: string;
  name: string;
  type: 'hospital' | 'grooming' | 'pet_store' | 'training' | 'boarding';
  address: string;
  distance: number; // 距离（km）
  rating: number; // 1-5星
  reviewCount: number;
  phone: string;
  openingHours: string;
  services: string[];
  priceRange: string;
  images: string[];
  tags: string[];
  location: {
    lat: number;
    lng: number;
  };
  features: {
    is24Hour?: boolean;
    hasParking?: boolean;
    isVerified?: boolean;
    accept appointment?: boolean;
  };
}

export interface Reservation {
  id: string;
  serviceId: string;
  petId: string;
  userId: string;
  serviceType: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface MapSearchParams {
  lat: number;
  lng: number;
  radius?: number; // 搜索半径（km）
  type?: PetService['type'];
  keyword?: string;
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'price';
}

class PetServiceMapService {
  private services: PetService[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * 初始化模拟数据
   */
  private initializeMockData() {
    this.services = [
      {
        id: 'hospital-1',
        name: '爱宠宠物医院',
        type: 'hospital',
        address: '赣州市章贡区长征大道28号',
        distance: 1.2,
        rating: 4.8,
        reviewCount: 328,
        phone: '0797-8888888',
        openingHours: '08:00-22:00',
        services: ['疫苗接种', '体检', '手术', '住院', '24小时急诊'],
        priceRange: '¥100-2000',
        images: ['hospital1.jpg'],
        tags: ['24小时', '专业', '口碑好'],
        location: { lat: 25.8293, lng: 114.9357 },
        features: { is24Hour: true, hasParking: true, isVerified: true, 'accept appointment': true },
      },
      {
        id: 'hospital-2',
        name: '萌爪动物诊所',
        type: 'hospital',
        address: '赣州市章贡区文清路15号',
        distance: 2.3,
        rating: 4.5,
        reviewCount: 156,
        phone: '0797-8234567',
        openingHours: '09:00-20:00',
        services: ['疫苗接种', '体检', '皮肤病', '牙科'],
        priceRange: '¥80-1500',
        images: ['hospital2.jpg'],
        tags: ['专业', '细心'],
        location: { lat: 25.8312, lng: 114.9368 },
        features: { hasParking: true, isVerified: true, 'accept appointment': true },
      },
      {
        id: 'grooming-1',
        name: '汪星人宠物美容会所',
        type: 'grooming',
        address: '赣州市章贡区南门口广场3楼',
        distance: 0.8,
        rating: 4.9,
        reviewCount: 892,
        phone: '0797-8168888',
        openingHours: '10:00-21:00',
        services: ['洗澡', '美容', '造型', 'SPA', '美甲'],
        priceRange: '¥68-388',
        images: ['grooming1.jpg'],
        tags: ['热门', '网红店', '评分高'],
        location: { lat: 25.8285, lng: 114.9372 },
        features: { isVerified: true, 'accept appointment': true },
      },
      {
        id: 'grooming-2',
        name: '猫咪专属美容店',
        type: 'grooming',
        address: '赣州市章贡区健康路28号',
        distance: 1.5,
        rating: 4.7,
        reviewCount: 234,
        phone: '0797-8156789',
        openingHours: '10:00-19:00',
        services: ['洗澡', '美容', '去毛球', '指甲修剪'],
        priceRange: '¥88-288',
        images: ['grooming2.jpg'],
        tags: ['猫咪专业', '环境好'],
        location: { lat: 25.8302, lng: 114.9345 },
        features: { isVerified: true },
      },
      {
        id: 'store-1',
        name: '宠物天堂(旗舰店)',
        type: 'pet_store',
        address: '赣州市章贡区万象城B1层',
        distance: 2.1,
        rating: 4.6,
        reviewCount: 567,
        phone: '0797-8881234',
        openingHours: '10:00-22:00',
        services: ['宠物食品', '用品', '玩具', '服装', '零食'],
        priceRange: '¥20-2000',
        images: ['store1.jpg'],
        tags: ['品牌店', '品类全'],
        location: { lat: 25.8278, lng: 114.9385 },
        features: { hasParking: true, isVerified: true },
      },
      {
        id: 'training-1',
        name: '汪汪学校宠物训练中心',
        type: 'training',
        address: '赣州市章贡区赣江源大道88号',
        distance: 3.5,
        rating: 4.4,
        reviewCount: 123,
        phone: '0797-8890123',
        openingHours: '09:00-18:00',
        services: ['基础服从', '行为矫正', '技能培训', '社交训练'],
        priceRange: '¥1500-5000',
        images: ['training1.jpg'],
        tags: ['专业', '效果明显'],
        location: { lat: 25.8265, lng: 114.9320 },
        features: { hasParking: true, isVerified: true, 'accept appointment': true },
      },
      {
        id: 'boarding-1',
        name: '萌宠度假酒店',
        type: 'boarding',
        address: '赣州市章贡区水西镇宠物乐园',
        distance: 5.2,
        rating: 4.8,
        reviewCount: 445,
        phone: '0797-8885678',
        openingHours: '24小时',
        services: ['寄养', '日托', '训练营', '游泳', '游乐'],
        priceRange: '¥100-500/天',
        images: ['boarding1.jpg'],
        tags: ['高端', '环境优美', '24小时监控'],
        location: { lat: 25.8200, lng: 114.9400 },
        features: { is24Hour: true, hasParking: true, isVerified: true },
      },
    ];
  }

  /**
   * 搜索附近宠物服务
   */
  async searchNearbyServices(params: MapSearchParams): Promise<PetService[]> {
    try {
      let results = [...this.services];

      // 按类型筛选
      if (params.type) {
        results = results.filter(s => s.type === params.type);
      }

      // 按关键词筛选
      if (params.keyword) {
        const keyword = params.keyword.toLowerCase();
        results = results.filter(s => 
          s.name.toLowerCase().includes(keyword) ||
          s.services.some(sv => sv.includes(keyword)) ||
          s.tags.some(t => t.includes(keyword))
        );
      }

      // 按评分筛选
      if (params.minRating) {
        results = results.filter(s => s.rating >= params.minRating!);
      }

      // 按距离排序
      if (params.sortBy === 'distance' || !params.sortBy) {
        results.sort((a, b) => a.distance - b.distance);
      } else if (params.sortBy === 'rating') {
        results.sort((a, b) => b.rating - a.rating);
      }

      return results;
    } catch (error) {
      console.error('搜索服务失败:', error);
      return [];
    }
  }

  /**
   * 获取服务详情
   */
  async getServiceDetail(serviceId: string): Promise<PetService | null> {
    return this.services.find(s => s.id === serviceId) || null;
  }

  /**
   * 获取服务类型列表
   */
  getServiceTypes() {
    return [
      { type: 'hospital', name: '宠物医院', icon: '🏥', count: this.services.filter(s => s.type === 'hospital').length },
      { type: 'grooming', name: '美容洗澡', icon: '✨', count: this.services.filter(s => s.type === 'grooming').length },
      { type: 'pet_store', name: '宠物商店', icon: '🛒', count: this.services.filter(s => s.type === 'pet_store').length },
      { type: 'training', name: '训练学校', icon: '🎓', count: this.services.filter(s => s.type === 'training').length },
      { type: 'boarding', name: '寄养酒店', icon: '🏨', count: this.services.filter(s => s.type === 'boarding').length },
    ];
  }

  /**
   * 创建预约
   */
  async createReservation(reservation: Omit<Reservation, 'id' | 'status' | 'createdAt'>): Promise<Reservation> {
    const newReservation: Reservation = {
      ...reservation,
      id: `res_${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    console.log('创建预约成功:', newReservation);
    return newReservation;
  }

  /**
   * 获取用户预约列表
   */
  async getUserReservations(userId: string): Promise<Reservation[]> {
    // 模拟返回预约列表
    return [
      {
        id: 'res_1',
        serviceId: 'hospital-1',
        petId: 'pet-1',
        userId,
        serviceType: 'hospital',
        date: '2026-06-05',
        time: '10:00',
        status: 'confirmed',
        notes: '年度体检',
        createdAt: '2026-05-20T10:00:00Z',
      },
    ];
  }

  /**
   * 取消预约
   */
  async cancelReservation(reservationId: string): Promise<boolean> {
    console.log('取消预约:', reservationId);
    return true;
  }

  /**
   * 计算距离
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // 简化的距离计算（实际应使用Haversine公式）
    const R = 6371; // 地球半径（km）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * 获取推荐服务
   */
  async getRecommendedServices(lat: number, lng: number): Promise<PetService[]> {
    const services = await this.searchNearbyServices({ lat, lng, sortBy: 'rating' });
    return services.slice(0, 5);
  }

  /**
   * 获取热门服务
   */
  getHotServices(): PetService[] {
    return this.services
      .sort((a, b) => b.reviewCount - a.reviewCount)
      .slice(0, 5);
  }
}

export const petServiceMapService = new PetServiceMapService();
