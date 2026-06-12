package com.pawsync.pro.ui.activity;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

import com.pawsync.pro.R;
import com.pawsync.pro.data.DataRepository;
import com.pawsync.pro.model.Pet;
import com.pawsync.pro.model.Device;
import com.pawsync.pro.ui.dialog.AddRecordDialog;

import java.util.List;

/**
 * 主Activity - 首页
 * 实现所有功能模块的真实点击交互
 */
public class MainActivity extends AppCompatActivity {

    private DataRepository dataRepository;
    private Pet currentPet;
    private List<Device> devices;

    // UI组件
    private ImageView petAvatar;
    private TextView petName;
    private TextView petGender;
    private TextView petBreedAge;
    private TextView petStatus;
    private LinearLayout petHeader;

    // 快捷功能
    private LinearLayout actionAI;
    private LinearLayout actionHealth;
    private LinearLayout actionDiet;
    private LinearLayout actionArchive;

    // 服务大厅
    private LinearLayout serviceTraining;
    private LinearLayout serviceInsurance;
    private LinearLayout serviceMedical;
    private LinearLayout serviceMall;

    // 设备容器
    private LinearLayout devicesContainer;
    private TextView devicesViewAll;

    // 底部导航
    private LinearLayout navHome;
    private LinearLayout navDevices;
    private LinearLayout navAdd;
    private LinearLayout navRecords;
    private LinearLayout navProfile;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // 初始化数据仓库
        dataRepository = DataRepository.getInstance(this);

        // 初始化视图
        initViews();

        // 加载数据
        loadData();

        // 设置点击事件
        setupClickListeners();

