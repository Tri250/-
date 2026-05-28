/**
 * PawSync Pro - 基础电商商城服务
 * 实现商品、购物车、订单、支付功能
 * 作者: 带娃的小陈工
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  category: 'food' | 'snack' | 'toy' | 'care' | 'medicine' | 'clothes';
  petType: 'dog' | 'cat' | 'both';
  stock: number;
  sales: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  brand: string;
  specifications?: Array<{ name: string; value: string }>;
  isHot?: boolean;
  isNew?: boolean;
  isRecommended?: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selected: boolean;
}

export interface Order {
  id: string;
  orderNo: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  totalAmount: number;
  originalAmount: number;
  discountAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  paymentMethod?: 'wechat' | 'alipay';
  paymentTime?: string;
  shippingAddress: {
    name: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    address: string;
  };
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface ShippingAddress {
  id: string;
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDefault: boolean;
}

class EcommerceService {
  private products: Product[] = [];
  private cart: CartItem[] = [];
  private orders: Order[] = [];
  private addresses: ShippingAddress[] = [];

  constructor() {
    this.initializeMockData();
  }

  /**
   * 初始化模拟数据
   */
  private initializeMockData() {
    this.products = [
      {
        id: 'prod-1',
        name: '皇家宠物食品 室内成猫粮',
        description: '专为室内猫设计，控制体重，维护泌尿健康',
        price: 268,
        originalPrice: 328,
        images: ['cat-food-1.jpg'],
        category: 'food',
        petType: 'cat',
        stock: 156,
        sales: 2345,
        rating: 4.8,
        reviewCount: 892,
        tags: ['皇家', '室内猫', '控制体重'],
        brand: '皇家',
        isHot: true,
        isRecommended: true,
      },
      {
        id: 'prod-2',
        name: '渴望六种鱼全猫粮 2kg',
        description: '高蛋白配方，六种深海鱼，无谷配方',
        price: 458,
        images: ['cat-food-2.jpg'],
        category: 'food',
        petType: 'cat',
        stock: 89,
        sales: 1567,
        rating: 4.9,
        reviewCount: 567,
        tags: ['渴望', '无谷', '高蛋白'],
        brand: '渴望',
        isNew: true,
        isRecommended: true,
      },
      {
        id: 'prod-3',
        name: '疯狂小狗鸡肉干零食',
        description: '纯天然风干鸡肉，低温烘干，保留营养',
        price: 68,
        originalPrice: 88,
        images: ['dog-snack-1.jpg'],
        category: 'snack',
        petType: 'dog',
        stock: 234,
        sales: 3456,
        rating: 4.7,
        reviewCount: 1234,
        tags: ['零食', '鸡肉干', '训练零食'],
        brand: '疯狂小狗',
        isHot: true,
      },
      {
        id: 'prod-4',
        name: '金毛成犬专用狗粮 15kg',
        description: '大型犬专用配方，促进关节健康，美毛护肤',
        price: 598,
        originalPrice: 698,
        images: ['dog-food-1.jpg'],
        category: 'food',
        petType: 'dog',
        stock: 67,
        sales: 987,
        rating: 4.6,
        reviewCount: 345,
        tags: ['大型犬', '金毛专用', '关节健康'],
        brand: '冠能',
        isRecommended: true,
      },
      {
        id: 'prod-5',
        name: '猫咪电动逗猫棒',
        description: '自动旋转，吸引猫咪注意力，告别无聊',
        price: 39.9,
        images: ['cat-toy-1.jpg'],
        category: 'toy',
        petType: 'cat',
        stock: 456,
        sales: 2345,
        rating: 4.5,
        reviewCount: 876,
        tags: ['玩具', '逗猫棒', '电动'],
        isHot: true,
      },
      {
        id: 'prod-6',
        name: '宠物自动饮水机',
        description: '循环过滤，保持水质新鲜，容量2.5L',
        price: 128,
        images: ['pet-fountain-1.jpg'],
        category: 'care',
        petType: 'both',
        stock: 123,
        sales: 1567,
        rating: 4.8,
        reviewCount: 654,
        tags: ['饮水机', '自动', '循环过滤'],
        isRecommended: true,
      },
      {
        id: 'prod-7',
        name: '狗狗牵引绳 伸缩款',
        description: '3米伸缩绳，大型犬适用，ABS材质耐用',
        price: 89,
        images: ['dog-leash-1.jpg'],
        category: 'care',
        petType: 'dog',
        stock: 178,
        sales: 2345,
        rating: 4.6,
        reviewCount: 987,
        tags: ['牵引绳', '伸缩', '户外'],
      },
      {
        id: 'prod-8',
        name: '猫咪春夏薄款衣服',
        description: '透气轻薄，多款可选，小清新风格',
        price: 29.9,
        images: ['cat-clothes-1.jpg'],
        category: 'clothes',
        petType: 'cat',
        stock: 234,
        sales: 1234,
        rating: 4.4,
        reviewCount: 456,
        tags: ['衣服', '春夏款', '薄款'],
        isNew: true,
      },
      {
        id: 'prod-9',
        name: '宠物体内驱虫药',
        description: '广谱驱虫，针对蛔虫、钩虫、绦虫等',
        price: 68,
        images: ['pet-medicine-1.jpg'],
        category: 'medicine',
        petType: 'both',
        stock: 345,
        sales: 4567,
        rating: 4.9,
        reviewCount: 2345,
        tags: ['驱虫', '药品', '必备'],
        isHot: true,
      },
      {
        id: 'prod-10',
        name: '猫咪猫薄荷玩具套装',
        description: '包含球、毛绒玩具、抱枕等6件套',
        price: 49.9,
        originalPrice: 69.9,
        images: ['cat-toy-2.jpg'],
        category: 'toy',
        petType: 'cat',
        stock: 189,
        sales: 1678,
        rating: 4.7,
        reviewCount: 678,
        tags: ['玩具套装', '猫薄荷', '趣味'],
      },
    ];

    this.addresses = [
      {
        id: 'addr-1',
        name: '张三',
        phone: '13800138000',
        province: '江西省',
        city: '赣州市',
        district: '章贡区',
        address: '长征大道28号希望小区A栋1501',
        isDefault: true,
      },
    ];
  }

  /**
   * 获取商品列表
   */
  async getProducts(params?: {
    category?: Product['category'];
    petType?: Product['petType'];
    keyword?: string;
    sortBy?: 'sales' | 'price' | 'rating';
    page?: number;
    pageSize?: number;
  }): Promise<{ products: Product[]; total: number }> {
    let results = [...this.products];

    if (params?.category) {
      results = results.filter(p => p.category === params.category);
    }

    if (params?.petType) {
      results = results.filter(p => p.petType === params.petType || p.petType === 'both');
    }

    if (params?.keyword) {
      const keyword = params.keyword.toLowerCase();
      results = results.filter(p => 
        p.name.toLowerCase().includes(keyword) ||
        p.description.toLowerCase().includes(keyword) ||
        p.tags.some(t => t.toLowerCase().includes(keyword))
      );
    }

    if (params?.sortBy === 'sales') {
      results.sort((a, b) => b.sales - a.sales);
    } else if (params?.sortBy === 'price') {
      results.sort((a, b) => a.price - b.price);
    } else if (params?.sortBy === 'rating') {
      results.sort((a, b) => b.rating - a.rating);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;
    const paginatedResults = results.slice(start, start + pageSize);

    return {
      products: paginatedResults,
      total: results.length,
    };
  }

  /**
   * 获取商品详情
   */
  async getProductDetail(productId: string): Promise<Product | null> {
    return this.products.find(p => p.id === productId) || null;
  }

  /**
   * 获取热门商品
   */
  async getHotProducts(): Promise<Product[]> {
    return this.products.filter(p => p.isHot).slice(0, 6);
  }

  /**
   * 获取推荐商品
   */
  async getRecommendedProducts(): Promise<Product[]> {
    return this.products.filter(p => p.isRecommended).slice(0, 6);
  }

  /**
   * 添加到购物车
   */
  async addToCart(productId: string, quantity: number = 1): Promise<CartItem> {
    const product = await this.getProductDetail(productId);
    if (!product) {
      throw new Error('商品不存在');
    }

    const existingItem = this.cart.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
      return existingItem;
    }

    const cartItem: CartItem = {
      id: `cart_${Date.now()}`,
      productId,
      product,
      quantity,
      selected: true,
    };

    this.cart.push(cartItem);
    return cartItem;
  }

  /**
   * 获取购物车列表
   */
  getCartItems(): CartItem[] {
    return this.cart;
  }

  /**
   * 更新购物车商品数量
   */
  updateCartItemQuantity(cartItemId: string, quantity: number): boolean {
    const item = this.cart.find(i => i.id === cartItemId);
    if (item) {
      item.quantity = quantity;
      return true;
    }
    return false;
  }

  /**
   * 选择/取消选择购物车商品
   */
  toggleCartItemSelection(cartItemId: string, selected: boolean): boolean {
    const item = this.cart.find(i => i.id === cartItemId);
    if (item) {
      item.selected = selected;
      return true;
    }
    return false;
  }

  /**
   * 删除购物车商品
   */
  removeFromCart(cartItemId: string): boolean {
    const index = this.cart.findIndex(i => i.id === cartItemId);
    if (index !== -1) {
      this.cart.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 清空购物车
   */
  clearCart(): void {
    this.cart = [];
  }

  /**
   * 获取购物车总价
   */
  getCartTotal(): { total: number; originalTotal: number; discount: number; count: number } {
    const selectedItems = this.cart.filter(i => i.selected);
    const total = selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const originalTotal = selectedItems.reduce((sum, item) => 
      sum + (item.product.originalPrice || item.product.price) * item.quantity, 0);
    const discount = originalTotal - total;
    const count = selectedItems.reduce((sum, item) => sum + item.quantity, 0);

    return { total, originalTotal, discount, count };
  }

  /**
   * 创建订单
   */
  async createOrder(shippingAddressId: string, paymentMethod: 'wechat' | 'alipay'): Promise<Order> {
    const selectedItems = this.cart.filter(i => i.selected);
    if (selectedItems.length === 0) {
      throw new Error('购物车为空');
    }

    const address = this.addresses.find(a => a.id === shippingAddressId);
    if (!address) {
      throw new Error('收货地址不存在');
    }

    const { total, originalTotal, discount } = this.getCartTotal();

    const order: Order = {
      id: `order_${Date.now()}`,
      orderNo: `PS${Date.now()}`,
      userId: 'user-1',
      items: selectedItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images[0],
      })),
      totalAmount: total,
      originalAmount: originalTotal,
      discountAmount: discount,
      status: 'pending',
      paymentMethod,
      shippingAddress: {
        name: address.name,
        phone: address.phone,
        province: address.province,
        city: address.city,
        district: address.district,
        address: address.address,
      },
      createdAt: new Date().toISOString(),
    };

    this.orders.push(order);
    this.clearCart();

    return order;
  }

  /**
   * 支付订单
   */
  async payOrder(orderId: string): Promise<{ success: boolean; paymentUrl?: string }> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) {
      throw new Error('订单不存在');
    }

    // 模拟支付
    order.status = 'paid';
    order.paymentTime = new Date().toISOString();

    return {
      success: true,
      paymentUrl: 'https://payment.example.com/mock',
    };
  }

  /**
   * 获取订单列表
   */
  async getOrders(status?: Order['status']): Promise<Order[]> {
    let results = [...this.orders];
    if (status) {
      results = results.filter(o => o.status === status);
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * 获取订单详情
   */
  async getOrderDetail(orderId: string): Promise<Order | null> {
    return this.orders.find(o => o.id === orderId) || null;
  }

  /**
   * 取消订单
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'pending') {
      order.status = 'cancelled';
      return true;
    }
    return false;
  }

  /**
   * 确认收货
   */
  async confirmReceipt(orderId: string): Promise<boolean> {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'shipped') {
      order.status = 'delivered';
      order.deliveredAt = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * 获取收货地址列表
   */
  getAddresses(): ShippingAddress[] {
    return this.addresses;
  }

  /**
   * 添加收货地址
   */
  async addAddress(address: Omit<ShippingAddress, 'id'>): Promise<ShippingAddress> {
    const newAddress: ShippingAddress = {
      ...address,
      id: `addr_${Date.now()}`,
    };

    if (newAddress.isDefault) {
      this.addresses.forEach(a => a.isDefault = false);
    }

    this.addresses.push(newAddress);
    return newAddress;
  }

  /**
   * 更新收货地址
   */
  async updateAddress(addressId: string, address: Partial<ShippingAddress>): Promise<boolean> {
    const existingAddress = this.addresses.find(a => a.id === addressId);
    if (existingAddress) {
      Object.assign(existingAddress, address);
      return true;
    }
    return false;
  }

  /**
   * 删除收货地址
   */
  async deleteAddress(addressId: string): Promise<boolean> {
    const index = this.addresses.findIndex(a => a.id === addressId);
    if (index !== -1) {
      this.addresses.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 获取默认收货地址
   */
  getDefaultAddress(): ShippingAddress | null {
    return this.addresses.find(a => a.isDefault) || this.addresses[0] || null;
  }

  /**
   * 获取商品分类
   */
  getCategories() {
    return [
      { id: 'food', name: '主粮', icon: '🍖', count: this.products.filter(p => p.category === 'food').length },
      { id: 'snack', name: '零食', icon: '🦴', count: this.products.filter(p => p.category === 'snack').length },
      { id: 'toy', name: '玩具', icon: '🎾', count: this.products.filter(p => p.category === 'toy').length },
      { id: 'care', name: '用品', icon: '🛁', count: this.products.filter(p => p.category === 'care').length },
      { id: 'medicine', name: '药品', icon: '💊', count: this.products.filter(p => p.category === 'medicine').length },
      { id: 'clothes', name: '服装', icon: '👔', count: this.products.filter(p => p.category === 'clothes').length },
    ];
  }
}

export const ecommerceService = new EcommerceService();
