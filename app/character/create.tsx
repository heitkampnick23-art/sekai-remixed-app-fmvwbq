
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { authenticatedPost } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';

const STYLES = ['Anime', 'Modern', 'Fantasy', 'Historical', 'Adventure'];

export default function CreateCharacterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [personality, setPersonality] = useState('');
  const [backstory, setBackstory] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('Fantasy');
  const [isPublic, setIsPublic] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });

  const handleGenerateImage = async () => {
    if (!description.trim()) {
      setErrorModal({ visible: true, message: 'Please add a description first to generate an image.' });
      return;
    }

    console.log('[Character Create] User tapped Generate Image button');
    setGenerating(true);
    try {
      const result = await authenticatedPost('/api/ai/generate-image', {
        prompt: description,
        style: selectedStyle.toLowerCase(),
      });
      console.log('[Character Create] Image generated:', result);
      setSuccessModal({ visible: true, message: 'AI avatar generated successfully! (Premium feature)' });
    } catch (error: any) {
      console.error('[Character Create] Error generating image:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to generate image. This is a premium feature.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      setErrorModal({ visible: true, message: 'Please fill in character name and description.' });
      return;
    }

    console.log('[Character Create] User tapped Save Character button');
    setSaving(true);
    try {
      const character = await authenticatedPost('/api/characters', {
        name: name.trim(),
        description: description.trim(),
        personality: personality.trim(),
        backstory: backstory.trim(),
        style: selectedStyle.toLowerCase(),
        isPublic,
      });
      console.log('[Character Create] Character created:', character);
      setSuccessModal({ visible: true, message: 'Character created successfully!' });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('[Character Create] Error saving character:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to create character. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Character',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Character Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Enter character name..."
            placeholderTextColor={colors.text + '60'}
            value={name}
            onChangeText={setName}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Describe your character..."
            placeholderTextColor={colors.text + '60'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Personality</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="What is their personality like?"
            placeholderTextColor={colors.text + '60'}
            value={personality}
            onChangeText={setPersonality}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Backstory</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Tell their story..."
            placeholderTextColor={colors.text + '60'}
            value={backstory}
            onChangeText={setBackstory}
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Style</Text>
          <View style={styles.styleGrid}>
            {STYLES.map((style) => {
              const isSelected = style === selectedStyle;
              return (
                <TouchableOpacity
                  key={style}
                  style={[
                    styles.styleChip,
                    { backgroundColor: isSelected ? colors.primary : colors.card },
                  ]}
                  onPress={() => setSelectedStyle(style)}
                >
                  <Text
                    style={[
                      styles.styleChipText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {style}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.card }]}
            onPress={handleGenerateImage}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.generateButtonText, { color: colors.primary }]}>
                  Generate AI Avatar
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setIsPublic(!isPublic)}
          >
            <View style={styles.toggleLeft}>
              <IconSymbol
                ios_icon_name="globe"
                android_material_icon_name="public"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.toggleText, { color: colors.text }]}>
                Make Public
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                { backgroundColor: isPublic ? colors.primary : colors.card },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: '#FFFFFF' },
                  isPublic && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving || !name.trim() || !description.trim()}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Create Character</Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={errorModal.visible}
        onClose={() => setErrorModal({ visible: false, message: '' })}
        title="Error"
        message={errorModal.message}
        type="error"
      />

      <Modal
        visible={successModal.visible}
        onClose={() => setSuccessModal({ visible: false, message: '' })}
        title="Success"
        message={successModal.message}
        type="success"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
  },
  textArea: {
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  styleChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  styleChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 30,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
