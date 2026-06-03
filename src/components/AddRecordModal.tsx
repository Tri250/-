import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { usePetStore } from '../../store/petStore';
import { useRecordStore } from '../../store/recordStore';
import { RecordType } from '../../types/health-record';
import { VoiceTranscription } from '../common/VoiceTranscription';
import { PDFUpload } from '../common/PDFUpload';

interface AddRecordModalProps {
  visible: boolean;
  onClose: () => void;
  petId?: string;
  initialType?: RecordType;
  voiceTranscription?: boolean;
  pdfFileName?: string;
}

export const AddRecordModal: React.FC<AddRecordModalProps> = ({
  visible,
  onClose,
  petId,
  initialType = 'checkup',
  voiceTranscription = false,
  pdfFileName,
}) => {
  const [recordType, setRecordType] = useState<RecordType>(initialType);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [selectedPetId, setSelectedPetId] = useState(petId || '');
  const [notes, setNotes] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [showVoiceTranscription, setShowVoiceTranscription] = useState(voiceTranscription);
  const [voiceText, setVoiceText] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(pdfFileName || null);

  const { user } = useAuthStore();
  const { pets } = usePetStore();
  const { addRecord } = useRecordStore();

  const recordTypes: { value: RecordType; label: string }[] = [
    { value: 'checkup', label: '体检' },
    { value: 'vaccination', label: '疫苗接种' },
    { value: 'medication', label: '用药' },
    { value: 'surgery', label: '手术' },
    { value: 'lab', label: '化验检查' },
    { value: 'weight', label: '体重记录' },
    { value: 'dental', label: '牙齿护理' },
    { value: 'grooming', label: '美容' },
    { value: 'emergency', label: '紧急情况' },
    { value: 'pdf', label: 'PDF文档' },
  ];

  const handleSubmit = async () => {
    if (!selectedPetId) {
      alert('请选择宠物');
      return;
    }
    if (!title.trim()) {
      alert('请输入记录标题');
      return;
    }

    const record = {
      id: `record-${Date.now()}`,
      petId: selectedPetId,
      type: recordType,
      title: title.trim(),
      description: description.trim(),
      date: date.toISOString(),
      notes: notes.trim(),
      attachedFile,
      voiceTranscription: showVoiceTranscription ? voiceText : undefined,
      pdfUrl: pdfUrl || undefined,
      createdBy: user?.id || 'anonymous',
      createdAt: new Date().toISOString(),
    };

    await addRecord(record);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setRecordType('checkup');
    setTitle('');
    setDescription('');
    setDate(new Date());
    setNotes('');
    setAttachedFile(null);
    setVoiceText('');
    setPdfUrl(null);
    setShowVoiceTranscription(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>添加健康记录</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>宠物</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    onPress={() => setSelectedPetId(pet.id)}
                    style={[
                      styles.petChip,
                      selectedPetId === pet.id && styles.petChipSelected,
                    ]}
                  >
                    <Text style={[
                      styles.petChipText,
                      selectedPetId === pet.id && styles.petChipTextSelected,
                    ]}>
                      {pet.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>记录类型</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recordTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setRecordType(type.value)}
                    style={[
                      styles.typeChip,
                      recordType === type.value && styles.typeChipSelected,
                    ]}
                  >
                    <Text style={[
                      styles.typeChipText,
                      recordType === type.value && styles.typeChipTextSelected,
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>标题</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="输入记录标题"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>描述</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="输入详细描述"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>备注</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="输入额外备注"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            {recordType === 'pdf' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>上传PDF文档</Text>
                <PDFUpload onUpload={(url) => setPdfUrl(url)} />
                {pdfUrl && <Text style={styles.uploadedText}>已上传: {pdfUrl}</Text>}
              </View>
            )}

            {showVoiceTranscription && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>语音转文字</Text>
                <VoiceTranscription
                  onTranscription={(text) => setVoiceText(text)}
                  initialText={voiceText}
                />
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>保存记录</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#999',
  },
  form: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  petChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  petChipSelected: {
    backgroundColor: '#F97316',
  },
  petChipText: {
    fontSize: 14,
    color: '#666',
  },
  petChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  typeChipSelected: {
    backgroundColor: '#10B981',
  },
  typeChipText: {
    fontSize: 14,
    color: '#666',
  },
  typeChipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadedText: {
    marginTop: 8,
    color: '#10B981',
    fontSize: 14,
  },
});
