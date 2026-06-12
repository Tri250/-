package com.pawsync.pro.data;

import android.content.Context;
import android.content.SharedPreferences;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.pawsync.pro.model.Pet;
import com.pawsync.pro.model.Device;
import com.pawsync.pro.model.HealthRecord;
import com.pawsync.pro.model.HealthMetric;

import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

/**
 * 数据存储管理器
 * 使用SharedPreferences持久化存储数据
 */
public class DataRepository {
    private static final String PREF_NAME = "pawsync_data";
    private static final String KEY_PETS = "pets";
    private static final String KEY_DEVICES = "devices";
    private static final String KEY_HEALTH_RECORDS = "health_records";
    private static final String KEY_HEALTH_METRICS = "health_metrics";
    private static final String KEY_CURRENT_PET_ID = "current_pet_id";

    private final SharedPreferences prefs;
    private final Gson gson;
    private static DataRepository instance;

    // 内存缓存
    private List<Pet> petsCache;
    private List<Device> devicesCache;
    private List<HealthRecord> healthRecordsCache;
    private List<HealthMetric> healthMetricsCache;

    private DataRepository(Context context) {
        prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        gson = new Gson();
        loadFromStorage();
    }

    public static synchronized DataRepository getInstance(Context context) {
        if (instance == null) {
            instance = new DataRepository(context.getApplicationContext());
        }
        return instance;
    }

    /**
     * 从存储加载所有数据
     */
    private void loadFromStorage() {
        petsCache = loadList(KEY_PETS, Pet.class);
        devicesCache = loadList(KEY_DEVICES, Device.class);
        healthRecordsCache = loadList(KEY_HEALTH_RECORDS, HealthRecord.class);
        healthMetricsCache = loadList(KEY_HEALTH_METRICS, HealthMetric.class);

        // 如果没有数据，初始化默认数据
        if (petsCache.isEmpty()) {
            initializeDefaultData();
        }
    }

    /**
     * 初始化默认数据
     */
    private void initializeDefaultData() {
        // 默认宠物
        Pet pet1 = new Pet();
        pet1.setId("1");
        pet1.setName("毛球");
        pet1.setBreed("英国短毛猫");
        pet1.setType("cat");
        pet1.setGender("male");
        pet1.setBirthday(String.valueOf(System.currentTimeMillis() - 2L * 365 * 24 * 60 * 60 * 1000));
        pet1.setWeight(5.2);
        pet1.setColor("橘白");
        pet1.setHealthStatus("good");
        pet1.setCharacteristics("黏人、喜欢晒太阳、怕生人");

        Pet pet2 = new Pet();
        pet2.setId("2");
        pet2.setName("旺财");
        pet2.setBreed("柯基犬");
        pet2.setType("dog");
        pet2.setGender("male");
        pet2.setBirthday(String.valueOf(System.currentTimeMillis() - 3L * 365 * 24 * 60 * 60 * 1000));
        pet2.setWeight(12.5);
        pet2.setColor("黄白");
        pet2.setHealthStatus("excellent");
        pet2.setCharacteristics("活泼、精力充沛、喜欢捡球");

        petsCache.add(pet1);
        petsCache.add(pet2);
        savePets();

        // 默认设备
        Device device1 = new Device();
        device1.setId("1");
        device1.setName("毛球的碗");
        device1.setType("feeder");
        device1.setBrand("小米");
        device1.setModel("MJSXJ02CM");
        device1.setBatteryLevel(85);
        device1.setOnline(true);
        device1.setLocation("客厅");

        Device device2 = new Device();
        device2.setId("2");
        device2.setName("智能项圈");
        device2.setType("collar");
        device2.setBrand("华为");
        device2.setModel("PetCollar-Pro");
        device2.setBatteryLevel(92);
        device2.setOnline(true);
        device2.setLocation("户外");

        Device device3 = new Device();
        device3.setId("3");
        device3.setName("饮水机");
        device3.setType("water_dispenser");
        device3.setBrand("小米");
        device3.setModel("WaterDispenser-V2");
        device3.setBatteryLevel(78);
        device3.setOnline(true);
        device3.setLocation("厨房");

        devicesCache.add(device1);
        devicesCache.add(device2);
        devicesCache.add(device3);
        saveDevices();

        // 默认健康记录
        HealthRecord record1 = new HealthRecord();
        record1.setId("1");
        record1.setPetId("1");
        record1.setType("feed");
        record1.setTitle("喂食");
        record1.setContent("喂食了120g猫粮");
        record1.setTag("主食");

        HealthRecord record2 = new HealthRecord();
        record2.setId("2");
        record2.setPetId("1");
        record2.setType("water");
        record2.setTitle("饮水");
        record2.setContent("喝水200ml");

        HealthRecord record3 = new HealthRecord();
        record3.setId("3");
        record3.setPetId("1");
        record3.setType("activity");
        record3.setTitle("活动");
        record3.setContent("散步30分钟，消耗120kcal");

        healthRecordsCache.add(record1);
        healthRecordsCache.add(record2);
        healthRecordsCache.add(record3);
        saveHealthRecords();

        // 默认健康指标
        HealthMetric metric1 = new HealthMetric();
        metric1.setId("1");
        metric1.setPetId("1");
        metric1.setType("weight");
        metric1.setValue(5.2);
        metric1.setUnit("kg");
        metric1.setStatus("normal");

        HealthMetric metric2 = new HealthMetric();
        metric2.setId("2");
        metric2.setPetId("1");
        metric2.setType("temperature");
        metric2.setValue(38.6);
        metric2.setUnit("°C");
        metric2.setStatus("normal");

        HealthMetric metric3 = new HealthMetric();
        metric3.setId("3");
        metric3.setPetId("1");
        metric3.setType("heart_rate");
        metric3.setValue(120);
        metric3.setUnit("次/分");
        metric3.setStatus("normal");

        healthMetricsCache.add(metric1);
        healthMetricsCache.add(metric2);
        healthMetricsCache.add(metric3);
        saveHealthMetrics();

        // 设置当前宠物
        prefs.edit().putString(KEY_CURRENT_PET_ID, "1").apply();
    }

