package com.pawsync.pro.model;

/**
 * 设备数据模型
 */
public class Device {
    private String id;
    private String name;
    private String type; // feeder, collar, water_dispenser, camera
    private String brand;
    private String model;
    private int batteryLevel;
    private boolean isOnline;
    private String status;
    private String location;
    private long lastActiveTime;
    private long createdAt;

    public Device() {
        this.id = String.valueOf(System.currentTimeMillis());
        this.createdAt = System.currentTimeMillis();
        this.isOnline = true;
        this.batteryLevel = 100;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public int getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(int batteryLevel) { this.batteryLevel = batteryLevel; }

    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean online) { this.isOnline = online; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public long getLastActiveTime() { return lastActiveTime; }
    public void setLastActiveTime(long lastActiveTime) { this.lastActiveTime = lastActiveTime; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}