/**
 * Assemble a portable folder from the Tauri build output.
 *
 * Run after `tauri build`:
 *   npm run dist:portable
 *
 * Output: release/NSCB Desktop/
 */
import { cpSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const PRODUCT_NAME = 'NSCB Desktop';
const RELEASE_DIR = 'release';
const OUT = join(RELEASE_DIR, PRODUCT_NAME);
const TARGET_DIR = join('src-tauri', 'target', 'release');

const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';

console.log(`Assembling portable folder (${process.platform})...`);

if (existsSync(OUT)) {
    rmSync(OUT, { recursive: true });
}
mkdirSync(OUT, { recursive: true });

let exeName;

if (isWindows) {
    const exeCandidates = [
        `${PRODUCT_NAME}.exe`,
        `${PRODUCT_NAME.toLowerCase().replace(/\s+/g, '-')}.exe`,
    ];
    exeName = exeCandidates.find(name => existsSync(join(TARGET_DIR, name)));
    if (!exeName) {
        exeName = readdirSync(TARGET_DIR).find(name => name.toLowerCase().endsWith('.exe'));
    }
    if (!exeName) {
        console.error(`ERROR: no .exe found in ${TARGET_DIR}. Did the build succeed?`);
        process.exit(1);
    }
} else {
    // Linux / macOS: binary has no extension
    const binCandidates = [
        PRODUCT_NAME.toLowerCase().replace(/\s+/g, '-'),
        PRODUCT_NAME,
    ];
    exeName = binCandidates.find(name => existsSync(join(TARGET_DIR, name)));
    if (!exeName) {
        // Fallback: find any executable-looking file (not .d, .rlib, etc.)
        exeName = readdirSync(TARGET_DIR).find(name => {
            if (name.includes('.')) return false;
            try { return statSync(join(TARGET_DIR, name)).isFile(); }
            catch { return false; }
        });
    }
    if (!exeName) {
        console.error(`ERROR: no binary found in ${TARGET_DIR}. Did the build succeed?`);
        process.exit(1);
    }
}

const exeSrc = join(TARGET_DIR, exeName);
cpSync(exeSrc, join(OUT, exeName));
console.log(`  ${exeName}`);

console.log(`\nPortable folder ready: ${OUT}/`);
console.log('Zip this folder to distribute.');
