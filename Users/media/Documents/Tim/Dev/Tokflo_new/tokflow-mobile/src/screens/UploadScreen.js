import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Video } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore, storage } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Toast from 'react-native-toast-message';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function UploadScreen({ navigation }) {
  const [user] = useAuthState(auth);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('');
  const [songName, setSongName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [recording, setRecording] = useState(false);
  const cameraRef = useRef(null);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(status === 'granted');
    return status === 'granted';
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled) {
        setSelectedVideo(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to pick video',
      });
    }
  };

  const recordVideo = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission',
        'Camera permission is required to record videos.'
      );
      return;
    }
    setShowCamera(true);
  };

  const startRecording = async () => {
    if (cameraRef.current && !recording) {
      setRecording(true);
      try {
        const video = await cameraRef.current.recordAsync({
          maxDuration: 60,
          quality: Camera.Constants.VideoQuality['720p'],
        });
        setSelectedVideo({ uri: video.uri });
        setShowCamera(false);
      } catch (error) {
        console.error('Recording error:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to record video',
        });
      } finally {
        setRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && recording) {
      cameraRef.current.stopRecording();
      setRecording(false);
    }
  };

  const uploadVideo = async () => {
    if (!selectedVideo || !caption.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Please select a video and add a caption',
      });
      return;
    }

    setUploading(true);

    try {
      // Upload video to Firebase Storage
      const response = await fetch(selectedVideo.uri);
      const blob = await response.blob();
      
      const videoRef = ref(storage, `videos/${Date.now()}_${user.uid}`);
      await uploadBytes(videoRef, blob);
      const videoURL = await getDownloadURL(videoRef);

      // Create post document
      await addDoc(collection(firestore, 'posts'), {
        caption: caption.trim(),
        video: videoURL,
        topic: topic.trim() || 'general',
        songName: songName.trim() || '',
        username: user.displayName || user.email,
        userId: user.uid,
        profileImage: user.photoURL || '',
        company: '',
        timestamp: serverTimestamp(),
      });

      Toast.show({
        type: 'success',
        text1: 'Video uploaded successfully!',
      });

      // Reset form
      setSelectedVideo(null);
      setCaption('');
      setTopic('');
      setSongName('');
      
      // Navigate back to home
      navigation.navigate('Home');
    } catch (error) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to upload video',
        text2: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.back}
          ratio="16:9"
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={32} color="#ffffff" />
            </TouchableOpacity>
            
            <View style={styles.recordingControls}>
              <TouchableOpacity
                style={[
                  styles.recordButton,
                  recording && styles.recordButtonActive,
                ]}
                onPress={recording ? stopRecording : startRecording}
              >
                <View
                  style={[
                    styles.recordButtonInner,
                    recording && styles.recordButtonInnerActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Camera>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <View style={styles.content}>
        {/* Video Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Video</Text>
          
          {selectedVideo ? (
            <View style={styles.videoPreview}>
              <Video
                source={{ uri: selectedVideo.uri }}
                style={styles.previewVideo}
                useNativeControls
                resizeMode="cover"
                isLooping
              />
              <TouchableOpacity
                style={styles.removeVideoButton}
                onPress={() => setSelectedVideo(null)}
              >
                <Ionicons name="close-circle" size={32} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.videoSelection}>
              <TouchableOpacity style={styles.selectionButton} onPress={pickVideo}>
                <Ionicons name="library" size={32} color="#6366f1" />
                <Text style={styles.selectionText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.selectionButton} onPress={recordVideo}>
                <Ionicons name="camera" size={32} color="#6366f1" />
                <Text style={styles.selectionText}>Record Video</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Caption */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caption</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Write a caption..."
            placeholderTextColor="#9ca3af"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={500}
          />
          <Text style={styles.characterCount}>{caption.length}/500</Text>
        </View>

        {/* Topic */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Topic (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Add a topic or hashtag..."
            placeholderTextColor="#9ca3af"
            value={topic}
            onChangeText={setTopic}
            maxLength={50}
          />
        </View>

        {/* Song Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Song Name (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Add song name..."
            placeholderTextColor="#9ca3af"
            value={songName}
            onChangeText={setSongName}
            maxLength={100}
          />
        </View>

        {/* Upload Button */}
        <TouchableOpacity
          style={[
            styles.uploadButton,
            (!selectedVideo || !caption.trim() || uploading) &&
              styles.uploadButtonDisabled,
          ]}
          onPress={uploadVideo}
          disabled={!selectedVideo || !caption.trim() || uploading}
        >
          <Text style={styles.uploadButtonText}>
            {uploading ? 'Uploading...' : 'Post Video'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  videoSelection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  selectionButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
    flex: 0.45,
  },
  selectionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6366f1',
    textAlign: 'center',
  },
  videoPreview: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewVideo: {
    width: '100%',
    height: 300,
  },
  removeVideoButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    textAlign: 'right',
    marginTop: 8,
    fontSize: 12,
    color: '#6b7280',
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
  },
  closeButton: {
    alignSelf: 'flex-end',
    margin: 20,
    marginTop: 50,
  },
  recordingControls: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: 'rgba(239,68,68,0.3)',
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  recordButtonInnerActive: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 40,
    height: 40,
  },
});