        // 更新UI
        updateUI();
    }

    private void initViews() {
        // 宠物信息
        petAvatar = findViewById(R.id.pet_avatar);
        petName = findViewById(R.id.pet_name);
        petGender = findViewById(R.id.pet_gender);
        petBreedAge = findViewById(R.id.pet_breed_age);
        petStatus = findViewById(R.id.pet_status);
        petHeader = findViewById(R.id.pet_header);

        // 快捷功能
        actionAI = findViewById(R.id.action_ai);
        actionHealth = findViewById(R.id.action_health);
        actionDiet = findViewById(R.id.action_diet);
        actionArchive = findViewById(R.id.action_archive);

        // 服务大厅
        serviceTraining = findViewById(R.id.service_training);
        serviceInsurance = findViewById(R.id.service_insurance);
        serviceMedical = findViewById(R.id.service_medical);
        serviceMall = findViewById(R.id.service_mall);

        // 设备
        devicesContainer = findViewById(R.id.devices_container);
        devicesViewAll = findViewById(R.id.devices_view_all);

        // 底部导航
        navHome = findViewById(R.id.nav_home);
        navDevices = findViewById(R.id.nav_devices);
        navAdd = findViewById(R.id.nav_add);
        navRecords = findViewById(R.id.nav_records);
        navProfile = findViewById(R.id.nav_profile);
    }

    private void loadData() {
        currentPet = dataRepository.getCurrentPet();
        devices = dataRepository.getAllDevices();
    }

    private void setupClickListeners() {
        // 宠物信息点击 - 进入宠物管理
        petHeader.setOnClickListener(v -> {
            Intent intent = new Intent(this, PetsActivity.class);
            startActivity(intent);
            showToast("进入宠物管理");
        });

        // 快捷功能点击
        actionAI.setOnClickListener(v -> {
            Intent intent = new Intent(this, AIConsultantActivity.class);
            startActivity(intent);
            showToast("进入AI问诊");
        });

        actionHealth.setOnClickListener(v -> {
            Intent intent = new Intent(this, HealthActivity.class);
            startActivity(intent);
            showToast("进入健康报告");
        });

        actionDiet.setOnClickListener(v -> {
            Intent intent = new Intent(this, DietAdviceActivity.class);
            startActivity(intent);
            showToast("进入饮食建议");
        });

        actionArchive.setOnClickListener(v -> {
            Intent intent = new Intent(this, PetsActivity.class);
            startActivity(intent);
            showToast("进入宠物档案");
        });

        // 服务大厅点击
        serviceTraining.setOnClickListener(v -> {
            Intent intent = new Intent(this, TrainingActivity.class);
            startActivity(intent);
            showToast("进入训练课程");
        });

        serviceInsurance.setOnClickListener(v -> {
            Intent intent = new Intent(this, InsuranceActivity.class);
            startActivity(intent);
            showToast("进入宠物保险");
        });

        serviceMedical.setOnClickListener(v -> {
            Intent intent = new Intent(this, MedicalActivity.class);
            startActivity(intent);
            showToast("进入医疗服务");
        });

        serviceMall.setOnClickListener(v -> {
            Intent intent = new Intent(this, ServicesActivity.class);
            startActivity(intent);
            showToast("进入服务商城");
        });

        // 设备查看全部
        devicesViewAll.setOnClickListener(v -> {
            Intent intent = new Intent(this, DevicesActivity.class);
            startActivity(intent);
        });

        // 底部导航点击
        navHome.setOnClickListener(v -> {
            // 已在首页，无需跳转
            updateNavigationState(0);
        });

        navDevices.setOnClickListener(v -> {
            Intent intent = new Intent(this, DevicesActivity.class);
            startActivity(intent);
            overridePendingTransition(0, 0);
        });

        navAdd.setOnClickListener(v -> {
            showAddRecordDialog();
        });

        navRecords.setOnClickListener(v -> {
            Intent intent = new Intent(this, RecordsActivity.class);
            startActivity(intent);
            overridePendingTransition(0, 0);
        });

        navProfile.setOnClickListener(v -> {
            Intent intent = new Intent(this, ProfileActivity.class);
            startActivity(intent);
            overridePendingTransition(0, 0);
        });
    }

    private void updateUI() {
        if (currentPet != null) {
            petName.setText(currentPet.getName());
            petGender.setText("male".equals(currentPet.getGender()) ? "♂" : "♀");
            petBreedAge.setText(currentPet.getBreed() + " · " + currentPet.getAge() + "岁");

            // 设置健康状态
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

        // 动态添加设备项
        devicesContainer.removeAllViews();
        for (Device device : devices) {
            addDeviceView(device);
        }
        // 添加"添加设备"按钮
        addAddDeviceView();
    }

    private void addDeviceView(Device device) {
        LinearLayout deviceView = new LinearLayout(this);
        deviceView.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        deviceView.setOrientation(LinearLayout.VERTICAL);
        deviceView.setGravity(android.view.Gravity.CENTER);
        deviceView.setPadding(8, 8, 8, 8);

        // 状态指示
        TextView statusText = new TextView(this);
        statusText.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        statusText.setTextSize(10);
        statusText.setTextColor(getResources().getColor(device.isOnline() ? R.color.status_online : R.color.status_offline));
        statusText.setText(device.isOnline() ? "在线" : "离线");
        deviceView.addView(statusText);

        // 设备图标
        ImageView icon = new ImageView(this);
        icon.setLayoutParams(new LinearLayout.LayoutParams(56, 56));
        icon.setImageResource(getDeviceIcon(device.getType()));
        icon.setBackgroundColor(getResources().getColor(getDeviceColor(device.getType())));
        deviceView.addView(icon);

        // 设备名称
        TextView nameText = new TextView(this);
        nameText.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        nameText.setTextSize(12);
        nameText.setTextColor(getResources().getColor(R.color.text_primary));
        nameText.setText(device.getName());
        deviceView.addView(nameText);

        // 电量
        TextView batteryText = new TextView(this);
        batteryText.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        batteryText.setTextSize(10);
        batteryText.setTextColor(getResources().getColor(R.color.status_online));
        batteryText.setText(device.getBatteryLevel() + "%");
        deviceView.addView(batteryText);

        // 点击事件
        deviceView.setOnClickListener(v -> {
            Intent intent = new Intent(this, DeviceDetailActivity.class);
            intent.putExtra("device_id", device.getId());
            startActivity(intent);
            showToast("查看设备详情: " + device.getName());
        });

        devicesContainer.addView(deviceView);
    }

    private void addAddDeviceView() {
        LinearLayout addView = new LinearLayout(this);
        addView.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        addView.setOrientation(LinearLayout.VERTICAL);
        addView.setGravity(android.view.Gravity.CENTER);
        addView.setPadding(8, 8, 8, 8);

        // 占位
        View spacer = new View(this);
        spacer.setLayoutParams(new LinearLayout.LayoutParams(1, 16));
        addView.addView(spacer);

        // 添加图标
        ImageView icon = new ImageView(this);
        icon.setLayoutParams(new LinearLayout.LayoutParams(56, 56));
        icon.setImageResource(R.drawable.ic_add);
        icon.setBackgroundResource(R.drawable.bg_add_device);
        addView.addView(icon);

        // 文字
        TextView nameText = new TextView(this);
        nameText.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));
        nameText.setTextSize(12);
        nameText.setTextColor(getResources().getColor(R.color.text_tertiary));
        nameText.setText("添加设备");
        addView.addView(nameText);

        // 占位
        View spacer2 = new View(this);
        spacer2.setLayoutParams(new LinearLayout.LayoutParams(1, 16));
        addView.addView(spacer2);

        // 点击事件
        addView.setOnClickListener(v -> {
            Intent intent = new Intent(this, AddDeviceActivity.class);
            startActivity(intent);
            showToast("添加新设备");
        });

        devicesContainer.addView(addView);
    }

    private int getDeviceIcon(String type) {
        switch (type) {
            case "feeder":
                return R.drawable.ic_feeder;
            case "collar":
                return R.drawable.ic_collar;
            case "water_dispenser":
                return R.drawable.ic_water;
            default:
                return R.drawable.ic_device;
        }
    }

    private int getDeviceColor(String type) {
        switch (type) {
            case "feeder":
                return R.color.color_orange_light;
            case "collar":
                return R.color.color_blue_light;
            case "water_dispenser":
                return R.color.color_cyan_light;
            default:
                return R.color.bg_secondary;
        }
    }

    private void updateNavigationState(int selected) {
        // 更新导航栏选中状态
        int[] icons = {R.drawable.ic_home_filled, R.drawable.ic_device_outline, R.drawable.ic_record_outline, R.drawable.ic_profile_outline};
        int[] texts = {R.string.title_home, R.string.title_devices, R.string.title_records, R.string.title_profile};
        LinearLayout[] navs = {navHome, navDevices, navRecords, navProfile};

        for (int i = 0; i < 4; i++) {
            ImageView iconView = (ImageView) navs[i].getChildAt(0);
            TextView textView = (TextView) navs[i].getChildAt(1);
            if (i == selected) {
                iconView.setColorFilter(getResources().getColor(R.color.nav_active));
                textView.setTextColor(getResources().getColor(R.color.nav_active));
            } else {
                iconView.setColorFilter(getResources().getColor(R.color.nav_inactive));
                textView.setTextColor(getResources().getColor(R.color.nav_inactive));
            }
        }
    }

    private void showAddRecordDialog() {
        // 显示添加记录对话框
        AddRecordDialog dialog = new AddRecordDialog(this);
        dialog.show();
    }

    private void showToast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // 刷新数据
        loadData();
        updateUI();
        updateNavigationState(0);
    }
}