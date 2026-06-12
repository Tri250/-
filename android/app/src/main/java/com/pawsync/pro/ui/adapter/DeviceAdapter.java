package com.pawsync.pro.ui.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.pawsync.pro.R;
import com.pawsync.pro.model.Device;

import java.util.List;

/**
 * 设备列表适配器
 */
public class DeviceAdapter extends RecyclerView.Adapter<DeviceAdapter.DeviceViewHolder> {

    private List<Device> devices;
    private OnDeviceClickListener listener;

    public interface OnDeviceClickListener {
        void onDeviceClick(Device device);
        void onDeviceManageClick(Device device);
    }

    public DeviceAdapter(List<Device> devices, OnDeviceClickListener listener) {
        this.devices = devices;
        this.listener = listener;
    }

    @NonNull
    @Override
    public DeviceViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_device, parent, false);
        return new DeviceViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull DeviceViewHolder holder, int position) {
        Device device = devices.get(position);
        holder.bind(device, listener);
    }

    @Override
    public int getItemCount() {
        return devices.size();
    }

    public void updateData(List<Device> newDevices) {
        this.devices = newDevices;
        notifyDataSetChanged();
    }

    static class DeviceViewHolder extends RecyclerView.ViewHolder {
        private ImageView deviceIcon;
        private TextView deviceName;
        private TextView deviceStatus;
        private TextView batteryText;
        private TextView manageButton;

        public DeviceViewHolder(@NonNull View itemView) {
            super(itemView);
            deviceIcon = itemView.findViewById(R.id.device_icon);
            deviceName = itemView.findViewById(R.id.device_name);
            deviceStatus = itemView.findViewById(R.id.device_status);
            batteryText = itemView.findViewById(R.id.device_battery);
            manageButton = itemView.findViewById(R.id.device_manage);
        }

        public void bind(Device device, OnDeviceClickListener listener) {
            deviceName.setText(device.getName());

            // 设置在线状态
            if (device.isOnline()) {
                deviceStatus.setText("在线");
                deviceStatus.setTextColor(itemView.getContext().getColor(R.color.status_online));
            } else {
                deviceStatus.setText("离线");
                deviceStatus.setTextColor(itemView.getContext().getColor(R.color.status_offline));
            }

            // 设置电量
            batteryText.setText(device.getBatteryLevel() + "%");

            // 设置图标
            String type = device.getType();
            if ("feeder".equals(type)) {
                deviceIcon.setImageResource(R.drawable.ic_feeder);
            } else if ("collar".equals(type)) {
                deviceIcon.setImageResource(R.drawable.ic_collar);
            } else if ("water_dispenser".equals(type)) {
                deviceIcon.setImageResource(R.drawable.ic_water);
            } else {
                deviceIcon.setImageResource(R.drawable.ic_device);
            }

            // 点击事件
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onDeviceClick(device);
                }
            });

            manageButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onDeviceManageClick(device);
                }
            });
        }
    }
}