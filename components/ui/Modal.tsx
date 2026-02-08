
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
  type?: 'info' | 'warning' | 'error' | 'success';
}

export function Modal({
  visible,
  onClose,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  loading = false,
  type = 'info',
}: ModalProps) {
  const { colors } = useTheme();

  const getTypeColor = () => {
    switch (type) {
      case 'error':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'success':
        return '#10B981';
      default:
        return colors.primary;
    }
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.text + '80' }]}>
            {message}
          </Text>
          <View style={styles.buttons}>
            {onConfirm && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.background }]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: getTypeColor() },
                onConfirm ? {} : { flex: 1 },
              ]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '80%',
    borderRadius: 20,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
