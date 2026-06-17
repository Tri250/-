package com.pawsync.pro.ui.fragment;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.pawsync.pro.MainActivity;
import com.pawsync.pro.R;
import com.pawsync.pro.databinding.FragmentHomeBinding;
import com.pawsync.pro.ui.adapter.FeatureAdapter;
import com.pawsync.pro.ui.model.FeatureItem;

import java.util.ArrayList;
import java.util.List;

/**
 * 首页 Fragment
 */
public class HomeFragment extends Fragment {

    private FragmentHomeBinding binding;
    private FeatureAdapter featureAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentHomeBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        setupHeader();
        setupFeatureGrid();
    }

    private void setupHeader() {
        binding.titleText.setText(R.string.home_title);
        binding.subtitleText.setText(R.string.home_subtitle);
    }

    private void setupFeatureGrid() {
        List<FeatureItem> features = getFeatures();
        
        featureAdapter = new FeatureAdapter(features, feature -> {
            // 处理功能点击
            handleFeatureClick(feature);
        });
        
        binding.featureGrid.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        binding.featureGrid.setAdapter(featureAdapter);
    }

    private List<FeatureItem> getFeatures() {
        List<FeatureItem> features = new ArrayList<>();
        
        features.add(new FeatureItem(
            R.drawable.ic_pet,
            R.string.home_pet_management,
            R.color.primary,
            "pets"
        ));
        
        features.add(new FeatureItem(
            R.drawable.ic_health,
            R.string.home_health_monitor,
            R.color.health_good,
            "health"
        ));
        
        features.add(new FeatureItem(
            R.drawable.ic_emotion,
            R.string.home_emotion_analysis,
            R.color.emotion_happy,
            "emotion"
        ));
        
        features.add(new FeatureItem(
            R.drawable.ic_reminder,
            R.string.home_smart_reminder,
            R.color.warning,
            "reminders"
        ));
        
        features.add(new FeatureItem(
            R.drawable.ic_ai,
            R.string.home_ai_consultant,
            R.color.info,
            "ai-consultant"
        ));
        
        features.add(new FeatureItem(
            R.drawable.ic_monitor,
            R.string.home_camera_monitor,
            R.color.primary_dark,
            "monitor"
        ));
        
        features.add(new FeatureItem(
            R.drawable.ic_services,
            R.string.home_services,
            R.color.success,
            "services"
        ));
        
        features.add(new FeatureItem(
            R.drawable.ic_training,
            R.string.home_training,
            R.color.primary_400,
            "training"
        ));
        
        return features;
    }

    private void handleFeatureClick(FeatureItem feature) {
        MainActivity activity = (MainActivity) requireActivity();
        
        switch (feature.getId()) {
            case "health":
                activity.navigateTo(R.id.nav_health);
                break;
            case "emotion":
                activity.navigateTo(R.id.nav_emotion);
                break;
            case "monitor":
                activity.navigateTo(R.id.nav_monitor);
                break;
            default:
                // 其他功能待实现
                break;
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}