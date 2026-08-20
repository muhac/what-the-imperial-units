# What the Imperial Units

A modern, responsive unit converter for converting between metric and imperial/customary units with PWA support.

**🚀 [Live Demo](https://muhac.github.io/what-the-imperial-units/)**

## Table of Contents

- [What the Imperial Units](#what-the-imperial-units)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Quick Start](#quick-start)
  - [Install as App](#install-as-app)
    - [Safari (iOS/iPadOS)](#safari-iosipados)
    - [Chrome/Edge (Android/Desktop)](#chromeedge-androiddesktop)
    - [Firefox (Android/Desktop)](#firefox-androiddesktop)
  - [URL Parameters for Deep Linking](#url-parameters-for-deep-linking)
    - [Parameters](#parameters)
    - [Examples](#examples)
    - [Element IDs for Automation](#element-ids-for-automation)
    - [Available Units by Category](#available-units-by-category)
  - [Development](#development)
  - [Acknowledgments](#acknowledgments)

## Features

- **Multi-category conversions**: Length, weight, volume, area, speed, and temperature
- **Real-time conversion**: Automatic conversion as you type
- **Smart unit suggestions**: Automatic pairing of related units
- **Multi-language support**: English, 中文 (简体), 中文 (繁體), Français, Español, Português, 日本語, 한국어, हिन्दी, Русский
- **URL bookmarking**: Save and share specific conversions via URL parameters
- **Progressive Web App**: Works offline, installable on all devices
- **Responsive design**: Works on desktop and mobile devices

## Quick Start

1. Select a category (Length, Weight, Volume, Area, Speed, or Temperature)
2. Choose your source and target units from the dropdown menus
3. Enter a value in either field - conversion happens automatically
4. Use the URL to bookmark or share specific conversions

## Install as App

### Safari (iOS/iPadOS)

You can add this app to your iOS home screen for quick access:

1. Open the app in Safari on your iPhone or iPad
2. Tap the **Share** button (square with arrow pointing up) at the bottom of the screen
3. Scroll down and tap **"Add to Home Screen"**
4. Customize the app name if desired, then tap **"Add"**

The app will appear on your home screen with its own icon and behave like a native app when launched.

### Chrome/Edge (Android/Desktop)

1. Open the app in Chrome or Edge
2. Look for the **Install** button in the address bar or menu
3. Click **Install** and confirm
4. The app will be added to your device as a standalone application

### Firefox (Android/Desktop)

1. Open the app in Firefox
2. Tap the menu button (three dots)
3. Select **"Install"** or **"Add to Home Screen"**
4. Follow the prompts to install

## URL Parameters for Deep Linking

You can create bookmarkable URLs that automatically load specific conversion configurations. The app supports the following URL parameters:

### Parameters

All parameter names and values use ultra-short forms for maximum URL compactness:

- `c` - Category (len=length, wgt=weight, vol=volume, ar=area, spd=speed, tmp=temperature)
- `m` - Metric unit (abbreviated, e.g., m=meters, kg=kilograms, l=liters)
- `i` - Imperial unit (abbreviated, e.g., ft=foot, lb=pound, gal=gallon)
- `v` - Value (single numeric value to avoid calculation conflicts)
- `u` - Value unit type (m=metric, i=imperial - indicates which unit the value belongs to)
- `lang` - Language code (en, fr, es, pt, zh, zh-TW, ja, ko, hi, ru)

### Examples

**Length conversion (10 meters to feet):**  
[`https://muhac.github.io/what-the-imperial-units/?c=len&m=m&i=ft&v=10&u=m`](https://muhac.github.io/what-the-imperial-units/?c=len&m=m&i=ft&v=10&u=m)

**Weight conversion (150 pounds to kilograms) in Spanish:**  
[`https://muhac.github.io/what-the-imperial-units/?c=wgt&m=kg&i=lb&v=150&u=i&lang=es`](https://muhac.github.io/what-the-imperial-units/?c=wgt&m=kg&i=lb&v=150&u=i&lang=es)

**Volume conversion (20 liters to gallons) in Chinese:**  
[`https://muhac.github.io/what-the-imperial-units/?c=vol&m=l&i=gal&v=20&u=m&lang=zh`](https://muhac.github.io/what-the-imperial-units/?c=vol&m=l&i=gal&v=20&u=m&lang=zh)

**Temperature conversion (25 Celsius to Fahrenheit):**  
[`https://muhac.github.io/what-the-imperial-units/?c=tmp&m=c&i=f&v=25&u=m`](https://muhac.github.io/what-the-imperial-units/?c=tmp&m=c&i=f&v=25&u=m)

**Speed conversion (60 mph to km/h):**  
[`https://muhac.github.io/what-the-imperial-units/?c=spd&m=kmh&i=mph&v=60&u=i`](https://muhac.github.io/what-the-imperial-units/?c=spd&m=kmh&i=mph&v=60&u=i)

### Element IDs for Automation

All interactive elements have unique IDs for automation and testing:

- **Tab buttons**: `tab-{category}` (e.g., `tab-length`, `tab-weight`)
- **Input fields**: `metric-input-{category}` and `imperial-input-{category}`
- **Unit selectors**: `metric-select-{category}` and `imperial-select-{category}`
- **Unit options**: `{selector-id}-{unit}` (e.g., `metric-select-length-meters`)

### Available Units by Category

**Length**: `centimeters`, `meters`, `kilometers`, `inch`, `foot`, `yard`, `mile`  
**Weight**: `grams`, `kilograms`, `ounce`, `pound`  
**Volume**: `liters`, `milliliters`, `gallon`, `fluid_ounce`, `pint`, `quart`  
**Area**: `square_meters`, `hectares`, `square_kilometers`, `square_feet`, `acres`, `square_miles`  
**Speed**: `kilometers_per_hour`, `meters_per_second`, `miles_per_hour`, `feet_per_second`, `knots`  
**Temperature**: `celsius`, `fahrenheit`

## Development

This is a React TypeScript application with PWA capabilities.

**Tech Stack:**
- React 18 with TypeScript
- CSS Grid and Flexbox for responsive layout
- Service Worker for offline functionality
- Web App Manifest for PWA features

**Local Development:**
```bash
npm install
npm start
```

**Build for Production:**
```bash
npm run build
```

## Acknowledgments

Claude, ChatGPT, and DeepSeek almost entirely write the code of this project, and even this README file.
