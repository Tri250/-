package com.pawsync.pro.plugins;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "PawSyncFileStorage")
public class FileStoragePlugin extends Plugin {

    private static final String APP_DIR = "PawSync";

    @PluginMethod
    public void saveFile(PluginCall call) {
        byte[] data = call.getArray("data", byte[].class);
        String fileName = call.getString("fileName", "file_" + System.currentTimeMillis());
        String folder = call.getString("folder", "documents");

        if (data == null) {
            call.reject("No data provided");
            return;
        }

        try {
            String filePath = saveToExternalStorage(data, fileName, folder);
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("filePath", filePath);
            call.resolve(result);
        } catch (IOException e) {
            call.reject("Failed to save file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void loadFile(PluginCall call) {
        String filePath = call.getString("filePath");

        if (filePath == null || filePath.isEmpty()) {
            call.reject("No file path provided");
            return;
        }

        try {
            byte[] data = readFile(filePath);
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("data", data);
            call.resolve(result);
        } catch (IOException e) {
            call.reject("Failed to load file: " + e.getMessage());
        }
    }

    @PluginMethod
    public void deleteFile(PluginCall call) {
        String filePath = call.getString("filePath");

        if (filePath == null || filePath.isEmpty()) {
            call.reject("No file path provided");
            return;
        }

        File file = new File(filePath);
        boolean deleted = file.delete();

        JSObject result = new JSObject();
        result.put("success", deleted);
        call.resolve(result);
    }

    @PluginMethod
    public void listFiles(PluginCall call) {
        String folder = call.getString("folder", "documents");

        File appFolder = getAppFolder(folder);
        List<JSObject> files = new ArrayList<>();

        if (appFolder.exists() && appFolder.isDirectory()) {
            File[] fileList = appFolder.listFiles();
            if (fileList != null) {
                for (File file : fileList) {
                    JSObject fileInfo = new JSObject();
                    fileInfo.put("name", file.getName());
                    fileInfo.put("path", file.getAbsolutePath());
                    fileInfo.put("size", file.length());
                    fileInfo.put("lastModified", file.lastModified());
                    fileInfo.put("isDirectory", file.isDirectory());
                    files.add(fileInfo);
                }
            }
        }

        JSObject result = new JSObject();
        result.put("files", files);
        call.resolve(result);
    }

    @PluginMethod
    public void checkStoragePermission(PluginCall call) {
        boolean granted = false;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_IMAGES)
                    == PackageManager.PERMISSION_GRANTED &&
                    ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_VIDEO)
                            == PackageManager.PERMISSION_GRANTED &&
                    ContextCompat.checkSelfPermission(getContext(), Manifest.permission.READ_MEDIA_AUDIO)
                            == PackageManager.PERMISSION_GRANTED;
        } else {
            granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    == PackageManager.PERMISSION_GRANTED;
        }

        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void getStorageUsage(PluginCall call) {
        File externalDir = Environment.getExternalStorageDirectory();
        long totalSpace = externalDir.getTotalSpace();
        long freeSpace = externalDir.getFreeSpace();
        long usedSpace = totalSpace - freeSpace;

        JSObject result = new JSObject();
        result.put("total", totalSpace);
        result.put("used", usedSpace);
        result.put("free", freeSpace);
        result.put("percentage", Math.round((usedSpace * 100.0) / totalSpace));
        call.resolve(result);
    }

    @PluginMethod
    public void saveImage(PluginCall call) {
        byte[] data = call.getArray("data", byte[].class);
        String fileName = call.getString("fileName", "image_" + System.currentTimeMillis() + ".jpg");

        if (data == null) {
            call.reject("No image data provided");
            return;
        }

        try {
            String filePath = saveImageToGallery(data, fileName);
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("filePath", filePath);
            call.resolve(result);
        } catch (IOException e) {
            call.reject("Failed to save image: " + e.getMessage());
        }
    }

    private String saveToExternalStorage(byte[] data, String fileName, String folder) throws IOException {
        File appFolder = getAppFolder(folder);
        appFolder.mkdirs();

        File file = new File(appFolder, fileName);
        FileOutputStream fos = new FileOutputStream(file);
        fos.write(data);
        fos.close();

        return file.getAbsolutePath();
    }

    private File getAppFolder(String folder) {
        return new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOCUMENTS),
                APP_DIR + "/" + folder);
    }

    private byte[] readFile(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new IOException("File not found");
        }

        FileInputStream fis = new FileInputStream(file);
        byte[] data = new byte[(int) file.length()];
        fis.read(data);
        fis.close();

        return data;
    }

    private String saveImageToGallery(byte[] data, String fileName) throws IOException {
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
        values.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
        values.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/" + APP_DIR);

        ContentResolver resolver = getContext().getContentResolver();
        Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);

        if (uri == null) {
            throw new IOException("Failed to insert image");
        }

        OutputStream os = resolver.openOutputStream(uri);
        if (os == null) {
            throw new IOException("Failed to open output stream");
        }

        os.write(data);
        os.close();

        return uri.toString();
    }
}