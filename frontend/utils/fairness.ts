export const BIN_MULTIPLIERS = [
  10, 5, 2.5, 1.2, 0.5, 0.2, 0.2, 0.2, 0.5, 1.2, 2.5, 5, 10
];

export async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export type FairResult = {
    path: ('L'|'R')[];
    finalBin: number;
    payout: number;
    hashHex: string;
    combinedSeed: string;
}

export async function generatePlinkoResult(serverSeed: string, clientSeed: string, nonce: number, dropColumn: number): Promise<FairResult> {
    const combinedSeed = `${serverSeed}:${clientSeed}:${nonce}`;
    const hashHex = await sha256(combinedSeed);
    
    // We need 12 decisions for 12 rows.
    const path: ('L'|'R')[] = [];
    let currentPos = dropColumn;
    
    for (let i = 0; i < 12; i++) {
        // Take 2 hex characters per row (1 byte)
        const byteVal = parseInt(hashHex.substring(i*2, i*2+2), 16);
        
        // Parity determines direction: Even = Left, Odd = Right
        const intendedDir = byteVal % 2 === 0 ? 'L' : 'R';
        
        // Enforce boundary physics (deterministic wall bouncing)
        let actualDir: 'L' | 'R' = intendedDir;
        if (currentPos <= 0) actualDir = 'R';
        else if (currentPos >= 12) actualDir = 'L';
        
        path.push(actualDir);
        currentPos += (actualDir === 'R' ? 0.5 : -0.5);
    }
    
    const finalBin = Math.max(0, Math.min(12, Math.round(currentPos)));
    const payout = BIN_MULTIPLIERS[finalBin] || 0.2;
    
    return {
        path,
        finalBin,
        payout,
        hashHex,
        combinedSeed
    };
}