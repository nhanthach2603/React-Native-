// components/CustomPicker.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, styles } from '../styles/homeStyle';

export const CustomPicker: React.FC<any> = ({ iconName, items, selectedValue, onValueChange, placeholder, enabled }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedLabel = items.find((item: any) => item.value === selectedValue)?.label || placeholder;

  const handleSelect = (value: string | null) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <>
      <View style={[styles.staffStyles.modalInputGroup, !enabled && { backgroundColor: '#E5E7EB' }]}>
        <Ionicons name={iconName} size={20} color={COLORS.text_secondary} style={styles.staffStyles.modalInputIcon} />
        <TouchableOpacity style={styles.staffStyles.pickerTouchable} onPress={() => enabled && setModalVisible(true)} disabled={!enabled}>
          <Text style={selectedValue ? styles.staffStyles.pickerValue : styles.staffStyles.pickerPlaceholder}>{selectedLabel}</Text>
          <Ionicons name="chevron-down-outline" size={20} color={COLORS.text_secondary} />
        </TouchableOpacity>
      </View>
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.staffStyles.pickerModalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.staffStyles.pickerModalContent}>
            <FlatList data={items} keyExtractor={(item) => String(item.value)} renderItem={({ item }) => (
              <TouchableOpacity style={styles.staffStyles.pickerItem} onPress={() => handleSelect(item.value)}>
                <Text style={styles.staffStyles.pickerItemText}>{item.label}</Text>
              </TouchableOpacity>
            )} />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};