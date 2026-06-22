package com.pawsync.pro.plugins;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "PawSyncHealth")
public class HealthPlugin extends Plugin {

    private HealthDatabaseHelper dbHelper;

    @Override
    public void load() {
        dbHelper = new HealthDatabaseHelper(getContext());
    }

    @PluginMethod
    public void addHealthRecord(PluginCall call) {
        String petId = call.getString("petId", "1");
        String type = call.getString("type", "general");
        String tags = call.getString("tags", "[]");
        String notes = call.getString("notes", "");
        boolean isImportant = call.getBoolean("isImportant", false);

        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("pet_id", petId);
        values.put("type", type);
        values.put("tags", tags);
        values.put("notes", notes);
        values.put("is_important", isImportant ? 1 : 0);
        values.put("created_at", System.currentTimeMillis());

        long id = db.insert("health_records", null, values);
        db.close();

        JSObject result = new JSObject();
        result.put("success", id != -1);
        result.put("id", id);
        call.resolve(result);
    }

    @PluginMethod
    public void getHealthRecords(PluginCall call) {
        String petId = call.getString("petId", "1");
        int limit = call.getInt("limit", 50);

        SQLiteDatabase db = dbHelper.getReadableDatabase();
        Cursor cursor = db.query(
                "health_records",
                null,
                "pet_id = ?",
                new String[]{petId},
                null,
                null,
                "created_at DESC",
                String.valueOf(limit)
        );

        List<JSObject> records = new ArrayList<>();
        while (cursor.moveToNext()) {
            JSObject record = new JSObject();
            record.put("id", cursor.getInt(cursor.getColumnIndexOrThrow("id")));
            record.put("petId", cursor.getString(cursor.getColumnIndexOrThrow("pet_id")));
            record.put("type", cursor.getString(cursor.getColumnIndexOrThrow("type")));
            record.put("tags", cursor.getString(cursor.getColumnIndexOrThrow("tags")));
            record.put("notes", cursor.getString(cursor.getColumnIndexOrThrow("notes")));
            record.put("isImportant", cursor.getInt(cursor.getColumnIndexOrThrow("is_important")) == 1);
            record.put("createdAt", cursor.getLong(cursor.getColumnIndexOrThrow("created_at")));
            records.add(record);
        }

        cursor.close();
        db.close();

        JSObject result = new JSObject();
        result.put("records", records);
        call.resolve(result);
    }

    @PluginMethod
    public void addHealthMetric(PluginCall call) {
        String petId = call.getString("petId", "1");
        String type = call.getString("type", "weight");
        double value = call.getDouble("value", 0);
        String unit = call.getString("unit", "kg");

        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("pet_id", petId);
        values.put("type", type);
        values.put("value", value);
        values.put("unit", unit);
        values.put("recorded_at", System.currentTimeMillis());

        long id = db.insert("health_metrics", null, values);
        db.close();

        JSObject result = new JSObject();
        result.put("success", id != -1);
        result.put("id", id);
        call.resolve(result);
    }

    @PluginMethod
    public void getHealthMetrics(PluginCall call) {
        String petId = call.getString("petId", "1");
        String type = call.getString("type");
        int days = call.getInt("days", 7);

        SQLiteDatabase db = dbHelper.getReadableDatabase();

        String selection = "pet_id = ?";
        String[] selectionArgs = {petId};

        if (type != null && !type.isEmpty()) {
            selection += " AND type = ?";
            selectionArgs = new String[]{petId, type};
        }

        long cutoffTime = System.currentTimeMillis() - (days * 24L * 60 * 60 * 1000);
        selection += " AND recorded_at >= ?";
        String[] finalArgs = new String[selectionArgs.length + 1];
        System.arraycopy(selectionArgs, 0, finalArgs, 0, selectionArgs.length);
        finalArgs[selectionArgs.length] = String.valueOf(cutoffTime);

        Cursor cursor = db.query(
                "health_metrics",
                null,
                selection,
                finalArgs,
                null,
                null,
                "recorded_at ASC"
        );

        List<JSObject> metrics = new ArrayList<>();
        while (cursor.moveToNext()) {
            JSObject metric = new JSObject();
            metric.put("id", cursor.getInt(cursor.getColumnIndexOrThrow("id")));
            metric.put("petId", cursor.getString(cursor.getColumnIndexOrThrow("pet_id")));
            metric.put("type", cursor.getString(cursor.getColumnIndexOrThrow("type")));
            metric.put("value", cursor.getDouble(cursor.getColumnIndexOrThrow("value")));
            metric.put("unit", cursor.getString(cursor.getColumnIndexOrThrow("unit")));
            metric.put("recordedAt", cursor.getLong(cursor.getColumnIndexOrThrow("recorded_at")));
            metrics.add(metric);
        }

        cursor.close();
        db.close();

        JSObject result = new JSObject();
        result.put("metrics", metrics);
        call.resolve(result);
    }

