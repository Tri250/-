package com.pawsync.pro.model;

/**
 * 宠物数据模型
 */
public class Pet {
    private String id;
    private String name;
    private String breed;
    private String type; // cat, dog, rabbit, etc.
    private String gender; // male, female
    private String birthday;
    private double weight;
    private String color;
    private String avatarUrl;
    private String healthStatus; // excellent, good, fair, poor
    private String characteristics;
    private long createdAt;
    private long updatedAt;

    public Pet() {
        this.id = String.valueOf(System.currentTimeMillis());
        this.createdAt = System.currentTimeMillis();
        this.updatedAt = System.currentTimeMillis();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBreed() { return breed; }
    public void setBreed(String breed) { this.breed = breed; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBirthday() { return birthday; }
    public void setBirthday(String birthday) { this.birthday = birthday; }

    public double getWeight() { return weight; }
    public void setWeight(double weight) { this.weight = weight; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getHealthStatus() { return healthStatus; }
    public void setHealthStatus(String healthStatus) { this.healthStatus = healthStatus; }

    public String getCharacteristics() { return characteristics; }
    public void setCharacteristics(String characteristics) { this.characteristics = characteristics; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }

    public long getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(long updatedAt) { this.updatedAt = updatedAt; }

    /**
     * 计算年龄
     */
    public int getAge() {
        if (birthday == null || birthday.isEmpty()) return 0;
        try {
            long birthTime = Long.parseLong(birthday);
            return (int) ((System.currentTimeMillis() - birthTime) / (365L * 24 * 60 * 60 * 1000));
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}