
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
  Modal,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { authenticatedGet } from '@/utils/api';

function resolveImageSource(source: string | number | ImageSourcePropType | undefined): ImageSourcePropType {
  if (!source) return { uri: '' };
  if (typeof source === 'string') return { uri: source };
  return source as ImageSourcePropType;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isPremium: boolean;
  dailyAiConversationsUsed: number;
  followersCount?: number;
  followingCount?: number;
  charactersCount?: number;
  storiesCount?: number;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    console.log('[Profile] Loading user profile data');
    setLoading(true);
    try {
      const profile = await authenticatedGet<UserProfile>('/api/users/me');
      console.log('[Profile] User profile loaded:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('[Profile] Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log('User tapped Sign Out button');
    setShowSignOutModal(true);
  };

  const confirmSignOut = async () => {
    console.log('User confirmed sign out');
    setShowSignOutModal(false);
    setLoading(true);
    try {
      await signOut();
      router.replace('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeToPremium = () => {
    console.log('User tapped Upgrade to Premium button');
    // TODO: Integrate Superwall for premium subscription
  };

  const handleCreateCharacter = () => {
    console.log('User tapped Create Character button');
    router.push('/character/create');
  };

  const handleCreateStory = () => {
    console.log('User tapped Create Story button');
    router.push('/story/create');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const userName = userProfile?.name || user?.name || 'Adventurer';
  const userEmail = userProfile?.email || user?.email || '';
  const userAvatar = userProfile?.avatarUrl || user?.image || '';
  const isPremium = userProfile?.isPremium || false;
  const followersCount = userProfile?.followersCount?.toString() || '0';
  const followingCount = userProfile?.followingCount?.toString() || '0';
  const charactersCount = userProfile?.charactersCount?.toString() || '0';
  const storiesCount = userProfile?.storiesCount?.toString() || '0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Profile</Text>
          <TouchableOpacity onPress={handleSignOut}>
            <IconSymbol
              ios_icon_name="rectangle.portrait.and.arrow.right"
              android_material_icon_name="logout"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
          <Image
            source={resolveImageSource(userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200')}
            style={styles.avatar}
          />
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
          <Text style={[styles.userEmail, { color: colors.text + '80' }]}>{userEmail}</Text>

          {!isPremium && (
            <TouchableOpacity
              style={[styles.premiumButton, { backgroundColor: colors.primary }]}
              onPress={handleUpgradeToPremium}
            >
              <IconSymbol
                ios_icon_name="crown.fill"
                android_material_icon_name="star"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.premiumButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{followersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{followingCount}</Text>
              <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Following</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{charactersCount}</Text>
              <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Characters</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{storiesCount}</Text>
              <Text style={[styles.statLabel, { color: colors.text + '80' }]}>Stories</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Create</Text>
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={handleCreateCharacter}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="person.fill.badge.plus"
                  android_material_icon_name="person-add"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Create Character</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.text + '60'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: colors.card }]}
            onPress={handleCreateStory}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="book.fill"
                  android_material_icon_name="menu-book"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Create Story</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.text + '60'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Content</Text>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="person.2.fill"
                  android_material_icon_name="group"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>My Characters</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.text + '60'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="books.vertical.fill"
                  android_material_icon_name="library-books"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>My Stories</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.text + '60'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="bubble.left.and.bubble.right.fill"
                  android_material_icon_name="chat"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>My Conversations</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.text + '60'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settings</Text>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIcon, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name="gearshape.fill"
                  android_material_icon_name="settings"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>App Settings</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={20}
              color={colors.text + '60'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal
        visible={showSignOutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sign Out</Text>
            <Text style={[styles.modalMessage, { color: colors.text + '80' }]}>
              Are you sure you want to sign out?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.background }]}
                onPress={() => setShowSignOutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                onPress={confirmSignOut}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>Sign Out</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  profileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2A2A2A',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  userEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  premiumButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 24,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
