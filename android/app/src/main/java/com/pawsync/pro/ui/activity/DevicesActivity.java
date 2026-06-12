package com.pawsync.pro.ui.activity;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.pawsync.pro.R;
import com.pawsync.pro.data.DataRepository;
import com.pawsync.pro.model.Device;
import com.pawsync.pro.ui.adapter.DeviceAdapter;

import java.util.ArrayList;
import java.util.List;

/**
 * 设备页Activity - 显示所有智能设备
 * 功能：设备列表、设备管理、添加设备、设备详情
 */
public class DevicesActivity extends AppCompatActivity implements DeviceAdapter.OnDeviceClickListener {

    private DataRepository dataRepository;
    private List<Device> devices;
    private DeviceAdapter adapter;
    private String currentFilter = "all";

    // UI组件
    private RecyclerView devicesRecyclerView;
    private LinearLayout tabAll;
    private LinearLayout tabFeed;
    private LinearLayout tabWear;
    private LinearLayout addDeviceCard;
    private ImageView navHomeIcon;
    private ImageView navDevicesIcon;
    private ImageView navRecordsIcon;
    private ImageView navProfileIcon;
    private TextView navHomeText;
    private TextView navDevicesText;
    private TextView navRecordsText;
    private TextView navProfileText;
    private LinearLayout navHome;
    private LinearLayout navDevices;
    private LinearLayout navAdd;
    private LinearLayout navRecords;
    private LinearLayout navProfile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_devices);

        dataRepository = DataRepository.getInstance(this);
        devices = dataRepository.getAllDevices();

        initViews();
        setupRecyclerView();
        setupClickListeners();
        updateNavigationState(1);
    }

    private void initViews() {
        devicesRecyclerView = findViewById(R.id.devices_recycler);
        tabAll = findViewById(R.id.tab_all);
        tabFeed = findViewById(R.id.tab_feed);
        tabWear = findViewById(R.id.tab_wear);
        addDeviceCard = findViewById(R.id.add_device_card);

        navHome = findViewById(R.id.nav_home);
        navDevices = findViewById(R.id.nav_devices);
        navAdd = findViewById(R.id.nav_add);
        navRecords = findViewById(R.id.nav_records);
        navProfile = findViewById(R.id.nav_profile);

        navHomeIcon = findViewById(R.id.nav_home_icon);
        navDevicesIcon = findViewById(R.id.nav_devices_icon);
        navRecordsIcon = findViewById(R.id.nav_records_icon);
        navProfileIcon = findViewById(R.id.nav_profile_icon);

        navHomeText = findViewById(R.id.nav_home_text);
        navDevicesText = findViewById(R.id.nav_devices_text);
        navRecordsText = findViewById(R.id.nav_records_text);
        navProfileText = findViewById(R.id.nav_profile_text);
    }

    private void setupRecyclerView() {
        adapter = new DeviceAdapter(getFilteredDevices(), this);
        devicesRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        devicesRecyclerView.setAdapter(adapter);
    }

    private List<Device> getFilteredDevices() {
        List<Device> filtered = new ArrayList<>();
        for (Device device : devices) {
            if ("all".equals(currentFilter)) {
                filtered.add(device);
            } else if ("feed".equals(currentFilter) && ("feeder".equals(device.getType()) || "water_dispenser".equals(device.getType()))) {
                filtered.add(device);
            } else if ("wear".equals(currentFilter) && "collar".equals(device.getType())) {
                filtered.add(device);
            }
        }
        return filtered;
    }

    private void setupClickListeners() {
        // 标签切换
        tabAll.setOnClickListener(v -> {
            currentFilter = "all";
            updateTabState();
            adapter.updateData(getFilteredDevices());
        });

        tabFeed.setOnClickListener(v -> {
            currentFilter = "feed";
            updateTabState();
            adapter.updateData(getFilteredDevices());
        });

        tabWear.setOnClickListener(v -> {
            currentFilter = "wear";
            updateTabState();
            adapter.updateData(getFilteredDevices());
        });

        // 添加设备
        addDeviceCard.setOnClickListener(v -> {
            Intent intent = new Intent(this, AddDeviceActivity.class);
            startActivity(intent);
        });

        // 底部导航
        navHome.setOnClickListener(v -> {
            Intent intent = new Intent(this, MainActivity.class);
            startActivity(intent);
            overridePendingTransition(0, 0);
            finish();
        });

        navDevices.setOnClickListener(v -> {
            // 已在设备页
        });

        navAdd.setOnClickListener(v -> {
            showAddRecordDialog();
        });

        navRecords.setOnClickListener(v -> {
            Intent intent = new Intent(this, RecordsActivity.class);
            startActivity(intent);
            overridePendingTransition(0, 0);
            finish();
        });

        navProfile.setOnClickListener(v -> {
            Intent intent = new Intent(this, ProfileActivity.class);
            startActivity(intent);
            overridePendingTransition(0, 0);
            finish();
        });
    }

    private void updateTabState() {
        // 更新标签选中状态
        TextView tabAllText = (TextView) tabAll.getChildAt(0);
        TextView tabFeedText = (TextView) tabFeed.getChildAt(0);
        TextView tabWearText = (TextView) tabWear.getChildAt(0);

        int activeColor = getResources().getColor(R.color.brand_primary);
        int inactiveColor = getResources().getColor(R.color.text_tertiary);

        tabAllText.setTextColor("all".equals(currentFilter) ? activeColor : inactiveColor);
        tabFeedText.setTextColor("feed".equals(currentFilter) ? activeColor : inactiveColor);
        tabWearText.setTextColor("wear".equals(currentFilter) ? activeColor : inactiveColor);
    }

    private void updateNavigationState(int selected) {
        int activeColor = getResources().getColor(R.color.nav_active);
        int inactiveColor = getResources().getColor(R.color.nav_inactive);

        ImageView[] icons = {navHomeIcon, navDevicesIcon, navRecordsIcon, navProfileIcon};
        TextView[] texts = {navHomeText, navDevicesText, navRecordsText, navProfileText};

        for (int i = 0; i < 4; i++) {
            icons[i].setColorFilter(i == selected ? activeColor : inactiveColor);
            texts[i]..setTextColor(i == selected ? activeColor : inactiveColor);
        }
    }

    private void showAddRecordDialog() {
        AddRecordDialog dialog = new AddRecordDialog(this);
        dialog.setOnRecordAddedListener((type, content) -> {
            com.pawsync.pro.model.HealthRecord record = new com.pawsync.pro.model.HealthRecord();
            record.setPetId(dataRepository.getCurrentPet() != null ? dataRepository.getCurrentPet().getId() : "1");
            record.setType(type);
            record.setTitle(getRecordTitle(type));
            record.setContent(content);
            dataRepository.addHealthRecord(record);
        });
        dialog.show();
    }

    private String getRecordTitle(String type) {
        switch (type) {
            case "feed": return "喂食";
            case "water": return "饮水";
            case "activity": return "活动";
            case "health": return "健康";
            default: return "其他";
        }
    }

    @Override
    public void onDeviceClick(Device device) {
        Intent intent = new Intent(this, DeviceDetailActivity.class);
        intent.putExtra("device_id", device.getId());
        startActivity(intent);
    }

    @Override
    public void onDeviceManageClick(Device device) {
        Intent intent = new Intent(this, DeviceManageActivity.class);
        intent.putExtra("device_id", device.getId());
        startActivity(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();
        devices = dataRepository.getAllDevices();
        adapter.updateData(getFilteredDevices());
        updateNavigationState(1);
    }
}