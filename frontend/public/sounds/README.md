# Call Ringtone Audio Files

This directory should contain the following audio files for call functionality:

## Required Files:

1. **incoming-call.mp3** - Ringtone played when receiving a call
2. **outgoing-call.mp3** - Ringtone played when making a call

## How to Add Audio Files:

### Option 1: Use Free Ringtones
Download free ringtones from:
- https://www.zedge.net/ringtones
- https://www.freesound.org/
- https://mixkit.co/free-sound-effects/phone/

### Option 2: Use Default System Sounds
You can use any MP3 files you have. Recommended duration: 3-5 seconds (will loop automatically)

### Option 3: Generate Simple Tones
Use online tools like:
- https://onlinetonegenerator.com/
- https://www.audiocheck.net/audiofrequencysignalgenerator_sinetone.php

## File Specifications:
- Format: MP3
- Duration: 3-5 seconds (loops automatically)
- Sample Rate: 44.1kHz or 48kHz
- Bitrate: 128kbps or higher

## Quick Setup:
1. Download or create two MP3 files
2. Rename them to `incoming-call.mp3` and `outgoing-call.mp3`
3. Place them in this directory (`frontend/public/sounds/`)
4. Restart your development server

The application will automatically use these files for call notifications.
