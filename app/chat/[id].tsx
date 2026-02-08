
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { StreamdownRN } from 'streamdown-rn';
import { authenticatedGet, authenticatedPost, authenticatedDelete } from '@/utils/api';
import { Modal } from '@/components/ui/Modal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  characterId: string;
  title: string;
  messages: Message[];
}

export default function ChatScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorModal, setErrorModal] = useState({ visible: false, message: '' });
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadConversation();
  }, [id]);

  const loadConversation = async () => {
    console.log('[Chat] Loading conversation:', id);
    setLoading(true);
    try {
      const conversationData = await authenticatedGet<Conversation>(`/api/conversations/${id}`);
      console.log('[Chat] Conversation loaded:', conversationData);
      setConversation(conversationData);
      setMessages(conversationData.messages || []);
    } catch (error: any) {
      console.error('[Chat] Error loading conversation:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to load conversation.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    console.log('[Chat] User sending message:', inputText);
    const userMessage = inputText.trim();
    setInputText('');
    setSending(true);

    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await authenticatedPost('/api/ai/chat', {
        conversationId: id,
        message: userMessage,
        characterId: conversation?.characterId,
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
      });
      
      console.log('[Chat] AI response received:', response);
      
      const aiResponse: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error: any) {
      console.error('[Chat] Error sending message:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to send message. You may have reached your daily limit.' });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteHistory = () => {
    console.log('[Chat] User tapped delete history');
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    console.log('[Chat] User confirmed delete');
    setDeleting(true);
    try {
      await authenticatedDelete(`/api/conversations/${id}`, {});
      console.log('[Chat] Conversation deleted');
      router.back();
    } catch (error: any) {
      console.error('[Chat] Error deleting conversation:', error);
      setErrorModal({ visible: true, message: error.message || 'Failed to delete conversation.' });
    } finally {
      setDeleting(false);
      setDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: conversation?.title || 'Chat',
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={handleDeleteHistory}>
              <IconSymbol
                ios_icon_name="trash"
                android_material_icon_name="delete"
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message, index) => {
            const messageContent = message.content;
            const isUser = message.role === 'user';
            
            return (
              <View
                key={index}
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.aiBubble,
                  { backgroundColor: isUser ? colors.primary : colors.card },
                ]}
              >
                {isUser ? (
                  <Text style={[styles.messageText, { color: '#FFFFFF' }]}>
                    {messageContent}
                  </Text>
                ) : (
                  <StreamdownRN theme="dark">
                    {messageContent}
                  </StreamdownRN>
                )}
              </View>
            );
          })}
          {sending && (
            <View style={[styles.messageBubble, styles.aiBubble, { backgroundColor: colors.card }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Type your message..."
            placeholderTextColor={colors.text + '60'}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            <IconSymbol
              ios_icon_name="arrow.up"
              android_material_icon_name="send"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        onConfirm={confirmDelete}
        loading={deleting}
        type="error"
      />

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
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
