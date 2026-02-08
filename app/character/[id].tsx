
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { apiGet, authenticatedPost } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Character {
  id: string;
  name: string;
  description: string;
  personality: string;
  backstory: string;
  avatarUrl: string;
  style: string;
  likesCount: number;
  isPublic: boolean;
}

export default function CharacterDetailScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });

  useEffect(() => {
    loadCharacter();
  }, [id]);

  const loadCharacter = async () => {
    console.log('[Character Detail] Loading character:', id);
    setLoading(true);
    try {
      const characterData = await apiGet<Character>(`/api/characters/${id}`);
      console.log('[Character Detail] Character loaded:', characterData);
      setCharacter(characterData);
    } catch (error: any) {
      console.error('[Character Detail] Error loading character:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to load character.' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    console.log('[Character Detail] User tapped Start Chat button');
    try {
      const conversation = await authenticatedPost('/api/conversations', {
        characterId: id,
        title: `Chat with ${character?.name}`,
      });
      console.log('[Character Detail] Conversation created:', conversation);
      router.push(`/chat/${conversation.id}`);
    } catch (error: any) {
      console.error('[Character Detail] Error creating conversation:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to start conversation.' });
    }
  };

  const handleLike = async () => {
    console.log('[Character Detail] User tapped like button');
    setLiked(!liked);
    // Note: Like endpoint not in API spec, would need to be added
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!character) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Character not found</Text>
      </View>
    );
  }

  const characterName = character.name;
  const characterDescription = character.description;
  const characterPersonality = character.personality;
  const characterBackstory = character.backstory;
  const characterStyle = character.style;
  const characterLikes = character.likesCount.toString();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: characterName,
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Image
          source={resolveImageSource(character.avatarUrl)}
          style={styles.avatar}
        />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={[styles.name, { color: colors.text }]}>{characterName}</Text>
              <View style={[styles.styleTag, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.styleTagText, { color: colors.primary }]}>
                  {characterStyle}
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
                  {characterLikes}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
            <Text style={[styles.sectionText, { color: colors.text + '80' }]}>
              {characterDescription}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Personality</Text>
            <Text style={[styles.sectionText, { color: colors.text + '80' }]}>
              {characterPersonality}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Backstory</Text>
            <Text style={[styles.sectionText, { color: colors.text + '80' }]}>
              {characterBackstory}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: colors.primary }]}
            onPress={handleStartChat}
          >
            <IconSymbol
              ios_icon_name="bubble.left.and.bubble.right.fill"
              android_material_icon_name="chat"
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.chatButtonText}>Start Conversation</Text>
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
  avatar: {
    width: '100%',
    height: 300,
    backgroundColor: '#2A2A2A',
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
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  styleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  styleTagText: {
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
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 10,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 20,
  },
});
