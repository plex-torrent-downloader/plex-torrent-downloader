import cp from 'child_process';
import * as buffer from "buffer";

async function spawn(cmd: string, args: any[]):Promise<any> {
    let stdout = '';
    let stderr = '';
    const pc = cp.spawn(cmd, args);
    pc.stdout.on('data', (bit: buffer) => stdout += bit.toString());
    pc.stderr.on('data', (bit: buffer) => stderr += bit.toString());
    return new Promise((resolve, reject) => {
        pc.on("exit", (code: number) => {
            if (code) {
                return reject(`Process ${cmd} failed: ${stderr}`);
            }
            resolve({stdout, stderr});
        });
    })
}

export default spawn;
