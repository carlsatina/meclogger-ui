import { ref } from 'vue'
import { Device } from '@capacitor/device'

const isPlatformMobile = async () => {
    // Check if running on actual mobile device
    const device = await Device.getInfo()
    if (device.platform === 'android' || device.platform === 'ios') {
        return true;
    }
    
    // For browser testing: check screen width
    // Consider mobile if width is less than 768px (tablet breakpoint)
    if (window.innerWidth < 768) {
        return true;
    }
    
    return false;
}

export default isPlatformMobile