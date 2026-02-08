
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ImageSourcePropType,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { apiGet } from '@/utils/api';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

const STYLES = ['All', 'Anime', 'Modern', 'Fantasy', 'Historical', 'Adventure'];
const GENRES = ['All', 'Fantasy', 'Sci-Fi', 'Romance', 'Mystery', 'Horror', 'Adventure'];

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

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [activeTab, setActiveTab] = useState<'characters' | 'stories'>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, selectedStyle, selectedGenre, searchQuery]);

  const loadData = async () => {
    console.log('[Discover] Loading data for tab:', activeTab);
    setLoading(true);
    try {
      if (activeTab === 'characters') {
        const params = new URLSearchParams();
        params.append('public', 'true');
        if (selectedStyle !== 'All') params.append('style', selectedStyle.toLowerCase());
        if (searchQuery) params.append('search', searchQuery);
        
        const charactersData = await apiGet<Character[]>(`/api/characters?${params.toString()}`);
        console.log('[Discover] Characters loaded:', charactersData.length);
        setCharacters(charactersData);
      } else {
        const params = new URLSearchParams();
        params.append('public', 'true');
        if (selectedGenre !== 'All') params.append('genre', selectedGenre.toLowerCase());
        if (searchQuery) params.append('search', searchQuery);
        
        const storiesData = await apiGet<Story[]>(`/api/stories?${params.toString()}`);
        console.log('[Discover] Stories loaded:', storiesData.length);
        setStories(storiesData);
      }
    } catch (error) {
      console.error('[Discover] Error loading data:', error);
      if (activeTab === 'characters') {
        setCharacters([]);
      } else {
        setStories([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text: string) => {
    console.log('[Discover] User searching for:', text);
    setSearchQuery(text);
  };

  const handleStyleFilter = (style: string) => {
    console.log('[Discover] User selected style filter:', style);
    setSelectedStyle(style);
  };

  const handleGenreFilter = (genre: string) => {
    console.log('[Discover] User selected genre filter:', genre);
    setSelectedGenre(genre);
  };

  const handleCharacterPress = (characterId: string) => {
    console.log('User tapped character:', characterId);
    router.push(`/character/${characterId}`);
  };

  const handleStoryPress = (storyId: string) => {
    console.log('User tapped story:', storyId);
    router.push(`/story/${storyId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Discover</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.text + '60'}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search characters or stories..."
          placeholderTextColor={colors.text + '60'}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'characters' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('characters')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'characters' ? '#FFFFFF' : colors.text + '80' },
            ]}
          >
            Characters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'stories' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setActiveTab('stories')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'stories' ? '#FFFFFF' : colors.text + '80' },
            ]}
          >
            Stories
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {(activeTab === 'characters' ? STYLES : GENRES).map((item) => {
          const isSelected = activeTab === 'characters' 
            ? item === selectedStyle 
            : item === selectedGenre;
          
          return (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterChip,
                { backgroundColor: isSelected ? colors.primary : colors.card },
              ]}
              onPress={() => activeTab === 'characters' ? handleStyleFilter(item) : handleGenreFilter(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isSelected ? '#FFFFFF' : colors.text },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'characters' ? (
          <View style={styles.grid}>
            {characters.map((character) => {
              const characterName = character.name;
              const characterDescription = character.description;
              const characterLikes = character.likesCount.toString();
              const characterStyle = character.style;
              
              return (
                <TouchableOpacity
                  key={character.id}
                  style={[styles.gridItem, { backgroundColor: colors.card }]}
                  onPress={() => handleCharacterPress(character.id)}
                >
                  <Image
                    source={resolveImageSource(character.avatarUrl)}
                    style={styles.gridImage}
                  />
                  <View style={styles.gridInfo}>
                    <Text style={[styles.gridTitle, { color: colors.text }]} numberOfLines={1}>
                      {characterName}
                    </Text>
                    <Text style={[styles.gridDescription, { color: colors.text + '80' }]} numberOfLines={2}>
                      {characterDescription}
                    </Text>
                    <View style={styles.gridMeta}>
                      <View style={[styles.styleTag, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.styleTagText, { color: colors.primary }]}>
                          {characterStyle}
                        </Text>
                      </View>
                      <View style={styles.likesContainer}>
                        <IconSymbol
                          ios_icon_name="heart.fill"
                          android_material_icon_name="favorite"
                          size={12}
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
          </View>
        ) : (
          <View style={styles.list}>
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
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterScroll: {
    marginTop: 16,
    paddingHorizontal: 20,
    maxHeight: 50,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    marginTop: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 16,
  },
  gridItem: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#2A2A2A',
  },
  gridInfo: {
    padding: 12,
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridDescription: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  gridMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  styleTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  styleTagText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likesText: {
    fontSize: 11,
  },
  list: {
    paddingHorizontal: 20,
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
  bottomPadding: {
    height: 100,
  },
});
