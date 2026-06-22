package com.pawsync.pro.plugins;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Environment;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "PawSyncAudio")
public class AudioPlugin extends Plugin {

    private static final int SAMPLE_RATE = 44100;
    private static final int CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO;
    private static final int AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT;

    private AudioRecord audioRecord;
    private boolean isRecording = false;
    private Thread recordingThread;
    private FileOutputStream outputStream;
    private List<Float> audioDataBuffer = new ArrayList<>();
    private OnAudioDataListener audioDataListener;

    public interface OnAudioDataListener {
        void onAudioData(float[] data);
    }

    @PluginMethod
    public void checkMicrophonePermission(PluginCall call) {
        boolean granted = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
        JSObject result = new JSObject();
        result.put("granted", granted);
        call.resolve(result);
    }

    @PluginMethod
    public void startRecording(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED) {
            call.reject("Microphone permission not granted");
            return;
        }

        String fileName = call.getString("fileName", "recording_" + System.currentTimeMillis() + ".wav");
        String filePath = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
                + "/PawSync/" + fileName;

        File file = new File(filePath);
        file.getParentFile().mkdirs();

        try {
            outputStream = new FileOutputStream(file);
            writeWavHeader(outputStream, SAMPLE_RATE, 1, 16);
        } catch (IOException e) {
            call.reject("Failed to create output file: " + e.getMessage());
            return;
        }

