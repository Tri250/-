package com.pawsync.pro.ui.dialog;

import android.app.Dialog;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;

import com.pawsync.pro.R;

/**
 * 添加记录对话框
 */
public class AddRecordDialog extends Dialog {

    private LinearLayout feedBtn, waterBtn, activityBtn, healthBtn;
    private EditText contentInput;
    private TextView saveBtn, cancelBtn;
    private String selectedType = "feed";
    private OnRecordAddedListener listener;

    public interface OnRecordAddedListener {
        void onRecordAdded(String type, String content);
    }

    public AddRecordDialog(Context context) {
        super(context);
    }

    public void setOnRecordAddedListener(OnRecordAddedListener listener) {
        this.listener = listener;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.dialog_add_record);

        feedBtn = findViewById(R.id.btn_feed);
        waterBtn = findViewById(R.id.btn_water);
        activityBtn = findViewById(R.id.btn_activity);
        healthBtn = findViewById(R.id.btn_health);
        contentInput = findViewById(R.id.input_content);
        saveBtn = findViewById(R.id.btn_save);
        cancelBtn = findViewById(R.id.btn_cancel);

        setupClickListeners();
    }

    private void setupClickListeners() {
        feedBtn.setOnClickListener(v -> selectType("feed", feedBtn));
        waterBtn.setOnClickListener(v -> selectType("water", waterBtn));
        activityBtn.setOnClickListener(v -> selectType("activity", activityBtn));
        healthBtn.setOnClickListener(v -> selectType("health", healthBtn));

        saveBtn.setOnClickListener(v -> {
            String content = contentInput.getText().toString();
            if (listener != null && !content.isEmpty()) {
                listener.onRecordAdded(selectedType, content);
                dismiss();
            }
        });

        cancelBtn.setOnClickListener(v -> dismiss());
    }

    private void selectType(String type, LinearLayout btn) {
        selectedType = type;
        // 更新选中状态
        feedBtn.setBackgroundResource(type.equals("feed") ? R.drawable.bg_action_orange : 0);
        waterBtn.setBackgroundResource(type.equals("water") ? R.drawable.bg_action_blue : 0);
        activityBtn.setBackgroundResource(type.equals("activity") ? R.drawable.bg_action_green : 0);
        healthBtn.setBackgroundResource(type.equals("health") ? R.drawable.bg_action_purple : 0);
    }
}