import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export const MAX_PHOTOS = 6;

export async function pickPhotos(remaining: number) {
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

  return result.canceled ? [] : result.assets;
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

  return result.canceled ? null : result.assets[0];
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

  return result.canceled ? null : result.assets[0];
}
