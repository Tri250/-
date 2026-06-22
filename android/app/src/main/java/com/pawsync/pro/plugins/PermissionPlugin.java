package com.pawsync.pro.plugins;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "PawSyncPermission")
public class PermissionPlugin extends Plugin {

    private static final int REQUEST_CODE = 1001;

    @PluginMethod
    public void checkPermission(PluginCall call) {
        String permission = call.getString("permission");

        if (permission == null || permission.isEmpty()) {
            call.reject("No permission specified");
            return;
        }

        String androidPermission = mapPermission(permission);
        if (androidPermission == null) {
            call.reject("Unknown permission: " + permission);
            return;
        }

        int result = ContextCompat.checkSelfPermission(getContext(), androidPermission);
        boolean granted = result == PackageManager.PERMISSION_GRANTED;

        JSObject resultObj = new JSObject();
        resultObj.put("granted", granted);
        resultObj.put("permission", permission);
        call.resolve(resultObj);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        String permission = call.getString("permission");

        if (permission == null || permission.isEmpty()) {
            call.reject("No permission specified");
            return;
        }

        String androidPermission = mapPermission(permission);
        if (androidPermission == null) {
            call.reject("Unknown permission: " + permission);
            return;
        }

        if (ContextCompat.checkSelfPermission(getContext(), androidPermission) == PackageManager.PERMISSION_GRANTED) {
            JSObject resultObj = new JSObject();
            resultObj.put("granted", true);
            resultObj.put("permission", permission);
            call.resolve(resultObj);
            return;
        }

        call.save();
        ActivityCompat.requestPermissions(
                getActivity(),
                new String[]{androidPermission},
                REQUEST_CODE
        );
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        String[] permissions = call.getArray("permissions", String[].class);

        if (permissions == null || permissions.length == 0) {
            call.reject("No permissions specified");
            return;
        }

        List<String> androidPermissions = new ArrayList<>();
        List<String> permissionNames = new ArrayList<>();

        for (String permission : permissions) {
            String androidPermission = mapPermission(permission);
            if (androidPermission != null) {
                androidPermissions.add(androidPermission);
                permissionNames.add(permission);
            }
        }

        if (androidPermissions.isEmpty()) {
            call.reject("No valid permissions specified");
            return;
        }

        List<String> neededPermissions = new ArrayList<>();
        for (int i = 0; i < androidPermissions.size(); i++) {
            if (ContextCompat.checkSelfPermission(getContext(), androidPermissions.get(i))
                    != PackageManager.PERMISSION_GRANTED) {
                neededPermissions.add(androidPermissions.get(i));
            }
        }

        if (neededPermissions.isEmpty()) {
            JSObject resultObj = new JSObject();
            resultObj.put("granted", true);
            resultObj.put("results", new JSObject());
            call.resolve(resultObj);
            return;
        }

        call.save();
        ActivityCompat.requestPermissions(
                getActivity(),
                neededPermissions.toArray(new String[0]),
                REQUEST_CODE
        );
    }

    @PluginMethod
    public void checkAllPermissions(PluginCall call) {
        JSObject results = new JSObject();

        String[][] permissionMap = {
                {"camera", Manifest.permission.CAMERA},
                {"microphone", Manifest.permission.RECORD_AUDIO},
                {"storage", Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                        ? Manifest.permission.READ_MEDIA_IMAGES : Manifest.permission.WRITE_EXTERNAL_STORAGE},
                {"notification", "android.permission.POST_NOTIFICATIONS"},
                {"location", Manifest.permission.ACCESS_FINE_LOCATION}
        };

        for (String[] mapping : permissionMap) {
            String name = mapping[0];
            String androidPermission = mapping[1];

            if ("android.permission.POST_NOTIFICATIONS".equals(androidPermission) &&
                    Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) {
                results.put(name, true);
                continue;
            }

            boolean granted = ContextCompat.checkSelfPermission(getContext(), androidPermission)
                    == PackageManager.PERMISSION_GRANTED;
            results.put(name, granted);
        }

        JSObject resultObj = new JSObject();
        resultObj.put("results", results);
        call.resolve(resultObj);
    }

    @PluginMethod
    public void shouldShowRequestPermissionRationale(PluginCall call) {
        String permission = call.getString("permission");

        if (permission == null || permission.isEmpty()) {
            call.reject("No permission specified");
            return;
        }

        String androidPermission = mapPermission(permission);
        if (androidPermission == null) {
            call.reject("Unknown permission: " + permission);
            return;
        }

        boolean shouldShow = ActivityCompat.shouldShowRequestPermissionRationale(
                getActivity(),
                androidPermission
        );

        JSObject resultObj = new JSObject();
        resultObj.put("shouldShow", shouldShow);
        resultObj.put("permission", permission);
        call.resolve(resultObj);
    }

    private String mapPermission(String permission) {
        return switch (permission.toLowerCase()) {
            case "camera" -> Manifest.permission.CAMERA;
            case "microphone", "audio", "record" -> Manifest.permission.RECORD_AUDIO;
            case "storage", "write", "read" -> Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                    ? Manifest.permission.READ_MEDIA_IMAGES
                    : Manifest.permission.WRITE_EXTERNAL_STORAGE;
            case "notification", "notifications", "push" -> Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                    ? "android.permission.POST_NOTIFICATIONS"
                    : null;
            case "location", "gps" -> Manifest.permission.ACCESS_FINE_LOCATION;
            case "contacts" -> Manifest.permission.READ_CONTACTS;
            case "phone" -> Manifest.permission.CALL_PHONE;
            case "sms" -> Manifest.permission.SEND_SMS;
            default -> null;
        };
    }
}