    @PluginMethod
    public void addHealthAlert(PluginCall call) {
        String petId = call.getString("petId", "1");
        String type = call.getString("type", "abnormal");
        String severity = call.getString("severity", "low");
        String message = call.getString("message", "");
        String recommendation = call.getString("recommendation", "");

        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("pet_id", petId);
        values.put("type", type);
        values.put("severity", severity);
        values.put("message", message);
        values.put("recommendation", recommendation);
        values.put("acknowledged", 0);
        values.put("created_at", System.currentTimeMillis());

        long id = db.insert("health_alerts", null, values);
        db.close();

        JSObject result = new JSObject();
        result.put("success", id != -1);
        result.put("id", id);
        call.resolve(result);
    }

    @PluginMethod
    public void getHealthAlerts(PluginCall call) {
        String petId = call.getString("petId", "1");

        SQLiteDatabase db = dbHelper.getReadableDatabase();
        Cursor cursor = db.query(
                "health_alerts",
                null,
                "pet_id = ?",
                new String[]{petId},
                null,
                null,
                "created_at DESC"
        );

        List<JSObject> alerts = new ArrayList<>();
        while (cursor.moveToNext()) {
            JSObject alert = new JSObject();
            alert.put("id", cursor.getInt(cursor.getColumnIndexOrThrow("id")));
            alert.put("petId", cursor.getString(cursor.getColumnIndexOrThrow("pet_id")));
            alert.put("type", cursor.getString(cursor.getColumnIndexOrThrow("type")));
            alert.put("severity", cursor.getString(cursor.getColumnIndexOrThrow("severity")));
            alert.put("message", cursor.getString(cursor.getColumnIndexOrThrow("message")));
            alert.put("recommendation", cursor.getString(cursor.getColumnIndexOrThrow("recommendation")));
            alert.put("acknowledged", cursor.getInt(cursor.getColumnIndexOrThrow("acknowledged")) == 1);
            alert.put("createdAt", cursor.getLong(cursor.getColumnIndexOrThrow("created_at")));
            alerts.add(alert);
        }

        cursor.close();
        db.close();

        JSObject result = new JSObject();
        result.put("alerts", alerts);
        call.resolve(result);
    }

    @PluginMethod
    public void acknowledgeAlert(PluginCall call) {
        int alertId = call.getInt("alertId", 0);

        SQLiteDatabase db = dbHelper.getWritableDatabase();
        ContentValues values = new ContentValues();
        values.put("acknowledged", 1);

        int rows = db.update("health_alerts", values, "id = ?", new String[]{String.valueOf(alertId)});
        db.close();

        JSObject result = new JSObject();
        result.put("success", rows > 0);
        call.resolve(result);
    }

    @PluginMethod
    public void calculateHealthScore(PluginCall call) {
        String petId = call.getString("petId", "1");

        SQLiteDatabase db = dbHelper.getReadableDatabase();

        int activityScore = calculateActivityScore(db, petId);
        int dietScore = calculateDietScore(db, petId);
        int sleepScore = calculateSleepScore(db, petId);
        int medicalScore = calculateMedicalScore(db, petId);

        int overallScore = (activityScore * 20 + dietScore * 25 + sleepScore * 15 + medicalScore * 40) / 100;

        db.close();

        JSObject result = new JSObject();
        result.put("score", overallScore);
        result.put("activity", activityScore);
        result.put("diet", dietScore);
        result.put("sleep", sleepScore);
        result.put("medical", medicalScore);
        call.resolve(result);
    }

    private int calculateActivityScore(SQLiteDatabase db, String petId) {
        Cursor cursor = db.rawQuery(
                "SELECT COUNT(*) FROM health_records WHERE pet_id = ? AND tags LIKE '%运动%' AND created_at >= ?",
                new String[]{petId, String.valueOf(System.currentTimeMillis() - 30 * 24 * 60 * 60 * 1000L)}
        );
        cursor.moveToFirst();
        int count = cursor.getInt(0);
        cursor.close();
        return Math.min(100, 50 + count * 2);
    }

