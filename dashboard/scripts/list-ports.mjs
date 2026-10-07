import { SerialPort } from 'serialport';

const ports = await SerialPort.list();

if (ports.length === 0) {
  console.log('\n❌ No serial ports detected.');
  console.log('   • Is the ESP32 plugged in?');
  console.log('   • Did you install the USB driver (CP2102 or CH340)?\n');
  process.exit(0);
}

console.log('\n📡 Available Serial Ports:\n');
ports.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.path}`);
  console.log(`     Manufacturer: ${p.manufacturer ?? 'unknown'}`);
  console.log(`     Serial:       ${p.serialNumber ?? 'unknown'}`);
  console.log('');
});

console.log('👉 Copy the port path into your .env.local as BRIDGE_COM_PORT\n');