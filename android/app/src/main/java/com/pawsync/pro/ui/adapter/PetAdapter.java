package com.pawsync.pro.ui.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.pawsync.pro.R;
import com.pawsync.pro.model.Pet;

import java.util.List;

/**
 * 宠物列表适配器
 */
public class PetAdapter extends RecyclerView.Adapter<PetAdapter.PetViewHolder> {

    private List<Pet> pets;
    private OnPetClickListener listener;

    public interface OnPetClickListener {
        void onPetClick(Pet pet);
        void onPetLongClick(Pet pet);
    }

    public PetAdapter(List<Pet> pets, OnPetClickListener listener) {
        this.pets = pets;
        this.listener = listener;
    }

    @NonNull
    @Override
    public PetViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_pet, parent, false);
        return new PetViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull PetViewHolder holder, int position) {
        Pet pet = pets.get(position);
        holder.bind(pet, listener);
    }

    @Override
    public int getItemCount() {
        return pets.size();
    }

    public void updateData(List<Pet> newPets) {
        this.pets = newPets;
        notifyDataSetChanged();
    }

    static class PetViewHolder extends RecyclerView.ViewHolder {
        private ImageView avatarImage;
        private TextView nameText;
        private TextView breedText;
        private TextView statusText;

        public PetViewHolder(@NonNull View itemView) {
            super(itemView);
            avatarImage = itemView.findViewById(R.id.pet_avatar);
            nameText = itemView.findViewById(R.id.pet_name);
            breedText = itemView.findViewById(R.id.pet_breed);
            statusText = itemView.findViewById(R.id.pet_status);
        }

        public void bind(Pet pet, OnPetClickListener listener) {
            nameText.setText(pet.getName());
            breedText.setText(pet.getBreed() + " · " + pet.getAge() + "岁");

            // 设置状态
            String status = pet.getHealthStatus();
            if ("excellent".equals(status)) {
                statusText.setText("活力充沛");
                statusText.setBackgroundResource(R.drawable.bg_status_excellent);
            } else if ("good".equals(status)) {
                statusText.setText("健康良好");
                statusText.setBackgroundResource(R.drawable.bg_status_good);
            } else {
                statusText.setText("需要关注");
                statusText.setBackgroundResource(R.drawable.bg_status_warning);
            }

            // 点击事件
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onPetClick(pet);
                }
            });

            itemView.setOnLongClickListener(v -> {
                if (listener != null) {
                    listener.onPetLongClick(pet);
                    return true;
                }
                return false;
            });
        }
    }
}