    private int calculateDietScore(SQLiteDatabase db, String petId) {
        Cursor cursor = db.rawQuery(
                "SELECT COUNT(*) FROM health_records WHERE pet_id = ? AND tags LIKE '%饮食%' AND created_at >= ?",
                new String[]{petId, String.valueOf(System.currentTimeMillis() - 30 * 24 * 60 * 60 * 1000L)}
        );
        cursor.moveToFirst();
        int count = cursor.getInt(0);
        cursor.close();
        return Math.min(100, 60 + count);
    }

    private int calculateSleepScore(SQLiteDatabase db, String petId) {
        Cursor cursor = db.rawQuery(
                "SELECT COUNT(*) FROM health_records WHERE pet_id = ? AND tags LIKE '%睡眠%' AND created_at >= ?",
                new String[]{petId, String.valueOf(System.currentTimeMillis() - 30 * 24 * 60 * 60 * 1000L)}
        );
        cursor.moveToFirst();
        int count = cursor.getInt(0);
        cursor.close();
        return Math.min(100, 60 + count);
    }

    private int calculateMedicalScore(SQLiteDatabase db, String petId) {
        Cursor vaccineCursor = db.rawQuery(
                "SELECT COUNT(*) FROM health_records WHERE pet_id = ? AND tags LIKE '%疫苗%' AND created_at >= ?",
                new String[]{petId, String.valueOf(System.currentTimeMillis() - 90 * 24 * 60 * 60 * 1000L)}
        );
        vaccineCursor.moveToFirst();
        int vaccineCount = vaccineCursor.getInt(0);
        vaccineCursor.close();

        Cursor symptomCursor = db.rawQuery(
                "SELECT COUNT(*) FROM health_records WHERE pet_id = ? AND tags LIKE '%症状%' AND created_at >= ?",
                new String[]{petId, String.valueOf(System.currentTimeMillis() - 30 * 24 * 60 * 60 * 1000L)}
        );
        symptomCursor.moveToFirst();
        int symptomCount = symptomCursor.getInt(0);
        symptomCursor.close();

        return Math.max(40, 70 + vaccineCount * 10 - symptomCount * 15);
    }

    private static class HealthDatabaseHelper extends SQLiteOpenHelper {
        private static final String DATABASE_NAME = "health.db";
        private static final int DATABASE_VERSION = 1;

        HealthDatabaseHelper(Context context) {
            super(context, DATABASE_NAME, null, DATABASE_VERSION);
        }

        @Override
        public void onCreate(SQLiteDatabase db) {
            db.execSQL("CREATE TABLE health_records (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "pet_id TEXT NOT NULL, " +
                    "type TEXT NOT NULL, " +
                    "tags TEXT, " +
                    "notes TEXT, " +
                    "is_important INTEGER DEFAULT 0, " +
                    "created_at INTEGER NOT NULL)");

            db.execSQL("CREATE TABLE health_metrics (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "pet_id TEXT NOT NULL, " +
                    "type TEXT NOT NULL, " +
                    "value REAL NOT NULL, " +
                    "unit TEXT NOT NULL, " +
                    "recorded_at INTEGER NOT NULL)");

            db.execSQL("CREATE TABLE health_alerts (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "pet_id TEXT NOT NULL, " +
                    "type TEXT NOT NULL, " +
                    "severity TEXT NOT NULL, " +
                    "message TEXT, " +
                    "recommendation TEXT, " +
                    "acknowledged INTEGER DEFAULT 0, " +
                    "created_at INTEGER NOT NULL)");

            db.execSQL("CREATE INDEX idx_records_pet_id ON health_records(pet_id)");
            db.execSQL("CREATE INDEX idx_metrics_pet_id ON health_metrics(pet_id)");
            db.execSQL("CREATE INDEX idx_alerts_pet_id ON health_alerts(pet_id)");
        }

        @Override
        public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
            db.execSQL("DROP TABLE IF EXISTS health_records");
            db.execSQL("DROP TABLE IF EXISTS health_metrics");
            db.execSQL("DROP TABLE IF EXISTS health_alerts");
            onCreate(db);
        }
    }
}