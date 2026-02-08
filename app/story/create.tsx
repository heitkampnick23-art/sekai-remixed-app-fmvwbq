
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

const GENRES = ['Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Horror', 'Adventure'];

export default function CreateStoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Fantasy');
  const [isPublic, setIsPublic] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });

  const handleGenerateStory = async () => {
    if (!prompt.trim()) {
      setErrorModal({ visible: true, message: 'Please enter a story prompt first.' });
      return;
    }

    console.log('[Story Create] User tapped Generate Story button');
    setGenerating(true);
    try {
      const result = await authenticatedPost('/api/ai/generate-story', {
        prompt: prompt.trim(),
        genre: selectedGenre.toLowerCase(),
        characterIds: [],
      });
      console.log('[Story Create] Story generated:', result);
      setTitle(result.title);
      setDescription(result.description);
      setSuccessModal({ visible: true, message: 'Story generated successfully!' });
    } catch (error: any) {
      console.error('[Story Create] Error generating story:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to generate story. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setErrorModal({ visible: true, message: 'Please fill in story title and description.' });
      return;
    }

    console.log('[Story Create] User tapped Save Story button');
    setSaving(true);
    try {
      const story = await authenticatedPost('/api/stories', {
        title: title.trim(),
        description: description.trim(),
        genre: selectedGenre.toLowerCase(),
        content: {},
        isPublic,
        isPrivate,
      });
      console.log('[Story Create] Story created:', story);
      setSuccessModal({ visible: true, message: 'Story created successfully!' });
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('[Story Create] Error saving story:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to create story. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Create Story',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>AI Story Prompt</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Describe the story you want to create..."
            placeholderTextColor={colors.text + '60'}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.primary }]}
            onPress={handleGenerateStory}
            disabled={generating || !prompt.trim()}
          >
            {generating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto-awesome"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.generateButtonText}>Generate with AI</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Story Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Enter story title..."
            placeholderTextColor={colors.text + '60'}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
            placeholder="Describe your story..."
            placeholderTextColor={colors.text + '60'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Genre</Text>
          <View style={styles.genreGrid}>
            {GENRES.map((genre) => {
              const isSelected = genre === selectedGenre;
              return (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    { backgroundColor: isSelected ? colors.primary : colors.card },
                  ]}
                  onPress={() => setSelectedGenre(genre)}
                >
                  <Text
                    style={[
                      styles.genreChipText,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
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

          <TouchableOpacity
            style={[styles.toggleRow, { marginTop: 16 }]}
            onPress={() => setIsPrivate(!isPrivate)}
          >
            <View style={styles.toggleLeft}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={20}
                color={colors.text}
              />
              <Text style={[styles.toggleText, { color: colors.text }]}>
                Private Story (Premium)
              </Text>
            </View>
            <View
              style={[
                styles.toggle,
                { backgroundColor: isPrivate ? colors.primary : colors.card },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: '#FFFFFF' },
                  isPrivate && styles.toggleThumbActive,
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving || !title.trim() || !description.trim()}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Create Story</Text>
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A2A',
    marginVertical: 20,
    marginHorizontal: 20,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  genreChipText: {
    fontSize: 14,
    fontWeight: '500',
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
