import { exec as cpExec } from 'child_process';
import { promisify } from 'util';

export interface HardwareAcceleration {
    decoder: string;
    encoder: string;
    hwaccel?: string;
    hwaccelDevice?: string;
    pixelFormat?: string;
}

export async function checkFFmpeg(): Promise<boolean> {
    const exec = promisify(cpExec);
    try {
        await exec('which ffmpeg');
        return true;
    } catch (error) {
        return false;
    }
}

export async function detectHardwareAcceleration(): Promise<HardwareAcceleration | null> {
    const exec = promisify(cpExec);

    try {
        const [encodersResult, hwaccelsResult, devicesResult] = await Promise.all([
            exec('ffmpeg -encoders 2>/dev/null | grep -E "(nvenc|qsv|videotoolbox|vaapi|amf)"').catch(() => ({ stdout: '' })),
            exec('ffmpeg -hwaccels 2>/dev/null').catch(() => ({ stdout: '' })),
            exec('ffmpeg -init_hw_device list 2>&1 | grep -E "(vaapi|cuda|qsv|videotoolbox|d3d11va)"').catch(() => ({ stdout: '' }))
        ]);

        const encoders = encodersResult.stdout;
        const hwaccels = hwaccelsResult.stdout;
        const devices = devicesResult.stdout;

        console.log('Available encoders:', encoders.split('\n').filter(line => line.trim()));
        console.log('Available hwaccels:', hwaccels.split('\n').filter(line => line.trim()));
        console.log('Available devices:', devices.split('\n').filter(line => line.trim()));

        // VAAPI (Linux - Intel/AMD)
        if (encoders.includes('h264_vaapi') && hwaccels.includes('vaapi')) {
            try {
                await exec('ffmpeg -init_hw_device vaapi=vaapi0:/dev/dri/renderD128 -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_vaapi -f null - 2>/dev/null');
                console.log('VAAPI acceleration available and working');
                return {
                    decoder: 'h264',
                    encoder: 'h264_vaapi',
                    hwaccel: 'vaapi',
                    hwaccelDevice: '/dev/dri/renderD128',
                    pixelFormat: 'vaapi'
                };
            } catch (error) {
                console.log('VAAPI test failed:', error);
            }
        }

        // NVENC (NVIDIA)
        if (encoders.includes('h264_nvenc') && hwaccels.includes('cuda')) {
            try {
                await exec('ffmpeg -init_hw_device cuda=cuda0 -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_nvenc -f null - 2>/dev/null');
                console.log('NVENC acceleration available and working');
                return {
                    decoder: 'h264_cuvid',
                    encoder: 'h264_nvenc',
                    hwaccel: 'cuda',
                    pixelFormat: 'yuv420p'
                };
            } catch (error) {
                console.log('NVENC test failed:', error);
            }
        }

        // QSV (Intel Quick Sync)
        if (encoders.includes('h264_qsv') && hwaccels.includes('qsv')) {
            try {
                await exec('ffmpeg -init_hw_device qsv=qsv0 -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_qsv -f null - 2>/dev/null');
                console.log('QSV acceleration available and working');
                return {
                    decoder: 'h264_qsv',
                    encoder: 'h264_qsv',
                    hwaccel: 'qsv',
                    pixelFormat: 'nv12'
                };
            } catch (error) {
                console.log('QSV test failed:', error);
            }
        }

        // VideoToolbox (macOS)
        if (encoders.includes('h264_videotoolbox') && hwaccels.includes('videotoolbox')) {
            try {
                await exec('ffmpeg -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_videotoolbox -f null - 2>/dev/null');
                console.log('VideoToolbox acceleration available and working');
                return {
                    decoder: 'h264',
                    encoder: 'h264_videotoolbox',
                    hwaccel: 'videotoolbox',
                    pixelFormat: 'videotoolbox_vld'
                };
            } catch (error) {
                console.log('VideoToolbox test failed:', error);
            }
        }

        // AMF (AMD)
        if (encoders.includes('h264_amf') && hwaccels.includes('d3d11va')) {
            try {
                await exec('ffmpeg -init_hw_device d3d11va=d3d11va0 -f lavfi -i testsrc2=duration=1:size=320x240:rate=1 -t 1 -c:v h264_amf -f null - 2>/dev/null');
                console.log('AMF acceleration available and working');
                return {
                    decoder: 'h264',
                    encoder: 'h264_amf',
                    hwaccel: 'd3d11va',
                    pixelFormat: 'nv12'
                };
            } catch (error) {
                console.log('AMF test failed:', error);
            }
        }

        console.log('No working hardware acceleration found, falling back to software encoding');
        return null;

    } catch (error) {
        console.log('Hardware acceleration detection failed completely:', error);
        return null;
    }
}

let hwAccelCache: HardwareAcceleration | null | undefined = undefined;

export async function getHardwareAcceleration(): Promise<HardwareAcceleration | null> {
    if (hwAccelCache === undefined) {
        hwAccelCache = await detectHardwareAcceleration();
        if (hwAccelCache) {
            console.log('Hardware acceleration enabled:', hwAccelCache.encoder);
        } else {
            console.log('Using software encoding (no hardware acceleration available)');
        }
    }
    return hwAccelCache;
}