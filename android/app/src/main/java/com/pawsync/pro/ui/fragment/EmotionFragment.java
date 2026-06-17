package com.pawsync.pro.ui.fragment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;

import com.pawsync.pro.R;
import com.pawsync.pro.databinding.FragmentEmotionBinding;

/**
 * 情感分析 Fragment
 */
public class EmotionFragment extends Fragment {

    private FragmentEmotionBinding binding;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentEmotionBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        binding.titleText.setText(R.string.emotion_title);
        
        // 设置情感状态显示
        setupEmotionDisplay();
    }

    private void setupEmotionDisplay() {
        // 今日情感状态
        binding.todayEmotionText.setText("开心 😊");
        binding.todayEmotionIndicator.setBackgroundColor(
            getResources().getColor(R.color.emotion_happy, null)
        );
        
        // 情感历史
        binding.historyEmotionText.setText("过去7天情感稳定");
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}