        int bufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT);
        audioRecord = new AudioRecord(
                MediaRecorder.AudioSource.MIC,
                SAMPLE_RATE,
                CHANNEL_CONFIG,
                AUDIO_FORMAT,
                bufferSize * 2
        );

        audioDataBuffer.clear();
        isRecording = true;

        recordingThread = new Thread(() -> {
            byte[] buffer = new byte[bufferSize];
            audioRecord.startRecording();

            while (isRecording) {
                int bytesRead = audioRecord.read(buffer, 0, buffer.length);
                if (bytesRead > 0) {
                    try {
                        outputStream.write(buffer, 0, bytesRead);
                    } catch (IOException e) {
                        e.printStackTrace();
                    }

                    float[] floatData = convertToFloat(buffer, bytesRead);
                    audioDataBuffer.addAll(convertArrayToList(floatData));

                    if (audioDataListener != null) {
                        audioDataListener.onAudioData(floatData);
                    }
                }
            }

            audioRecord.stop();
            audioRecord.release();
            audioRecord = null;

            try {
                if (outputStream != null) {
                    updateWavHeader(outputStream);
                    outputStream.close();
                    outputStream = null;
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        });

        recordingThread.start();
        call.resolve();
    }

    @PluginMethod
    public void stopRecording(PluginCall call) {
        isRecording = false;
        if (recordingThread != null) {
            try {
                recordingThread.join();
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            recordingThread = null;
        }

        JSObject result = new JSObject();
        result.put("success", true);
        call.resolve(result);
    }

    @PluginMethod
    public void getAudioLevel(PluginCall call) {
        if (audioRecord == null || !isRecording) {
            call.reject("Not recording");
            return;
        }

        int bufferSize = 2048;
        short[] buffer = new short[bufferSize];
        int bytesRead = audioRecord.read(buffer, 0, bufferSize);

        double sum = 0;
        for (int i = 0; i < bytesRead; i++) {
            sum += buffer[i] * buffer[i];
        }

        double rms = Math.sqrt(sum / bytesRead);
        double db = 20 * Math.log10(rms / Short.MAX_VALUE);
        db = Math.max(db, -100);

        JSObject result = new JSObject();
        result.put("rms", rms);
        result.put("db", db);
        result.put("level", Math.max(0, (int) ((db + 100) / 100 * 100)));

        call.resolve(result);
    }

    @PluginMethod
    public void getAudioData(PluginCall call) {
        int sampleCount = call.getInt("sampleCount", 1024);

        if (audioDataBuffer.size() < sampleCount) {
            call.reject("Not enough audio data");
            return;
        }

        float[] data = new float[sampleCount];
        for (int i = 0; i < sampleCount; i++) {
            data[i] = audioDataBuffer.get(i);
        }

        audioDataBuffer.clear();

        JSObject result = new JSObject();
        result.put("data", data);
        result.put("sampleRate", SAMPLE_RATE);

        call.resolve(result);
    }

    @PluginMethod
    public void analyzeAudio(PluginCall call) {
        if (audioDataBuffer.isEmpty()) {
            call.reject("No audio data available");
            return;
        }

        float[] data = new float[audioDataBuffer.size()];
        for (int i = 0; i < audioDataBuffer.size(); i++) {
            data[i] = audioDataBuffer.get(i);
        }

        double rms = calculateRMS(data);
        double db = 20 * Math.log10(rms / Short.MAX_VALUE);
        double pitch = estimatePitch(data, SAMPLE_RATE);
        double spectralCentroid = calculateSpectralCentroid(data, SAMPLE_RATE);
        double zeroCrossingRate = calculateZeroCrossingRate(data);

        JSObject result = new JSObject();
        result.put("rms", rms);
        result.put("db", db);
        result.put("pitch", pitch);
        result.put("spectralCentroid", spectralCentroid);
        result.put("zeroCrossingRate", zeroCrossingRate);
        result.put("duration", data.length / (double) SAMPLE_RATE);

        call.resolve(result);
    }

    private float[] convertToFloat(byte[] bytes, int length) {
        float[] floatArray = new float[length / 2];
        ByteBuffer.wrap(bytes, 0, length)
                .order(ByteOrder.LITTLE_ENDIAN)
                .asShortBuffer()
                .get(new short[floatArray.length]);

        for (int i = 0; i < floatArray.length && i * 2 < length; i++) {
            short sample = (short) ((bytes[i * 2] & 0xFF) | (bytes[i * 2 + 1] << 8));
            floatArray[i] = sample / (float) Short.MAX_VALUE;
        }
        return floatArray;
    }

    private List<Float> convertArrayToList(float[] array) {
        List<Float> list = new ArrayList<>();
        for (float f : array) {
            list.add(f);
        }
        return list;
    }

    private void writeWavHeader(FileOutputStream out, int sampleRate, int channels, int bitsPerSample) throws IOException {
        int blockAlign = channels * (bitsPerSample / 8);
        int byteRate = sampleRate * blockAlign;

        out.write(new byte[]{'R', 'I', 'F', 'F'});
        out.write(intToBytes(0));
        out.write(new byte[]{'W', 'A', 'V', 'E'});
        out.write(new byte[]{'f', 'm', 't', ' '});
        out.write(intToBytes(16));
        out.write(shortToBytes((short) 1));
        out.write(shortToBytes((short) channels));
        out.write(intToBytes(sampleRate));
        out.write(intToBytes(byteRate));
        out.write(shortToBytes((short) blockAlign));
        out.write(shortToBytes((short) bitsPerSample));
        out.write(new byte[]{'d', 'a', 't', 'a'});
        out.write(intToBytes(0));
    }

    private void updateWavHeader(FileOutputStream out) throws IOException {
        long fileSize = out.getChannel().size();
        out.getChannel().position(4);
        out.write(intToBytes((int) (fileSize - 8)));
        out.getChannel().position(40);
        out.write(intToBytes((int) (fileSize - 44)));
    }

    private byte[] intToBytes(int value) {
        return ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(value).array();
    }

    private byte[] shortToBytes(short value) {
        return ByteBuffer.allocate(2).order(ByteOrder.LITTLE_ENDIAN).putShort(value).array();
    }

    private double calculateRMS(float[] data) {
        double sum = 0;
        for (float sample : data) {
            sum += sample * sample;
        }
        return Math.sqrt(sum / data.length);
    }

    private double estimatePitch(float[] data, int sampleRate) {
        int maxLag = Math.min(data.length / 2, sampleRate / 50);
        int minLag = sampleRate / 4000;

        double maxCorrelation = 0;
        int bestLag = minLag;

        for (int lag = minLag; lag < maxLag; lag++) {
            double correlation = 0;
            for (int i = 0; i < data.length - lag; i++) {
                correlation += data[i] * data[i + lag];
            }
            if (correlation > maxCorrelation) {
                maxCorrelation = correlation;
                bestLag = lag;
            }
        }

        if (maxCorrelation < 0.3) return 0;
        return sampleRate / (double) bestLag;
    }

    private double calculateSpectralCentroid(float[] data, int sampleRate) {
        int n = data.length;
        double[] spectrum = new double[n / 2];

        for (int k = 0; k < n / 2; k++) {
            double real = 0, imag = 0;
            for (int t = 0; t < n; t++) {
                double angle = 2 * Math.PI * k * t / n;
                real += data[t] * Math.cos(angle);
                imag -= data[t] * Math.sin(angle);
            }
            spectrum[k] = Math.sqrt(real * real + imag * imag);
        }

        double weightedSum = 0;
        double totalSum = 0;

        for (int k = 0; k < n / 2; k++) {
            double freq = k * sampleRate / (double) n;
            weightedSum += freq * spectrum[k];
            totalSum += spectrum[k];
        }

        return totalSum > 0 ? weightedSum / totalSum : 0;
    }

    private double calculateZeroCrossingRate(float[] data) {
        int crossings = 0;
        for (int i = 1; i < data.length; i++) {
            if (data[i - 1] * data[i] < 0) {
                crossings++;
            }
        }
        return crossings / (double) data.length;
    }
}