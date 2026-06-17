package com.pawsync.pro;

import android.os.Bundle;
import android.view.View;
import android.view.WindowInsetsController;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.splashscreen.SplashScreen;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.fragment.app.FragmentTransaction;

import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.pawsync.pro.databinding.ActivityMainBinding;
import com.pawsync.pro.ui.fragment.HomeFragment;
import com.pawsync.pro.ui.fragment.HealthFragment;
import com.pawsync.pro.ui.fragment.EmotionFragment;
import com.pawsync.pro.ui.fragment.MonitorFragment;
import com.pawsync.pro.ui.fragment.ProfileFragment;

/**
 * PawSync 主 Activity
 * 纯原生 Android 实现，使用 Fragment 导航
 */
public class MainActivity extends AppCompatActivity {

    private ActivityMainBinding binding;
    private FragmentManager fragmentManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 安装启动屏幕
        SplashScreen.installSplashScreen(this);
        
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Edge-to-Edge 显示
        setupEdgeToEdge();

        // 初始化 Fragment 管理
        fragmentManager = getSupportFragmentManager();

        // 设置底部导航
        setupBottomNavigation();

        // 默认显示首页
        if (savedInstanceState == null) {
            navigateToFragment(new HomeFragment(), "home");
        }
    }

    /**
     * 设置 Edge-to-Edge 显示模式
     */
    private void setupEdgeToEdge() {
        // 状态栏透明
        getWindow().setStatusBarColor(android.graphics.Color.TRANSPARENT);
        getWindow().setNavigationBarColor(getColor(R.color.nav_bar_color));

        // 状态栏图标颜色（根据主题）
        WindowInsetsController controller = getWindow().getInsetsController();
        if (controller != null) {
            // Android R+ 使用新的 API
            controller.setSystemBarsAppearance(
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
                WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
            );
        }
    }

    /**
     * 设置底部导航栏
     */
    private void setupBottomNavigation() {
        binding.bottomNavigation.setOnItemSelectedListener(item -> {
            Fragment fragment = null;
            String tag = null;
            
            int itemId = item.getItemId();
            if (itemId == R.id.nav_home) {
                fragment = new HomeFragment();
                tag = "home";
            } else if (itemId == R.id.nav_health) {
                fragment = new HealthFragment();
                tag = "health";
            } else if (itemId == R.id.nav_emotion) {
                fragment = new EmotionFragment();
                tag = "emotion";
            } else if (itemId == R.id.nav_monitor) {
                fragment = new MonitorFragment();
                tag = "monitor";
            } else if (itemId == R.id.nav_profile) {
                fragment = new ProfileFragment();
                tag = "profile";
            }

            if (fragment != null) {
                navigateToFragment(fragment, tag);
                return true;
            }
            return false;
        });
    }

    /**
     * 导航到指定 Fragment
     */
    private void navigateToFragment(@NonNull Fragment fragment, @NonNull String tag) {
        FragmentTransaction transaction = fragmentManager.beginTransaction();
        
        // 查找现有 Fragment
        Fragment existing = fragmentManager.findFragmentByTag(tag);
        if (existing != null) {
            // 显示已存在的 Fragment
            transaction.show(existing);
            // 隐藏其他 Fragment
            for (Fragment f : fragmentManager.getFragments()) {
                if (f != existing && f.isAdded()) {
                    transaction.hide(f);
                }
            }
        } else {
            // 添加新 Fragment
            transaction.add(R.id.fragment_container, fragment, tag);
            // 隐藏其他 Fragment
            for (Fragment f : fragmentManager.getFragments()) {
                if (f.isAdded()) {
                    transaction.hide(f);
                }
            }
        }
        
        transaction.commitAllowingStateLoss();
    }

    /**
     * 公开导航方法（供 Fragment 调用）
     */
    public void navigateTo(int itemId) {
        binding.bottomNavigation.setSelectedItemId(itemId);
    }

    @Override
    protected void onResume() {
        super.onResume();
    }

    @Override
    protected void onPause() {
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }
}