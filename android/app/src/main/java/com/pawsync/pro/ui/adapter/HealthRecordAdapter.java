package com.pawsync.pro.ui.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.pawsync.pro.R;
import com.pawsync.pro.model.HealthRecord;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * 健康记录列表适配器
 */
public class HealthRecordAdapter extends RecyclerView.Adapter<HealthRecordAdapter.RecordViewHolder> {

    private List<HealthRecord> records;
    private OnRecordClickListener listener;
    private SimpleDateFormat dateFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());

    public interface OnRecordClickListener {
        void onRecordClick(HealthRecord record);
    }

    public HealthRecordAdapter(List<HealthRecord> records, OnRecordClickListener listener) {
        this.records = records;
        this.listener = listener;
    }

    @NonNull
    @Override
    public RecordViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_health_record, parent, false);
        return new RecordViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull RecordViewHolder holder, int position) {
        HealthRecord record = records.get(position);
        holder.bind(record, listener);
    }

    @Override
    public int getItemCount() {
        return records.size();
    }

    public void updateData(List<HealthRecord> newRecords) {
        this.records = newRecords;
        notifyDataSetChanged();
    }

    static class RecordViewHolder extends RecyclerView.ViewHolder {
        private ImageView typeIcon;
        private TextView titleText;
        private TextView contentText;
        private TextView timeText;
        private TextView tagText;
        private View timelineDot;

        public RecordViewHolder(@NonNull View itemView) {
            super(itemView);
            typeIcon = itemView.findViewById(R.id.record_icon);
            titleText = itemView.findViewById(R.id.record_title);
            contentText = itemView.findViewById(R.id.record_content);
            timeText = itemView.findViewById(R.id.record_time);
            tagText = itemView.findViewById(R.id.record_tag);
            timelineDot = itemView.findViewById(R.id.timeline_dot);
        }

        public void bind(HealthRecord record, OnRecordClickListener listener) {
            titleText.setText(record.getTitle());
            contentText.setText(record.getContent());

            // 设置时间
            try {
                long timestamp = Long.parseLong(record.getTimestamp());
                timeText.setText(new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date(timestamp)));
            } catch (NumberFormatException e) {
                timeText.setText(record.getTimestamp());
            }

            // 设置标签
            if (record.getTag() != null && !record.getTag().isEmpty()) {
                tagText.setText(record.getTag());
                tagText.setVisibility(View.VISIBLE);
            } else {
                tagText.setVisibility(View.GONE);
            }

            // 设置图标和颜色
            String type = record.getType();
            int color;
            if ("feed".equals(type)) {
                typeIcon.setImageResource(R.drawable.ic_feed);
                color = itemView.getContext().getColor(R.color.type_feed);
            } else if ("water".equals(type)) {
                typeIcon.setImageResource(R.drawable.ic_water);
                color = itemView.getContext().getColor(R.color.type_water);
            } else if ("activity".equals(type)) {
                typeIcon.setImageResource(R.drawable.ic_activity);
                color = itemView.getContext().getColor(R.color.type_activity);
            } else if ("health".equals(type)) {
                typeIcon.setImageResource(R.drawable.ic_health);
                color = itemView.getContext().getColor(R.color.type_health);
            } else {
                typeIcon.setImageResource(R.drawable.ic_other);
                color = itemView.getContext().getColor(R.color.type_other);
            }

            timelineDot.setBackgroundColor(color);

            // 点击事件
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onRecordClick(record);
                }
            });
        }
    }
}