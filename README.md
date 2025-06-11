# What the Imperial Units

> I have no idea what a gallon is, nor a pint, nor a foot, nor a yard. I am not even sure what a mile is.

Please use this converter to convert between metric system and imperial system / customary units.

## Features

- **Multi-category conversions**: Length, weight, volume, area, speed, and temperature
- **Real-time conversion**: Automatic conversion as you type
- **Smart unit suggestions**: Automatic pairing of related units
- **Multi-language support**: Available in 10 languages
- **URL bookmarking**: Save and share specific conversions via URL parameters
- **Responsive design**: Works on desktop and mobile devices

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
```
?c=len&m=m&i=ft&v=10&u=m
```

**Weight conversion (150 pounds to kilograms) in Spanish:**
```
?c=wgt&m=kg&i=lb&v=150&u=i&lang=es
```

**Volume conversion (20 liters to gallons) in Chinese:**
```
?c=vol&m=l&i=gal&v=20&u=m&lang=zh
```

**Temperature conversion (25 Celsius to Fahrenheit):**
```
?c=tmp&m=c&i=f&v=25&u=m
```

**Speed conversion (60 mph to km/h):**
```
?c=spd&m=kmh&i=mph&v=60&u=i
```

### Element IDs for Automation

All interactive elements have unique IDs for automation and testing:

- **Tab buttons**: `tab-{category}` (e.g., `tab-length`, `tab-weight`)
- **Input fields**: `metric-input-{category}` and `imperial-input-{category}`
- **Unit selectors**: `metric-select-{category}` and `imperial-select-{category}`
- **Unit options**: `{selector-id}-{unit}` (e.g., `metric-select-length-meters`)

### Available Units by Category

**Length**: centimeters, meters, kilometers, inch, foot, yard, mile  
**Weight**: grams, kilograms, ounce, pound  
**Volume**: liters, milliliters, gallon, fluid_ounce, pint, quart  
**Area**: square_meters, hectares, square_kilometers, square_feet, acres, square_miles  
**Speed**: kilometers_per_hour, meters_per_second, miles_per_hour, feet_per_second, knots  
**Temperature**: celsius, fahrenheit

## Acknowledgments

Claude, ChatGPT, and DeepSeek almost entirely write the code of this project, and even this README file.
