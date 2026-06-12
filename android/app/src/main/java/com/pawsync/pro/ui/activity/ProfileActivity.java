package com.pawsync.pro.ui.activity;

import android.content.Intent;
import android.os.Bundle;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.pawsync.pro.R;
import com.pawsync.pro.data.DataRepository;
import com.pawsync.pro.model.Pet;
import com.pawsync.pro.ui.dialog.AddRecordDialog;

/**
 * 我的页Activity - 个人中心
 * 功能：宠物信息、统计数据、服务入口、设置
 */
public class ProfileActivity extends AppCompatActivity {

    private DataRepository dataRepository;
    private Pet currentPet;

    private ImageView petAvatar;
    private TextView petName, petGender, petBreedAge, petStatus;
    private LinearLayout petHeader;
    private TextView growthValue, medalsCount, followingCount, messagesCount;
    private LinearLayout serviceOrders, appointments, favorites, coupons;
    private LinearLayout petManagement, myFamily, privacySettings, helpFeedback, aboutUs;
    private ImageView navHomeIcon, navDevicesIcon, navRecordsIcon, navProfileIcon;
    private TextView navHomeText, navDevicesText, navRecordsText, navProfileText;
    private LinearLayout navHome, navDevices, navAdd, navRecords, navProfile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_profile);

        dataRepository = DataRepository.getInstance(this);
        currentPet = dataRepository.getCurrentPet();

        initViews();
        setupClickListeners();
        updateUI();
        updateNavigationState(3);
    }

    private void initViews() {
        petAvatar = findViewById(R.id.pet_avatar);
        petName = findViewById(R.id.pet_name);
        petGender = findViewById(R.id.pet_gender);
        petBreedAge = findViewById(R.id.pet_breed_age);
        petStatus = findViewById(R.id.pet_status);
        petHeader = findViewById(R.id.pet_header);

        growthValue = findViewById(R.id.growth_value);
        medalsCount = findViewById(R.id.medals_count);
        followingCount = findViewById(R.id.following_count);
        messagesCount = findViewById(R.id.messages_count);

        serviceOrders = findViewById(R.id.service_orders);
        appointments = findViewById(R.id.appointments);
        favorites = findViewById(R.id.favorites);
        coupons = findViewById(R.id.coupons);

        petManagement = findViewById(R.id.pet_management);
        myFamily = findViewById(R.id.my_family);
        privacySettings = findViewById(R.id.privacy_settings);
        helpFeedback = findViewById(R.id.help_feedback);
        aboutUs = findViewById(R.id.about_us);

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

    private void setupClickListeners() {
        petHeader.setOnClickListener(v -> { startActivity(new Intent(this, PetsActivity.class)); });

        serviceOrders.setOnClickListener(v -> { startActivity(new Intent(this, ServicesActivity.class)); });
        appointments.setOnClickListener(v -> { startActivity(new Intent(this, AppointmentsActivity.class)); });
        favorites.setOnClickListener(v -> { startActivity(new Intent(this, FavoritesActivity.class)); });
        coupons.setOnClickListener(v -> { startActivity(new Intent(this, CouponsActivity.class)); });

        petManagement.setOnClickListener(v -> { startActivity(new Intent(this, PetsActivity.class)); });
        myFamily.setOnClickListener(v -> { startActivity(new Intent(this, FamilyActivity.class)); });
        privacySettings.setOnClickListener(v -> { startActivity(new Intent(this, SettingsActivity.class)); });
        helpFeedback.setOnClickListener(v -> { startActivity(new Intent(this, HelpFeedbackActivity.class)); });
        aboutUs.setOnClickListener(v -> { startActivity(new Intent(this, AboutActivity.class)); });

        navHome.setOnClickListener(v -> { startActivity(new Intent(this, MainActivity.class)); overridePendingTransition(0, 0); finish(); });
        navDevices.setOnClickListener(v -> { startActivity(new Intent(this, DevicesActivity.class)); overridePendingTransition(0, 0); finish(); });
        navAdd.setOnClickListener(v -> showAddRecordDialog());
        navRecords.setOnClickListener(v -> { startActivity(new Intent(this, RecordsActivity.class)); overridePendingTransition(0, 0); finish(); });
        navProfile.setOnClickListener(v -> { });
    }

    private void updateUI() {
        if (currentPet != null) {
            petName.setText(currentPet.getName());
            petGender.setText("male".equals(currentPet.getGender()) ? "♂" : "♀");
            petBreedAge.setText(currentPet.getBreed() + " · " + currentPet.getAge() + "岁");

            String status = currentPet.getHealthStatus();
            if ("excellent".equals(status)) {
                petStatus.setText("活力充沛");
                petStatus.setTextColor(getResources().getColor(R.color.status_online));
            } else if ("good".equals(status)) {
                petStatus.setText("健康良好");
                petStatus.setTextColor(getResources().getColor(R.color.status_online));
            } else {
                petStatus.setText("需要关注");
                petStatus.setTextColor(getResources().getColor(R.color.status_warning));
            }
        }

        // 统计数据（示例）
        growthValue.setText("1250");
        medalsCount.setText("12");
        followingCount.setText("8");
        messagesCount.setText("23");
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
        dialog.show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        currentPet = dataRepository.getCurrentPet();
        updateUI();
        updateNavigationState(3);
    }
}