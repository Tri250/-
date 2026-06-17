package com.pawsync.pro.ui.fragment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.pawsync.pro.R;
import com.pawsync.pro.databinding.FragmentHealthBinding;

/**
 * 健康管理 Fragment
 */
public class HealthFragment extends Fragment {

    private FragmentHealthBinding binding;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentHealthBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        binding.titleText.setText(R.string.health_title);
        
        // 设置健康卡片点击事件
        binding.healthRecordsCard.setOnClickListener(v -> {
            // 导航到健康记录页面
        });
        
        binding.healthReportCard.setOnClickListener(v -> {
            // 导航到健康报告页面
        });
        
        binding.healthRemindersCard.setOnClickListener(v -> {
            // 导航到健康提醒页面
        });
        
        binding.healthManualCard.setOnClickListener(v -> {
            // 导航到健康手册页面
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}