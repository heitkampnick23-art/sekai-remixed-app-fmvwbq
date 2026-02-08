
import React, { useState, useEffect } from 'react';
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
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import { authenticatedGet, authenticatedPost } from '@/utils/api';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  contentType: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
  liked: boolean;
}

export default function CommunityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    console.log('[Community] Loading community feed');
    setLoading(true);
    try {
      const feedData = await authenticatedGet<Post[]>('/api/community/feed');
      console.log('[Community] Feed loaded:', feedData.length, 'posts');
      setPosts(feedData);
    } catch (error) {
      console.error('[Community] Error loading community feed:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    console.log('[Community] User tapped like on post:', postId);
    
    // Optimistic update
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newLiked = !post.liked;
        const newLikesCount = newLiked ? post.likesCount + 1 : post.likesCount - 1;
        return {
          ...post,
          liked: newLiked,
          likesCount: newLikesCount,
        };
      }
      return post;
    }));

    try {
      await authenticatedPost(`/api/community/posts/${postId}/like`, {});
      console.log('[Community] Like toggled successfully');
    } catch (error) {
      console.error('[Community] Error toggling like:', error);
      // Revert optimistic update on error
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const newLiked = !post.liked;
          const newLikesCount = newLiked ? post.likesCount - 1 : post.likesCount + 1;
          return {
            ...post,
            liked: newLiked,
            likesCount: newLikesCount,
          };
        }
        return post;
      }));
    }
  };

  const handleComment = (postId: string) => {
    console.log('User tapped comment on post:', postId);
    // TODO: Navigate to comments screen or show comment modal
  };

  const handleUserPress = (userId: string) => {
    console.log('User tapped on user profile:', userId);
    router.push(`/user/${userId}`);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Community</Text>
        <TouchableOpacity>
          <IconSymbol
            ios_icon_name="bell.fill"
            android_material_icon_name="notifications"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.feed} showsVerticalScrollIndicator={false}>
        {posts.map((post) => {
          const userName = post.userName;
          const caption = post.caption;
          const createdAt = post.createdAt;
          const likesCount = post.likesCount.toString();
          const commentsCount = post.commentsCount.toString();
          const contentType = post.contentType;
          
          return (
            <View key={post.id} style={[styles.postCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={styles.postHeader}
                onPress={() => handleUserPress(post.userId)}
              >
                <Image
                  source={resolveImageSource(post.userAvatar)}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
                  <Text style={[styles.postTime, { color: colors.text + '60' }]}>{createdAt}</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.postContent}>
                <Text style={[styles.caption, { color: colors.text }]}>{caption}</Text>
                <View style={[styles.contentTypeTag, { backgroundColor: colors.primary + '20' }]}>
                  <IconSymbol
                    ios_icon_name={contentType === 'character' ? 'person.fill' : 'book.fill'}
                    android_material_icon_name={contentType === 'character' ? 'person' : 'menu-book'}
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.contentTypeText, { color: colors.primary }]}>
                    {contentType}
                  </Text>
                </View>
              </View>

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleLike(post.id)}
                >
                  <IconSymbol
                    ios_icon_name={post.liked ? 'heart.fill' : 'heart'}
                    android_material_icon_name={post.liked ? 'favorite' : 'favorite-border'}
                    size={22}
                    color={post.liked ? '#EF4444' : colors.text + '80'}
                  />
                  <Text style={[styles.actionText, { color: colors.text + '80' }]}>
                    {likesCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleComment(post.id)}
                >
                  <IconSymbol
                    ios_icon_name="bubble.left"
                    android_material_icon_name="chat-bubble-outline"
                    size={22}
                    color={colors.text + '80'}
                  />
                  <Text style={[styles.actionText, { color: colors.text + '80' }]}>
                    {commentsCount}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol
                    ios_icon_name="square.and.arrow.up"
                    android_material_icon_name="share"
                    size={22}
                    color={colors.text + '80'}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton}>
                  <IconSymbol
                    ios_icon_name="gift.fill"
                    android_material_icon_name="card-giftcard"
                    size={22}
                    color={colors.text + '80'}
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  feed: {
    flex: 1,
    marginTop: 10,
  },
  postCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 13,
    marginTop: 2,
  },
  postContent: {
    marginBottom: 12,
  },
  caption: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  contentTypeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  contentTypeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
});
