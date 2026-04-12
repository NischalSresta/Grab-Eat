import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useCameraPermission } from '../src/hooks/useCameraPermission';

export default function ScanScreen() {
  const router = useRouter();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [scanned, setScanned] = useState(false);

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <Text className="text-gray-500">Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.center}>
        <Text className="text-gray-700 text-center mb-4">
          Camera access is required to scan QR codes
        </Text>
        <TouchableOpacity
          className="bg-orange-500 px-6 py-3 rounded-xl"
          onPress={requestPermission}
        >
          <Text className="text-white font-semibold">Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : ({ data }) => {
          setScanned(true);
          handleScan(data);
        }}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View className="absolute top-12 left-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-white text-lg font-semibold">← Back</Text>
        </TouchableOpacity>
      </View>
      <View className="absolute bottom-10 w-full items-center">
        <Text className="text-white text-sm opacity-80">
          Point your camera at the table QR code
        </Text>
      </View>
    </View>
  );

  function handleScan(data: string) {
    router.push({ pathname: '/menu', params: { qr: data } });
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
});
