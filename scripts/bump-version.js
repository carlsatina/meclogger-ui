#!/usr/bin/env node
/**
 * Bump app version across web (package.json/lockfile) and Android (versionCode/versionName).
 * Usage: node scripts/bump-version.js 1.0.5
 */

const fs = require('fs')
const path = require('path')

const version = process.argv[2]
const semverRegex = /^(\d+)\.(\d+)\.(\d+)$/

if (!version || !semverRegex.test(version)) {
    console.error('Usage: node scripts/bump-version.js <major.minor.patch>')
    process.exit(1)
}

const [, majorStr, minorStr, patchStr] = version.match(semverRegex)
const major = Number(majorStr)
const minor = Number(minorStr)
const patch = Number(patchStr)

// Simple versionCode strategy: M * 10000 + m * 100 + p (e.g., 1.0.5 -> 10005)
const versionCode = major * 10000 + minor * 100 + patch

const ensureInt = (value, label) => {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${label} must be a positive integer`)
    }
}

ensureInt(versionCode, 'versionCode')

const updateJsonFile = (filePath, updater) => {
    const fullPath = path.resolve(filePath)
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'))
    const updated = updater(data)
    fs.writeFileSync(fullPath, JSON.stringify(updated, null, 2) + '\n')
    console.log(`Updated ${filePath}`)
}

const updateTextFile = (filePath, replacer) => {
    const fullPath = path.resolve(filePath)
    const data = fs.readFileSync(fullPath, 'utf8')
    const updated = replacer(data)
    fs.writeFileSync(fullPath, updated)
    console.log(`Updated ${filePath}`)
}

try {
    // package.json
    updateJsonFile('./package.json', (pkg) => {
        return { ...pkg, version }
    })

    // package-lock.json
    updateJsonFile('./package-lock.json', (lock) => {
        lock.version = version
        if (lock.packages && lock.packages['']) {
            lock.packages[''].version = version
        }
        return lock
    })

    // Android build.gradle
    updateTextFile('./android/app/build.gradle', (content) => {
        let next = content.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`)
        next = next.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`)
        return next
    })

    console.log(`Bumped version to ${version} (versionCode ${versionCode})`)
    console.log('Remember to run: npx cap sync android')
} catch (err) {
    console.error(err.message || err)
    process.exit(1)
}
