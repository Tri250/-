package com.pawsync.pro.ui.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.pawsync.pro.databinding.ItemFeatureBinding;
import com.pawsync.pro.ui.model.FeatureItem;

import java.util.List;

/**
 * 功能卡片适配器
 */
public class FeatureAdapter extends RecyclerView.Adapter<FeatureAdapter.ViewHolder> {

    private final List<FeatureItem> features;
    private final OnFeatureClickListener listener;

    public interface OnFeatureClickListener {
        void onFeatureClick(FeatureItem feature);
    }

    public FeatureAdapter(List<FeatureItem> features, OnFeatureClickListener listener) {
        this.features = features;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemFeatureBinding binding = ItemFeatureBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false
        );
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        FeatureItem feature = features.get(position);
        holder.bind(feature, listener);
    }

    @Override
    public int getItemCount() {
        return features.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final ItemFeatureBinding binding;

        ViewHolder(ItemFeatureBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(FeatureItem feature, OnFeatureClickListener listener) {
            binding.featureIcon.setImageResource(feature.getIconRes());
            binding.featureTitle.setText(feature.getTitleRes());
            
            // 设置卡片点击事件
            binding.getRoot().setOnClickListener(v -> {
                if (listener != null) {
                    listener.onFeatureClick(feature);
                }
            });
        }
    }
}