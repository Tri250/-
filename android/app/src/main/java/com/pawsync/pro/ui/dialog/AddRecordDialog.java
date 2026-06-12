package com.pawsync.pro.ui.dialog;

import android.app.Dialog;
import android.content.Context;
import android.view.View;
import android.view.Window;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.pawsync.pro.R;
import com.pawsync.pro.data.DataRepository;
import com.pawsync.pro.model.HealthRecord;

public class AddRecordDialog extends Dialog {

    private LinearLayout btnFeed, btnWater, btnActivity, btnHealth;
    private EditText contentEdit;
    private TextView btnCancel, btnSave;
    private DataRepository dataRepository;
    private String selectedType = "other";

    public AddRecordDialog(Context context) {
        super(context);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        setContentView(R.layout.dialog_add_record);

        dataRepository = DataRepository.getInstance(context);

        btnFeed = findViewById(R.id.btn_feed);
        btnWater = findViewById(R.id.btn_water);
        btnActivity = findViewById(R.id.btn_activity);
        btnHealth = findViewById(R.id.btn_health);
        contentEdit = findViewById(R.id.input_content);
        btnCancel = findViewById(R.id.btn_cancel);
        btnSave = findViewById(R.id.btn_save);

        btnFeed.setOnClickListener(v -> selectType("feed"));
        btnWater.setOnClickListener(v -> selectType("water"));
        btnActivity.setOnClickListener(v -> selectType("activity"));
        btnHealth.setOnClickListener(v -> selectType("health"));

        btnCancel.setOnClickListener(v -> dismiss());
        btnSave.setOnClickListener(v -> saveRecord());
    }

    private void selectType(String type) {
        selectedType = type;
        // 更新选中状态视觉效果
        btnFeed.setBackgroundResource(type.equals("feed") ? R.drawable.bg_action_orange : 0);
        btnWater.setBackgroundResource(type.equals("water") ? R.drawable.bg_action_blue : 0);
        btnActivity.setBackgroundResource(type.equals("activity") ? R.drawable.bg_action_green : 0);
        btnHealth.setBackgroundResource(type.equals("health") ? R.drawable.bg_action_purple : 0);
    }

    private void saveRecord() {
        String content = contentEdit.getText().toString().trim();

        if (content.isEmpty()) {
            Toast.makeText(getContext(), "请输入记录内容", Toast.LENGTH_SHORT).show();
            return;
        }

        HealthRecord record = new HealthRecord();
        record.setType(selectedType);
        record.setTitle(getTitleByType(selectedType));
        record.setContent(content);
        record.setTimestamp(String.valueOf(System.currentTimeMillis()));
        record.setTag("用户记录");

        dataRepository.addHealthRecord(record);

        Toast.makeText(getContext(), "记录已保存", Toast.LENGTH_SHORT).show();
        dismiss();
    }

    private String getTitleByType(String type) {
        switch (type) {
            case "feed": return "喂食记录";
            case "water": return "饮水记录";
            case "activity": return "活动记录";
            case "health": return "健康记录";
            default: return "其他记录";
        }
    }
}