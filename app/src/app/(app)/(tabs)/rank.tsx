import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RankScreen() {
  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-3xl font-bold">Rank</Text>
      </View>
    </SafeAreaView>
  );
}
