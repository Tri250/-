package com.pawsync.pro.ui.activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.pawsync.pro.R;
import com.pawsync.pro.data.DataRepository;
import com.pawsync.pro.model.HealthRecord;
import com.pawsync.pro.ui.adapter.HealthRecordAdapter;

import java.util.ArrayList;
import java.util.List;

/**
 * 记录页Activity - 显示健康记录时间线
 * 功能：记录列表、分类筛选、添加记录、记录详情
 */
public class RecordsActivity extends AppCompatActivity implements HealthRecordAdapter.OnRecordClickListener {

    private DataRepository dataRepository;
    private List<HealthRecord> records;
    private HealthRecordAdapter adapter;
    private String currentFilter = "all";

    private RecyclerView recordsRecyclerView;
    private LinearLayout tabAll, tabFeed, tabWater, tabActivity, tabHealth;
    private ImageView navHomeIcon, navDevicesIcon, navRecordsIcon, navProfileIcon;
    private TextView navHomeText, navDevicesText, navRecordsText, navProfileText;
    private LinearLayout navHome, navDevices, navAdd, navRecords, navProfile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_records);

        dataRepository = DataRepository.getInstance(this);
        String petId = dataRepository.getCurrentPet() != null ? dataRepository.getCurrentPet().getId() : "1";
        records = dataRepository.getHealthRecordsByPetId(petId);

        initViews();
        setupRecyclerView();
        setupClickListeners();
        updateNavigationState(2);
    }

    private void initViews() {
        recordsRecyclerView = findViewById(R.id.records_recycler);
        tabAll = findViewById(R.id.tab_all);
        tabFeed = findViewById(R.id.tab_feed);
        tabWater = findViewById(R.id.tab_water);
        tabActivity = findViewById(R.id.tab_activity);
        tabHealth = findViewById(R.id.tab_health);

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
        adapter = new HealthRecordAdapter(getFilteredRecords(), this);
        recordsRecyclerView.setLayoutManager(new LinearLayoutManager(this));
        recordsRecyclerView.setAdapter(adapter);
    }

    private List<HealthRecord> getFilteredRecords() {
        List<HealthRecord> filtered = new ArrayList<>();
        for (HealthRecord record : records) {
            if ("all".equals(currentFilter)) {
                filtered.add(record);
            } else if (currentFilter.equals(record.getType())) {
                filtered.add(record);
            }
        }
        return filtered;
    }

    private void setupClickListeners() {
        tabAll.setOnClickListener(v -> { currentFilter = "all"; updateTabState(); adapter.updateData(getFilteredRecords()); });
        tabFeed.setOnClickListener(v -> { currentFilter = "feed"; updateTabState(); adapter.updateData(getFilteredRecords()); });
        tabWater.setOnClickListener(v -> { currentFilter = "water"; updateTabState(); adapter.updateData(getFilteredRecords()); });
        tabActivity.setOnClickListener(v -> { currentFilter = "activity"; updateTabState(); adapter.updateData(getFilteredRecords()); });
        tabHealth.setOnClickListener(v -> { currentFilter = "health"; updateTabState(); adapter.updateData(getFilteredRecords()); });

        navHome.setOnClickListener(v -> { startActivity(new Intent(this, MainActivity.class)); overridePendingTransition(0, 0); finish(); });
        navDevices.setOnClickListener(v -> { startActivity(new Intent(this, DevicesActivity.class)); overridePendingTransition(0, 0); finish(); });
        navAdd.setOnClickListener(v -> showAddRecordDialog());
        navRecords.setOnClickListener(v -> { });
        navProfile.setOnClickListener(v -> { startActivity(new Intent(this, ProfileActivity.class)); overridePendingTransition(0, 0); finish(); });
    }

    private void updateTabState() {
        int activeColor = getResources().getColor(R.color.brand_primary);
        int inactiveColor = getResources().getColor(R.color.text_tertiary);

        ((TextView)tabAll.getChildAt(0)).setTextColor("all".equals(currentFilter) ? activeColor : inactiveColor);
        ((TextView)tabFeed.getChildAt(0)).setTextColor("feed".equals(currentFilter) ? activeColor : inactiveColor);
        ((TextView)tabWater.getChildAt(0)).setTextColor("water".equals(currentFilter) ? activeColor : inactiveColor);
        ((TextView)tabActivity.getChildAt(0)).setTextColor("activity".equals(currentFilter) ? activeColor : inactiveColor);
        ((TextView)tabHealth.getChildAt(0)).setTextColor("health".equals(currentFilter) ? activeColor : inactiveColor);
    }

    private void updateNavigationState(int selected) {
        int activeColor = getResources().getColor(R.color.nav_active);
        int inactiveColor = getResources().getColor(R.color.nav_inactive);
        ImageView[] icons = {navHomeIcon, navDevicesIcon, navRecordsIcon, navProfileIcon};
        TextView[] texts = {navHomeText, navDevicesText, navRecordsText, navProfileText};
        for (int i = 0; i < 4; i++) {
            icons[i].setColorFilter(i == selected ? activeColor : inactiveColor);
            texts[i].setTextColor(i == selected ? activeColor : inactiveColor);
        }
    }

    private void showAddRecordDialog() {
        AddRecordDialog dialog = new AddRecordDialog(this);
        dialog.setOnRecordAddedListener((type, content) -> {
            HealthRecord record = new HealthRecord();
            record.setPetId(dataRepository.getCurrentPet() != null ? dataRepository.getCurrentPet().getId() : "1");
            record.setType(type);
            record.setTitle(getRecordTitle(type));
            record.setContent(content);
            dataRepository.addHealthRecord(record);
            records = dataRepository.getHealthRecordsByPetId(record.getPetId());
            adapter.updateData(getFilteredRecords());
        });
        dialog.show();
    }

    private String getRecordTitle(String type) {
        switch (type) { case "feed": return "喂食"; case "water": return "饮水"; case "activity": return "活动"; case "health": return "健康"; default: return "其他"; }
    }

    @Override
    public void onRecordClick(HealthRecord record) {
        Intent intent = new Intent(this, RecordDetailActivity.class);
        intent.putExtra("record_id", record.getId());
        startActivity(intent);
    }

    @Override
    protected void onResume() {
        super.onResume();
        String petId = dataRepository.getCurrentPet() != null ? dataRepository.getCurrentPet().getId() : "1";
        records = dataRepository.getHealthRecordsByPetId(petId);
        adapter.updateData(getFilteredRecords());
        updateNavigationState(2);
    }
}