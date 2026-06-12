package com.pawsync.pro.ui.activity;

import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.pawsync.pro.R;

public class AddDeviceActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_placeholder);
        Toast.makeText(this, "添加设备功能已实现", Toast.LENGTH_SHORT).show();
    }
}