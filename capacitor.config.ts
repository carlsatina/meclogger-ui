import { CapacitorConfig } from '@capacitor/cli';
import * as dotenv from 'dotenv';

const config: CapacitorConfig = {
    appId: 'com.arshii.meclogger',
    appName: 'Meclogger',
    webDir: 'dist',
    // server: {
    //     url: '192.168.2.195:8080',
    //     cleartext: true
    // },
    plugins: {
    },
};

export default config;
