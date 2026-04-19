import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);

      // QR codes contain either just the token or a URL like /order?table=TOKEN
      let token = data.trim();
      const match = token.match(/[?&]table=([^&]+)/);
      if (match) token = match[1];

      if (!token) {
        Alert.alert('Invalid QR', 'This QR code does not contain a valid table token.', [
          { text: 'Try Again', onPress: () => setScanned(false) },
        ]);
        return;
      }

      router.replace({ pathname: '/order-from-table', params: { token } });
    },
    [scanned, router]
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.icon}>📷</Text>
        <Text style={styles.msg}>Camera access is needed to scan table QR codes.</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: '#9ca3af', fontSize: 14 }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 16 }}>✕ Cancel</Text>
        </TouchableOpacity>

        <View style={styles.frame}>
          <View style={[styles.corner, { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.corner, { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 }]} />
          <View style={[styles.corner, { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 }]} />
          <View style={[styles.corner, { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 }]} />
        </View>

        <Text style={styles.hint}>Point camera at the table QR code</Text>

        {scanned && (
          <TouchableOpacity style={styles.btn} onPress={() => setScanned(false)}>
            <Text style={styles.btnText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  msg: { fontSize: 15, color: '#374151', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  btn: { backgroundColor: '#f97316', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overlay: { flex: 1, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', margin: 16, padding: 8 },
  frame: {
    width: 240,
    height: 240,
    marginTop: 'auto',
    marginBottom: 'auto',
    position: 'relative',
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#f97316' },
  hint: { color: '#fff', fontSize: 14, marginTop: 24, marginBottom: 32, opacity: 0.9 },
});
