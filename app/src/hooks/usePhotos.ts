import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

export const MAX_PHOTOS = 6;

async function pickPhotos(remaining: number) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("사진 접근 권한이 필요합니다.");
    return [];
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: remaining,
    quality: 0.8,
  });

  return result.canceled ? [] : result.assets.map((asset) => asset.uri);
}

export async function pickSinglePhoto() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("사진 접근 권한이 필요합니다.");
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });

  return result.canceled ? null : result.assets[0].uri;
}

export async function takePhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("카메라 권한이 필요합니다.");
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    quality: 0.8,
  });

  return result.canceled ? null : result.assets[0].uri;
}

export function usePhotos() {
  const [photos, setPhotos] = useState<string[]>([]);

  const add = useCallback(async () => {
    const picked = await pickPhotos(MAX_PHOTOS - photos.length);
    setPhotos((current) => [...current, ...picked].slice(0, MAX_PHOTOS));
  }, [photos.length]);

  const remove = useCallback((index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }, []);

  const move = useCallback((from: number, to: number) => {
    setPhotos((current) => {
      if (to < 0 || to >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  return { photos, add, remove, move };
}
