
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
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { LinearGradient } from 'expo-linear-gradient';
import { authenticatedGet, apiGet } from '@/utils/api';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Character {
  id: string;
  name: string;
  description: string;
  avatarUrl: string;
  style: string;
  likesCount: number;
}

interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  likesCount: number;
}

interface Conversation {
  id: string;
  title: string;
  characterId: string;
  updatedAt: string;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/auth');
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    console.log('[Home] Loading home screen data');
    setLoading(true);
    try {
      // Fetch featured characters (public characters)
      const charactersData = await apiGet<Character[]>('/api/characters?public=true');
      console.log('[Home] Featured characters loaded:', charactersData.length);
      setCharacters(charactersData.slice(0, 10)); // Limit to 10 featured

      // Fetch featured stories (public stories)
      const storiesData = await apiGet<Story[]>('/api/stories?public=true');
      console.log('[Home] Featured stories loaded:', storiesData.length);
      setStories(storiesData.slice(0, 5)); // Limit to 5 featured

      // Fetch user's recent conversations
      const conversationsData = await authenticatedGet<Conversation[]>('/api/conversations');
      console.log('[Home] User conversations loaded:', conversationsData.length);
      setConversations(conversationsData.slice(0, 3)); // Show only 3 most recent
    } catch (error) {
      console.error('[Home] Error loading home data:', error);
      // Set empty arrays on error to prevent UI issues
      setCharacters([]);
      setStories([]);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    console.log('User tapped Start New Chat button');
    router.push('/character/create');
  };

  const handleCharacterPress = (characterId: string) => {
    console.log('User tapped character:', characterId);
    router.push(`/character/${characterId}`);
  };

  const handleStoryPress = (storyId: string) => {
    console.log('User tapped story:', storyId);
    router.push(`/story/${storyId}`);
  };

  const handleConversationPress = (conversationId: string) => {
    console.log('User tapped conversation:', conversationId);
    router.push(`/chat/${conversationId}`);
  };

  if (authLoading || loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const userName = user?.name || 'Adventurer';
  const isPremium = false;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: colors.primary }]}>{userName}</Text>
          </View>
          {!isPremium && (
            <TouchableOpacity style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="star"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.premiumText}>Go Premium</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: colors.primary }]}
          onPress={handleStartNewChat}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.newChatText}>Start New Adventure</Text>
          </LinearGradient>
        </TouchableOpacity>

        {conversations.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Your Journey</Text>
            {conversations.map((conversation) => {
              const conversationTitle = conversation.title || 'Untitled Conversation';
              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={[styles.conversationCard, { backgroundColor: colors.card }]}
                  onPress={() => handleConversationPress(conversation.id)}
                >
                  <View style={styles.conversationInfo}>
                    <Text style={[styles.conversationTitle, { color: colors.text }]}>
                      {conversationTitle}
                    </Text>
                    <Text style={[styles.conversationDate, { color: colors.text + '80' }]}>
                      {conversation.updatedAt}
                    </Text>
                  </View>
                  <IconSymbol
                    ios_icon_name="chevron.right"
                    android_material_icon_name="chevron-right"
                    size={20}
                    color={colors.text + '60'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Characters</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {characters.map((character) => {
              const characterName = character.name;
              const characterDescription = character.description;
              const characterLikes = character.likesCount.toString();
              const characterStyle = character.style;
              
              return (
                <TouchableOpacity
                  key={character.id}
                  style={[styles.characterCard, { backgroundColor: colors.card }]}
                  onPress={() => handleCharacterPress(character.id)}
                >
                  <Image
                    source={resolveImageSource(character.avatarUrl)}
                    style={styles.characterAvatar}
                  />
                  <View style={styles.characterInfo}>
                    <Text style={[styles.characterName, { color: colors.text }]} numberOfLines={1}>
                      {characterName}
                    </Text>
                    <Text style={[styles.characterDescription, { color: colors.text + '80' }]} numberOfLines={2}>
                      {characterDescription}
                    </Text>
                    <View style={styles.characterMeta}>
                      <View style={[styles.styleTag, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.styleTagText, { color: colors.primary }]}>
                          {characterStyle}
                        </Text>
                      </View>
                      <View style={styles.likesContainer}>
                        <IconSymbol
                          ios_icon_name="heart.fill"
                          android_material_icon_name="favorite"
                          size={14}
                          color={colors.primary}
                        />
                        <Text style={[styles.likesText, { color: colors.text + '80' }]}>
                          {characterLikes}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Stories</Text>
          {stories.map((story) => {
            const storyTitle = story.title;
            const storyDescription = story.description;
            const storyGenre = story.genre;
            const storyLikes = story.likesCount.toString();
            
            return (
              <TouchableOpacity
                key={story.id}
                style={[styles.storyCard, { backgroundColor: colors.card }]}
                onPress={() => handleStoryPress(story.id)}
              >
                <View style={styles.storyContent}>
                  <Text style={[styles.storyTitle, { color: colors.text }]}>{storyTitle}</Text>
                  <Text style={[styles.storyDescription, { color: colors.text + '80' }]} numberOfLines={2}>
                    {storyDescription}
                  </Text>
                  <View style={styles.storyMeta}>
                    <View style={[styles.genreTag, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.genreTagText, { color: colors.primary }]}>
                        {storyGenre}
                      </Text>
                    </View>
                    <View style={styles.likesContainer}>
                      <IconSymbol
                        ios_icon_name="heart.fill"
                        android_material_icon_name="favorite"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={[styles.likesText, { color: colors.text + '80' }]}>
                        {storyLikes}
                      </Text>
                    </View>
                  </View>
                </View>
                <IconSymbol
                  ios_icon_name="chevron.right"
                  android_material_icon_name="chevron-right"
                  size={20}
                  color={colors.text + '60'}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.7,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  premiumText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  newChatButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  newChatText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  horizontalScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  characterCard: {
    width: 200,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
  },
  characterAvatar: {
    width: '100%',
    height: 200,
    backgroundColor: '#2A2A2A',
  },
  characterInfo: {
    padding: 12,
  },
  characterName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  characterDescription: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  characterMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  styleTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  styleTagText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 12,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  storyContent: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  storyDescription: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  storyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genreTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  genreTagText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conversationDate: {
    fontSize: 13,
  },
  bottomPadding: {
    height: 100,
  },
});
