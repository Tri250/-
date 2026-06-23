package com.pawsync.pro;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;

import java.util.ArrayList;
import java.util.List;

public class PhotoPickerHelper {

    public static final String PICK_TYPE_IMAGE = "images";
    public static final String PICK_TYPE_VIDEO = "videos";
    public static final String PICK_TYPE_MIXED = "mixed";

    private final Context context;
    private final Activity activity;
    private ActivityResultLauncher<Intent> pickerLauncher;
    private PickerCallback callback;

    public interface PickerCallback {
        void onSuccess(List<Uri> uris);
        void onError(String message);
        void onCancelled();
    }

    public PhotoPickerHelper(Activity activity, Context context) {
        this.activity = activity;
        this.context = context;
    }

    public void setPickerLauncher(ActivityResultLauncher<Intent> launcher) {
        this.pickerLauncher = launcher;
    }

    public void pickPhotos(String type, int maxItems, PickerCallback callback) {
        this.callback = callback;

        if (maxItems < 1) {
            maxItems = 1;
        }
        if (maxItems > 100) {
            maxItems = 100;
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                launchPhotoPicker(type, maxItems);
            } else {
                launchLegacyPicker(type, maxItems);
            }
        } catch (Exception e) {
            if (callback != null) {
                callback.onError("Failed to launch photo picker: " + e.getMessage());
            }
        }
    }

    private void launchPhotoPicker(String type, int maxItems) {
        Intent intent = new Intent(MediaStore.ACTION_PICK_IMAGES);

        if (PICK_TYPE_IMAGE.equals(type)) {
            intent.setType("image/*");
        } else if (PICK_TYPE_VIDEO.equals(type)) {
            intent.setType("video/*");
        } else {
            intent.setType("*/*");
            String[] mimeTypes = {"image/*", "video/*"};
            intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        }

        if (maxItems > 1) {
            intent.putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, maxItems);
        }

        if (pickerLauncher != null) {
            pickerLauncher.launch(intent);
        } else {
            if (callback != null) {
                callback.onError("Picker launcher not initialized");
            }
        }
    }

    private void launchLegacyPicker(String type, int maxItems) {
        Intent intent = new Intent(Intent.ACTION_PICK);

        if (PICK_TYPE_IMAGE.equals(type)) {
            intent.setType("image/*");
        } else if (PICK_TYPE_VIDEO.equals(type)) {
            intent.setType("video/*");
        } else {
            intent.setType("image/*,video/*");
        }

        if (maxItems > 1) {
            intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        }

        Intent chooser = Intent.createChooser(intent, "Select media");

        if (pickerLauncher != null) {
            pickerLauncher.launch(chooser);
        } else {
            if (callback != null) {
                callback.onError("Picker launcher not initialized");
            }
        }
    }

    public void handleActivityResult(int resultCode, Intent data) {
        if (callback == null) {
            return;
        }

        if (resultCode != Activity.RESULT_OK) {
            callback.onCancelled();
            return;
        }

        List<Uri> uris = new ArrayList<>();

        try {
            if (data != null) {
                if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    for (int i = 0; i < count; i++) {
                        Uri uri = data.getClipData().getItemAt(i).getUri();
                        if (uri != null) {
                            uris.add(uri);
                        }
                    }
                } else if (data.getData() != null) {
                    uris.add(data.getData());
                }
            }

            if (uris.isEmpty()) {
                callback.onCancelled();
            } else {
                callback.onSuccess(uris);
            }
        } catch (Exception e) {
            callback.onError("Error processing result: " + e.getMessage());
        }
    }

    public static JSArray buildResultJSArray(List<Uri> uris, Context context) {
        JSArray result = new JSArray();

        for (Uri uri : uris) {
            JSObject item = new JSObject();
            item.put("uri", uri.toString());
            item.put("mimeType", getMimeType(context, uri));
            item.put("path", uri.getPath());
            result.put(item);
        }

        return result;
    }

    private static String getMimeType(Context context, Uri uri) {
        try {
            return context.getContentResolver().getType(uri);
        } catch (Exception e) {
            return null;
        }
    }

    public static boolean isPhotoPickerAvailable() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE;
    }
}
