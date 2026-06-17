package com.pawsync.pro.ui.fragment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.pawsync.pro.R;
import com.pawsync.pro.databinding.FragmentMonitorBinding;

/**
 * 监控中心 Fragment
 */
public class MonitorFragment extends Fragment {

    private FragmentMonitorBinding binding;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentMonitorBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        binding.titleText.setText(R.string.monitor_title);
        
        // 设置监控卡片
        setupMonitorCards();
    }

    private void setupMonitorCards() {
        binding.cameraCard.setOnClickListener(v -> {
            // 打开摄像头监控
        });
        
        binding.activityCard.setOnClickListener(v -> {
            // 查看活动监测
        });
        
        binding.alertsCard.setOnClickListener(v -> {
            // 查看告警通知
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}