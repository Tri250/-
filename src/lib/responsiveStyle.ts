/**
 * Responsive Style Hook - 响应式样式Hook
 *
 * 提供响应式样式值，确保多端适配
 */

import { useMemo } from 'react';
import { useResponsive } from './responsive';

/**
 * 响应式样式Hook
 */
export const useResponsiveStyle = () => {
  const { size, isPortrait, safeArea, width, height } = useResponsive();

  return useMemo(() => {
    // 根据屏幕尺寸计算样式值
    const getResponsiveValue = <T>(
      values: Partial<Record<string, T>>,
      defaultValue: T
    ): T => {
      const sizeOrder = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = sizeOrder.indexOf(size);
      
      // 从当前尺寸开始向下查找
      for (let i = currentIndex; i >= 0; i--) {
        if (values[sizeOrder[i]] !== undefined) {
          return values[sizeOrder[i]]!;
        }
      }
      
      // 向上查找
      for (let i = currentIndex + 1; i < sizeOrder.length; i++) {
        if (values[sizeOrder[i]] !== undefined) {
          return values[sizeOrder[i]]!;
        }
      }
      
      return defaultValue;
    };

    return {
      // 字体大小
      fontSize: getResponsiveValue(
        { xs: 14, sm: 15, md: 16, lg: 17, xl: 18 },
        15
      ),
      
      // 间距
      spacing: getResponsiveValue(
        { xs: 12, sm: 16, md: 18, lg: 24, xl: 28 },
        16
      ),
      
      // 卡片圆角
      cardRadius: getResponsiveValue(
        { xs: 12, sm: 14, md: 16, lg: 18, xl: 20 },
        14
      ),
      
      // 按钮高度
      buttonHeight: getResponsiveValue(
        { xs: 40, sm: 44, md: 48, lg: 52, xl: 56 },
        44
      ),
      
      // 头像大小
      avatarSize: getResponsiveValue(
        { xs: 48, sm: 56, md: 64, lg: 80, xl: 96 },
        56
      ),
      
      // 图标大小
      iconSize: getResponsiveValue(
        { xs: 20, sm: 24, md: 28, lg: 32, xl: 36 },
        24
      ),
      
      // 内容最大宽度
      contentMaxWidth: getResponsiveValue(
        { xs: 320, sm: 375, md: 414, lg: 768, xl: 1024 },
        375
      ),
      
      // 安全区域padding
      safeAreaPadding: {
        paddingTop: safeArea.top,
        paddingBottom: safeArea.bottom,
        paddingLeft: safeArea.left,
        paddingRight: safeArea.right,
      },
      
      // 屏幕信息
      screenWidth: width,
      screenHeight: height,
      screenSize: size,
      isPortrait,
      isLandscape: !isPortrait,
      
      // 工具函数
      getResponsiveValue,
    };
  }, [size, isPortrait, safeArea, width, height]);
};