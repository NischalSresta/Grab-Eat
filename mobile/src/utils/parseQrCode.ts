export interface QrPayload {
  restaurantId: number;
  tableId: number;
}

export function parseQrCode(data: string): QrPayload | null {
  try {
    // Expected format: grabeat://restaurant/{restaurantId}/table/{tableId}
    const match = data.match(/grabeat:\/\/restaurant\/(\d+)\/table\/(\d+)/);
    if (!match) return null;
    return {
      restaurantId: parseInt(match[1], 10),
      tableId: parseInt(match[2], 10),
    };
  } catch {
    return null;
  }
}
