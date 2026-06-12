package com.pawsync.pro.model;

/**
 * 健康指标数据模型
 */
public class HealthMetric {
    private String id;
    private String petId;
    private String type; // weight, temperature, heart_rate, respiratory_rate
    private double value;
    private String unit;
    private long timestamp;
    private String status; // normal, warning, abnormal

    public HealthMetric() {
        this.id = String.valueOf(System.currentTimeMillis());
        this.timestamp = System.currentTimeMillis();
        this.status = "normal";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPetId() { return petId; }
    public void setPetId(String petId) { this.petId = petId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public double getValue() { return value; }
    public void setValue(double value) { this.value = value; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public long getTimestamp() { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}