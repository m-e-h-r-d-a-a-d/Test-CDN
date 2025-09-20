# Test Assets for CDN Testing

This directory contains various test files for CDN performance and feature testing.

## Directory Structure

```
assets/
├── images/           # Test images of various sizes
├── files/            # Test documents and archives
├── videos/           # Test video files
└── README.md         # This file
```

## Adding Test Files

To make this CDN test website fully functional, add the following files:

### Images (`assets/images/`)
- `small-image-1.jpg` (< 50KB)
- `small-image-2.jpg` (< 50KB) 
- `medium-image-1.jpg` (50KB - 500KB)
- `medium-image-2.jpg` (50KB - 500KB)
- `large-image-1.jpg` (> 500KB)
- `large-image-2.jpg` (> 500KB)
- `responsive-small.jpg` (400px wide)
- `responsive-medium.jpg` (800px wide)
- `responsive-large.jpg` (1200px wide)

### Files (`assets/files/`)
- `small-document.pdf` (~100KB)
- `medium-document.pdf` (~1MB)
- `large-document.pdf` (~5MB)
- `small-archive.zip` (~500KB)
- `medium-archive.zip` (~5MB)
- `large-archive.zip` (~25MB)

### Videos (`assets/videos/`)
- `small-video.mp4` (~2MB)
- `medium-video.mp4` (~10MB)
- `large-video.mp4` (~50MB)

## Creating Placeholder Files

You can create placeholder files using these commands:

```bash
# Create image placeholders (replace with real images)
mkdir -p assets/images
for size in small medium large; do
  for i in 1 2; do
    echo "Placeholder ${size} image ${i}" > "assets/images/${size}-image-${i}.jpg"
  done
done

# Create file placeholders
mkdir -p assets/files
echo "Small PDF content" > assets/files/small-document.pdf
echo "Medium PDF content" > assets/files/medium-document.pdf
echo "Large PDF content" > assets/files/large-document.pdf

# Create video placeholders
mkdir -p assets/videos
echo "Small video content" > assets/videos/small-video.mp4
echo "Medium video content" > assets/videos/medium-video.mp4
echo "Large video content" > assets/videos/large-video.mp4
```

## CDN Testing

These files are used to test:
- **Caching**: Different cache headers and TTL settings
- **Compression**: Gzip/Brotli compression effectiveness
- **Image Optimization**: WebP conversion, resizing
- **Performance**: Load times, bandwidth usage
- **Geographic Distribution**: Edge server performance
