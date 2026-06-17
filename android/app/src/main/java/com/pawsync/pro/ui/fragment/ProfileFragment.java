package com.pawsync.pro.ui.fragment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.pawsync.pro.R;
import com.pawsync.pro.databinding.FragmentProfileBinding;

/**
 * 个人中心 Fragment
 */
public class ProfileFragment extends Fragment {

    private FragmentProfileBinding binding;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentProfileBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        binding.titleText.setText(R.string.profile_title);
        
        // 设置菜单项点击
        setupMenuItems();
    }

    private void setupMenuItems() {
        binding.settingsItem.setOnClickListener(v -> {
            // 打开设置页面
        });
        
        binding.favoritesItem.setOnClickListener(v -> {
            // 打开收藏页面
        });
        
        binding.helpItem.setOnClickListener(v -> {
            // 打开帮助反馈页面
        });
        
        binding.aboutItem.setOnClickListener(v -> {
            // 打开关于页面
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}