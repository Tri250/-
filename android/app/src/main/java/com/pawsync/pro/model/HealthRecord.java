package com.pawsync.pro.model;

/**
 * 健康记录数据模型
 */
public class HealthRecord {
    private String id;
    private String petId;
    private String type; // feed, water, activity, health, other
    private String title;
    private String content;
    private String timestamp;
    private String tag;
    private boolean isImportant;
    private String attachmentUrl;
    private long createdAt;

    public HealthRecord() {
        this.id = String.valueOf(System.currentTimeMillis());
        this.createdAt = System.currentTimeMillis();
        this.timestamp = String.valueOf(System.currentTimeMillis());
        this.isImportant = false;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getPetId() { return petId; }
    public void setPetId(String petId) { this.petId = petId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getTag() { return tag; }
    public void setTag(String tag) { this.tag = tag; }

    public boolean isImportant() { return isImportant; }
    public void setImportant(boolean important) { this.isImportant = important; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public long getCreatedAt() { return createdAt; }
    public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
}