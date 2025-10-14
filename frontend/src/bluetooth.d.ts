// Minimal TypeScript declarations for Web Bluetooth Scanning API
// These are intentionally lightweight to enable compilation in environments
// where lib.dom.d.ts does not yet include the scanning types.

interface BluetoothLEScan {
  active: boolean;
  stop(): void;
}

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
  manufacturerData?: number[];
}

interface RequestLEScanOptions {
  filters?: BluetoothLEScanFilter[];
  keepRepeatedDevices?: boolean;
  acceptAllAdvertisements?: boolean;
}

interface BluetoothAdvertisingEvent extends Event {
  device: BluetoothDevice;
  rssi?: number;
  txPower?: number;
  name?: string | null;
  uuids?: string[];
  manufacturerData: Map<number, DataView>;
  serviceData: Map<string, DataView>;
}

interface Bluetooth extends EventTarget {
  requestLEScan(options?: RequestLEScanOptions): Promise<BluetoothLEScan>;
  addEventListener(
    type: 'advertisementreceived',
    listener: (this: Bluetooth, ev: BluetoothAdvertisingEvent) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: 'advertisementreceived',
    listener: (this: Bluetooth, ev: BluetoothAdvertisingEvent) => any,
    options?: boolean | EventListenerOptions
  ): void;
}

interface Navigator {
  bluetooth: Bluetooth;
}


