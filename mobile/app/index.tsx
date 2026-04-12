import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white items-center justify-center px-6">
      <Text className="text-3xl font-bold text-orange-500 mb-2">GrabEat</Text>
      <Text className="text-gray-500 mb-10 text-center">
        Scan your table QR code to start ordering
      </Text>
      <TouchableOpacity
        className="bg-orange-500 w-full py-4 rounded-2xl items-center"
        onPress={() => router.push('/scan')}
      >
        <Text className="text-white font-semibold text-lg">Scan QR Code</Text>
      </TouchableOpacity>
    </View>
  );
}
