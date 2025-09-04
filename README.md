# Earth Globe Web Component

An interactive 3D Earth that you can embed anywhere using a simple `<earth-globe>` custom HTML tag.

## Live Demo
Check it out here: [https://shin-noda.github.io/earth-global/](https://shin-noda.github.io/earth-globe/)

## Features
- Fully interactive 3D globe.
- Drag to rotate, scroll to zoom.
- Responsive by default, or use custom size and position.
- Lightweight and easy to embed.
- Uses Earth texture from [Solar System Scope](https://www.solarsystemscope.com/textures/?utm_source=chatgpt.com).

## Installation

Include the script in your HTML `<head>`:
```
<head>
  <script src="https://shin-noda.github.io/earth-global/earth-globe.js" defer></script>
</head>
```

## Usage
### Minimal Example
```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Example earth-globe tag</title>
    <script src="https://shin-noda.github.io/earth-global/earth-globe.js" defer></script>
  </head>
  <body>
    <h1>Example earth-globe tag</h1>
    <earth-globe></earth-globe>
  </body>
</html>
```

### Default (responsive fullscreen)
```
<earth-globe></earth-globe>
```

### Custom size
```
<earth-globe width="200px" height="200px"></earth-globe>
```

### Custom position
```
<earth-globe position-x="100" position-y="200"></earth-globe>
```

### Custom size + position
```
<earth-globe 
  width="400px" 
  height="400px" 
  position-x="100" 
  position-y="100"></earth-globe>
```

## License
MIT License
