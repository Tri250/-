package com.pawsync.pro.plugins;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.ImageFormat;
import android.graphics.SurfaceTexture;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCaptureSession;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraDevice;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CaptureRequest;
import android.hardware.camera2.params.StreamConfigurationMap;
import android.media.Image;
import android.media.ImageReader;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Size;
import android.view.Surface;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;
import org.json.JSONObject;

import java.nio.ByteBuffer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@CapacitorPlugin(name = "PawSyncCamera")
public class CameraPlugin extends Plugin {

    private CameraManager cameraManager;
    private CameraDevice cameraDevice;
    private CameraCaptureSession captureSession;
    private ImageReader imageReader;
    private HandlerThread backgroundThread;
    private Handler backgroundHandler;
    private String currentCameraId;
    private boolean isRecording = false;
    private OnImageAvailableListener imageListener;

    public interface OnImageAvailableListener {
        void onImageAvailable(byte[] imageData, int width, int height);
    }

    @Override
    public void load() {
        cameraManager = (CameraManager) getContext().getSystemService(Context.CAMERA_SERVICE);
        startBackgroundThread();
    }

    @PluginMethod
    public void getAvailableCameras(PluginCall call) {
        try {
            String[] cameraIds = cameraManager.getCameraIdList();
            JSObject result = new JSObject();
            List<JSObject> cameras = new ArrayList<>();

            for (String id : cameraIds) {
                CameraCharacteristics characteristics = cameraManager.getCameraCharacteristics(id);
                Integer facing = characteristics.get(CameraCharacteristics.LENS_FACING);
                
                JSObject camera = new JSObject();
                camera.put("id", id);
                camera.put("facing", facing == CameraCharacteristics.LENS_FACING_FRONT ? "front" : "back");
                
                StreamConfigurationMap configMap = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP);
                if (configMap != null) {
                    Size[] sizes = configMap.getOutputSizes(ImageFormat.JPEG);
                    if (sizes.length > 0) {
                        Size largest = Collections.max(Arrays.asList(sizes),
                                Comparator.comparingInt(s -> s.getWidth() * s.getHeight()));
                        camera.put("maxWidth", largest.getWidth());
                        camera.put("maxHeight", largest.getHeight());
                    }
                }
                
                cameras.add(camera);
            }
            
            result.put("cameras", cameras);
            call.resolve(result);
        } catch (CameraAccessException e) {
            call.reject("Failed to get cameras: " + e.getMessage());
        }
    }

    @PluginMethod
    public void openCamera(PluginCall call) {
        String cameraId = call.getString("cameraId", "0");
        
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA)
                != PackageManager.PERMISSION_GRANTED) {
            call.reject("Camera permission not granted");
            return;
        }

        currentCameraId = cameraId;
        
        try {
            cameraManager.openCamera(cameraId, new CameraDevice.StateCallback() {
                @Override
                public void onOpened(@NonNull CameraDevice camera) {
                    cameraDevice = camera;
                    call.resolve();
                }

                @Override
                public void onDisconnected(@NonNull CameraDevice camera) {
                    camera.close();
                    cameraDevice = null;
                }

                @Override
                public void onError(@NonNull CameraDevice camera, int error) {
                    camera.close();
                    cameraDevice = null;
                    call.reject("Camera open failed with error: " + error);
                }
            }, backgroundHandler);
        } catch (CameraAccessException e) {
            call.reject("Camera access error: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startPreview(PluginCall call) {
        if (cameraDevice == null) {
            call.reject("Camera not opened");
            return;
        }

        int width = call.getInt("width", 1920);
        int height = call.getInt("height", 1080);

        try {
            imageReader = ImageReader.newInstance(width, height, ImageFormat.JPEG, 2);
            imageReader.setOnImageAvailableListener(reader -> {
                Image image = reader.acquireLatestImage();
                if (image != null) {
                    Image.Plane[] planes = image.getPlanes();
                    ByteBuffer buffer = planes[0].getBuffer();
                    byte[] data = new byte[buffer.remaining()];
                    buffer.get(data);
                    
                    if (imageListener != null) {
                        imageListener.onImageAvailable(data, width, height);
                    }
                    
                    image.close();
                }
            }, backgroundHandler);

            List<Surface> surfaces = new ArrayList<>();
            surfaces.add(imageReader.getSurface());

            cameraDevice.createCaptureSession(surfaces, new CameraCaptureSession.StateCallback() {
                @Override
                public void onConfigured(@NonNull CameraCaptureSession session) {
                    captureSession = session;
                    try {
                        CaptureRequest.Builder requestBuilder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW);
                        requestBuilder.addTarget(imageReader.getSurface());
                        captureSession.setRepeatingRequest(requestBuilder.build(), null, backgroundHandler);
                        call.resolve();
                    } catch (CameraAccessException e) {
                        call.reject("Failed to start preview: " + e.getMessage());
                    }
                }

                @Override
                public void onConfigureFailed(@NonNull CameraCaptureSession session) {
                    call.reject("Capture session configuration failed");
                }
            }, backgroundHandler);
        } catch (CameraAccessException e) {
            call.reject("Failed to create capture session: " + e.getMessage());
        }
    }

    @PluginMethod
    public void takePhoto(PluginCall call) {
        if (cameraDevice == null || captureSession == null) {
            call.reject("Camera not ready");
            return;
        }

        int width = call.getInt("width", 1920);
        int height = call.getInt("height", 1080);

        try {
            ImageReader reader = ImageReader.newInstance(width, height, ImageFormat.JPEG, 1);
            reader.setOnImageAvailableListener(reader1 -> {
                Image image = reader1.acquireLatestImage();
                if (image != null) {
                    Image.Plane[] planes = image.getPlanes();
                    ByteBuffer buffer = planes[0].getBuffer();
                    byte[] data = new byte[buffer.remaining()];
                    buffer.get(data);
                    
                    JSObject result = new JSObject();
                    result.put("imageData", data);
                    result.put("width", width);
                    result.put("height", height);
                    result.put("format", "jpeg");
                    
                    call.resolve(result);
                    image.close();
                    reader1.close();
                }
            }, backgroundHandler);

            List<Surface> surfaces = new ArrayList<>();
            surfaces.add(reader.getSurface());

            cameraDevice.createCaptureSession(surfaces, new CameraCaptureSession.StateCallback() {
                @Override
                public void onConfigured(@NonNull CameraCaptureSession session) {
                    try {
                        CaptureRequest.Builder requestBuilder = cameraDevice.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE);
                        requestBuilder.addTarget(reader.getSurface());
                        session.capture(requestBuilder.build(), new CameraCaptureSession.CaptureCallback() {
                            @Override
                            public void onCaptureCompleted(@NonNull CameraCaptureSession session,
                                                           @NonNull CaptureRequest request,
                                                           @NonNull android.hardware.camera2.CaptureResult result) {
                                session.close();
                            }
                        }, backgroundHandler);
                    } catch (CameraAccessException e) {
                        call.reject("Failed to capture photo: " + e.getMessage());
                    }
                }

                @Override
                public void onConfigureFailed(@NonNull CameraCaptureSession session) {
                    call.reject("Photo capture session failed");
                }
            }, backgroundHandler);
        } catch (CameraAccessException e) {
            call.reject("Failed to create photo session: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopPreview(PluginCall call) {
        if (captureSession != null) {
            captureSession.stopRepeating();
            captureSession.close();
            captureSession = null;
        }
        if (imageReader != null) {
            imageReader.close();
            imageReader = null;
        }
        call.resolve();
    }

    @PluginMethod
    public void closeCamera(PluginCall call) {
        stopPreview(call);
        if (cameraDevice != null) {
            cameraDevice.close();
            cameraDevice = null;
        }
        call.resolve();
    }

    @PluginMethod
    public void checkCameraPermission(PluginCall call) {
        boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.CAMERA)
                == PackageManager.PERMISSION_GRANTED;
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    private void startBackgroundThread() {
        backgroundThread = new HandlerThread("CameraBackground");
        backgroundThread.start();
        backgroundHandler = new Handler(backgroundThread.getLooper());
    }

    private void stopBackgroundThread() {
        backgroundThread.quitSafely();
        try {
            backgroundThread.join();
            backgroundThread = null;
            backgroundHandler = null;
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void handleOnDestroy() {
        closeCamera(null);
        stopBackgroundThread();
    }
}