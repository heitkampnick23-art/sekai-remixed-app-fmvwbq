
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, authenticatedPost } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';

interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  content: any;
  likesCount: number;
  isPublic: boolean;
}

export default function StoryDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const [successModal, setSuccessModal] = useState({ visible: false, message: '' });

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    console.log('[Story Detail] Loading story:', id);
    setLoading(true);
    try {
      const storyData = await apiGet<Story>(`/api/stories/${id}`);
      console.log('[Story Detail] Story loaded:', storyData);
      setStory(storyData);
    } catch (error: any) {
      console.error('[Story Detail] Error loading story:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to load story.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    console.log('[Story Detail] User tapped like button');
    setLiked(!liked);
    // Note: Like endpoint not in API spec, would need to be added
  };

  const handleStartAdventure = async () => {
    console.log('[Story Detail] User tapped Start Adventure button');
    try {
      const conversation = await authenticatedPost('/api/conversations', {
        storyId: id,
        title: `Adventure: ${story?.title}`,
      });
      console.log('[Story Detail] Conversation created:', conversation);
      router.push(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('[Story Detail] Error creating conversation:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to start adventure.' });
    }
  };

  const handleExport = async () => {
    console.log('[Story Detail] User tapped Export button');
    setExporting(true);
    try {
      const result = await authenticatedPost(`/api/stories/${id}/export`, {});
      console.log('[Story Detail] Story exported:', result);
      if (result.downloadUrl) {
        setSuccessModal({ visible: true, message: 'Story exported successfully! (Premium feature)' });
      } else {
        setSuccessModal({ visible: true, message: 'Story exported in text format.' });
      }
    } catch (error: any) {
      console.error('[Story Detail] Error exporting story:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to export story.' });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Story not found</Text>
      </View>
    );
  }

  const storyTitle = story.title;
  const storyDescription = story.description;
  const storyGenre = story.genre;
  const storyLikes = story.likesCount.toString();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: story?.title || 'Story',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={handleExport} disabled={exporting}>
              {exporting ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <IconSymbol
                  ios_icon_name="square.and.arrow.up"
                  android_material_icon_name="share"
                  size={22}
                  color={colors.text}
                />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: colors.text }]}>{storyTitle}</Text>
              <View style={[styles.genreTag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.genreTagText, { color: colors.primary }]}>
                  {storyGenre}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleLike}>
              <View style={styles.likeButton}>
                <IconSymbol
                  ios_icon_name={liked ? 'heart.fill' : 'heart'}
                  android_material_icon_name={liked ? 'favorite' : 'favorite-border'}
                  size={24}
                  color={liked ? '#EF4444' : colors.text}
                />
                <Text style={[styles.likesText, { color: colors.text + '80' }]}>
                  {storyLikes}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.sectionText, { color: colors.text + '80' }]}>
              {storyDescription}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.adventureButton, { backgroundColor: colors.primary }]}
            onPress={handleStartAdventure}
          >
            <IconSymbol
              ios_icon_name="play.fill"
              android_material_icon_name="play-arrow"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.adventureButtonText}>Start Adventure</Text>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  genreTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  genreTagText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  likeButton: {
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  adventureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
  },
  adventureButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});
