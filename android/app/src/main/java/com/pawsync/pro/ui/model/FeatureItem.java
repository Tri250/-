package com.pawsync.pro.ui.model;

import androidx.annotation.ColorRes;
import androidx.annotation.DrawableRes;
import androidx.annotation.StringRes;

/**
 * 功能项数据模型
 */
public class FeatureItem {
    
    @DrawableRes
    private final int iconRes;
    
    @StringRes
    private final int titleRes;
    
    @ColorRes
    private final int colorRes;
    
    private final String id;

    public FeatureItem(@DrawableRes int iconRes, @StringRes int titleRes, @ColorRes int colorRes, String id) {
        this.iconRes = iconRes;
        this.titleRes = titleRes;
        this.colorRes = colorRes;
        this.id = id;
    }

    @DrawableRes
    public int getIconRes() {
        return iconRes;
    }

    @StringRes
    public int getTitleRes() {
        return titleRes;
    }

    @ColorRes
    public int getColorRes() {
        return colorRes;
    }

    public String getId() {
        return id;
    }
}