    /**
     * 从SharedPreferences加载列表数据
     */
    private <T> List<T> loadList(String key, Class<T> clazz) {
        String json = prefs.getString(key, null);
        if (json == null || json.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            Type type = TypeToken.getParameterized(List.class, clazz).getType();
            return gson.fromJson(json, type);
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    /**
     * 保存列表数据到SharedPreferences
     */
    private <T> void saveList(String key, List<T> list) {
        String json = gson.toJson(list);
        prefs.edit().putString(key, json).apply();
    }

    // ========== Pet 操作 ==========

    public List<Pet> getAllPets() {
        return new ArrayList<>(petsCache);
    }

    public Pet getCurrentPet() {
        String currentPetId = prefs.getString(KEY_CURRENT_PET_ID, "1");
        for (Pet pet : petsCache) {
            if (pet.getId().equals(currentPetId)) {
                return pet;
            }
        }
        return petsCache.isEmpty() ? null : petsCache.get(0);
    }

    public void setCurrentPet(String petId) {
        prefs.edit().putString(KEY_CURRENT_PET_ID, petId).apply();
    }

    public void addPet(Pet pet) {
        petsCache.add(pet);
        savePets();
    }

    public void updatePet(Pet pet) {
        for (int i = 0; i < petsCache.size(); i++) {
            if (petsCache.get(i).getId().equals(pet.getId())) {
                pet.setUpdatedAt(System.currentTimeMillis());
                petsCache.set(i, pet);
                savePets();
                return;
            }
        }
    }

    public void deletePet(String petId) {
        petsCache.removeIf(pet -> pet.getId().equals(petId));
        savePets();
    }

    private void savePets() {
        saveList(KEY_PETS, petsCache);
    }

    // ========== Device 操作 ==========

    public List<Device> getAllDevices() {
        return new ArrayList<>(devicesCache);
    }

    public Device getDeviceById(String deviceId) {
        for (Device device : devicesCache) {
            if (device.getId().equals(deviceId)) {
                return device;
            }
        }
        return null;
    }

    public void addDevice(Device device) {
        devicesCache.add(device);
        saveDevices();
    }

    public void updateDevice(Device device) {
        for (int i = 0; i < devicesCache.size(); i++) {
            if (devicesCache.get(i).getId().equals(device.getId())) {
                devicesCache.set(i, device);
                saveDevices();
                return;
            }
        }
    }

    public void deleteDevice(String deviceId) {
        devicesCache.removeIf(device -> device.getId().equals(deviceId));
        saveDevices();
    }

    private void saveDevices() {
        saveList(KEY_DEVICES, devicesCache);
    }

    // ========== HealthRecord 操作 ==========

    public List<HealthRecord> getAllHealthRecords() {
        return new ArrayList<>(healthRecordsCache);
    }

    public List<HealthRecord> getHealthRecordsByPetId(String petId) {
        List<HealthRecord> result = new ArrayList<>();
        for (HealthRecord record : healthRecordsCache) {
            if (record.getPetId().equals(petId)) {
                result.add(record);
            }
        }
        return result;
    }

    public void addHealthRecord(HealthRecord record) {
        healthRecordsCache.add(0, record); // 新记录放在最前面
        saveHealthRecords();
    }

    public void updateHealthRecord(HealthRecord record) {
        for (int i = 0; i < healthRecordsCache.size(); i++) {
            if (healthRecordsCache.get(i).getId().equals(record.getId())) {
                healthRecordsCache.set(i, record);
                saveHealthRecords();
                return;
            }
        }
    }

    public void deleteHealthRecord(String recordId) {
        healthRecordsCache.removeIf(record -> record.getId().equals(recordId));
        saveHealthRecords();
    }

    private void saveHealthRecords() {
        saveList(KEY_HEALTH_RECORDS, healthRecordsCache);
    }

    // ========== HealthMetric 操作 ==========

    public List<HealthMetric> getAllHealthMetrics() {
        return new ArrayList<>(healthMetricsCache);
    }

    public List<HealthMetric> getHealthMetricsByPetId(String petId) {
        List<HealthMetric> result = new ArrayList<>();
        for (HealthMetric metric : healthMetricsCache) {
            if (metric.getPetId().equals(petId)) {
                result.add(metric);
            }
        }
        return result;
    }

    public HealthMetric getLatestMetricByType(String petId, String type) {
        for (HealthMetric metric : healthMetricsCache) {
            if (metric.getPetId().equals(petId) && metric.getType().equals(type)) {
                return metric;
            }
        }
        return null;
    }

    public void addHealthMetric(HealthMetric metric) {
        healthMetricsCache.add(metric);
        saveHealthMetrics();
    }

    private void saveHealthMetrics() {
        saveList(KEY_HEALTH_METRICS, healthMetricsCache);
    }

    /**
     * 清除所有数据
     */
    public void clearAllData() {
        prefs.edit().clear().apply();
        petsCache.clear();
        devicesCache.clear();
        healthRecordsCache.clear();
        healthMetricsCache.clear();
        initializeDefaultData();
    }
}