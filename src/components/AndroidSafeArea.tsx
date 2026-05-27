import React, { useEffect, useState } from 'react';

interface AndroidSafeAreaProps {
  children: React.ReactNode;
  className?: string;
}

export const AndroidSafeArea: React.FC<AndroidSafeAreaProps> = ({
  children,
  className = '',
}) => {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const getSafeAreaInsets = () => {
      try {
        const isAndroid = /Android/i.test(navigator.userAgent);
        if (!isAndroid) {
          // 非Android设备使用默认值
          setInsets({
            top: 0,
            bottom: 0,
            left: 0,
            right: 0,
          });
          return;
        }

        // 检查是否支持safe-area-inset
        const top = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
        const bottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
        const left = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0');
        const right = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0');

        setInsets({
          top: top || 44, // 默认状态栏高度
          bottom: bottom || 80, // 默认导航栏高度
          left: left || 0,
          right: right || 0,
        });
      } catch {
        // 降级处理
        setInsets({
          top: 44,
          bottom: 80,
          left: 0,
          right: 0,
        });
      }
    };

    getSafeAreaInsets();
    window.addEventListener('resize', getSafeAreaInsets);
    window.addEventListener('orientationchange', getSafeAreaInsets);

    return () => {
      window.removeEventListener('resize', getSafeAreaInsets);
      window.removeEventListener('orientationchange', getSafeAreaInsets);
    };
  }, []);

  return (
    <div
      className={`${className}`}
      style={{
        paddingTop: `${insets.top}px`,
        paddingBottom: `${insets.bottom}px`,
        paddingLeft: `${insets.left}px`,
        paddingRight: `${insets.right}px`,
      }}
    >
      {children}
    </div>
  );
};

export const SafeAreaTop: React.FC = () => {
  return (
    <div className="w-full" style={{ height: '44px' }} />
  );
};

export const SafeAreaBottom: React.FC = () => {
  return (
    <div className="w-full" style={{ height: '80px' }} />
  );
};
