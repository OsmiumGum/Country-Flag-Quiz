# Google AdSense Setup Guide for Flag Quiz Game

## Overview
The flag quiz game now includes Google AdSense ad placements in the statistics modal. The ads are positioned in whitespace areas and won't interfere with buttons, text, or the user experience.

## Ad Placement Locations
1. **Banner Ad** - Between simple stats and "Show Detailed Statistics" button
2. **Rectangle Ad** - At the top of the detailed statistics section
3. **Small Banner** - Between sort controls and flags list
4. **Bottom Banner** - At the bottom of the flags list (only when flags are shown)

## Setup Steps

### 1. Get Google AdSense Account
1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign up for an account (if you don't have one)
3. Wait for approval (can take a few days to weeks)

### 2. Get Your Publisher ID
Once approved, you'll get a Publisher ID that looks like: `ca-pub-1234567890123456`

### 3. Create Ad Units
In your AdSense dashboard, create these ad units:

**Ad Unit 1: Modal Banner**
- Type: Display ad
- Size: Responsive
- Name: "Flag Quiz Modal Banner"

**Ad Unit 2: Modal Rectangle** 
- Type: Display ad
- Size: Rectangle (300×250) or Responsive
- Name: "Flag Quiz Modal Rectangle"

**Ad Unit 3: Small Banner**
- Type: Display ad  
- Size: Fluid/Responsive
- Name: "Flag Quiz Small Banner"

**Ad Unit 4: Bottom Banner**
- Type: Display ad
- Size: Responsive 
- Name: "Flag Quiz Bottom Banner"

### 4. Update the Code
Replace the placeholder values in two files:

#### In `index.html` (line 11):
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR-PUBLISHER-ID-HERE" crossorigin="anonymous"></script>
```

#### In `user-manager.js` (lines with ad units):
Replace these values with your actual ad unit IDs:
- `ca-pub-XXXXXXXXXXXXXXXXX` → Your Publisher ID
- `1234567890` → Your first ad unit ID  
- `1234567891` → Your second ad unit ID
- `1234567892` → Your third ad unit ID
- `1234567893` → Your fourth ad unit ID

## Example Replacement

**Before:**
```html
data-ad-client="ca-pub-XXXXXXXXXXXXXXXXX"
data-ad-slot="1234567890"
```

**After:**
```html
data-ad-client="ca-pub-1234567890123456"
data-ad-slot="9876543210"
```

## Testing
1. Google AdSense can take a few hours to start showing ads
2. Use different devices/browsers to test
3. Ads may not show during development (localhost)
4. Consider using AdSense's test mode first

## Ad Policy Compliance
Make sure your site follows [Google AdSense policies](https://support.google.com/adsense/answer/48182):
- Quality content
- Valid traffic only
- No click manipulation
- Proper ad placement (which is already handled)

## Revenue Expectations
- Revenue depends on traffic, geography, and niche
- Geography/educational games typically have moderate CPM
- Mobile vs desktop performance may vary

## Notes
- The ads are already positioned to not interfere with UI elements
- They're responsive and work on mobile devices  
- Loading states are handled automatically
- All ads are clearly contained within designated areas
- The JavaScript handles dynamic loading when the modal opens

## Support
If you need help with AdSense setup, check:
- [Google AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Community Forums](https://support.google.com/adsense/community)