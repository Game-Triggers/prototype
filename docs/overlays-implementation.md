# Overlay Implementation Guide for Gametriggers

This document provides comprehensive documentation on how overlays work within the Gametriggers platform, including implementation details and integration guides for streamers.

## Overview

Overlays are a crucial component of the Gametriggers platform that enable sponsors' ads and branding to be displayed during a streamer's live broadcast. These are delivered through browser sources in streaming software (primarily OBS Studio and Streamlabs OBS).

## Technical Architecture

### Components

1. **Browser Source Endpoint**: A dedicated URL that streamers add to their streaming software
2. **WebSocket Connection**: Real-time communication channel for triggering ad displays
3. **Campaign Management System**: Backend service managing when and which ads should display
4. **Ad Display Controller**: Frontend JavaScript for controlling animations and timing
5. **Analytics Tracking**: Records impressions and viewer counts during ad displays

### Flow Diagram

```
Streamer OBS/Streamlabs → Browser Source → WebSocket Connection → Ad Display
                                             ↑
                    Campaign Management System ← Scheduled Campaigns
                                             ↓
                                       Analytics System
```

## Integration Process for Streamers

### Step 1: Generate Unique Overlay URL

1. Log into the Gametriggers dashboard
2. Navigate to Settings → Stream Integration
3. Click "Generate Overlay URL" (unique to each streamer)
4. Copy the generated URL (format: `https://[domain]/api/overlay/[streamer-unique-id]`)

### Step 2: Add Browser Source in Streaming Software

#### For OBS Studio:

1. Open OBS Studio
2. Add a new "Browser" source to your scene
3. Set the URL to your generated overlay URL
4. Recommended settings:
   - Width: 1920px (or your stream resolution width)
   - Height: 1080px (or your stream resolution height)
   - Enable "Refresh browser when scene becomes active"
   - Disable "Control audio via OBS"

#### For Streamlabs OBS:

1. Open Streamlabs OBS
2. Navigate to the Sources panel
3. Click the "+" icon and select "Browser Source"
4. Set the URL to your generated overlay URL
5. Use the same recommended settings as OBS Studio

### Step 3: Position the Overlay

1. Position the browser source at the top layer in your scene
2. The overlay has transparent background by default
3. Ads will appear according to campaign settings in predefined screen positions

## Ad Display Types

### 1. Banner Overlays

- **Description**: Static or animated images appearing in predefined screen areas
- **Default Positions**: Top, Bottom, Left, Right, or Corner positions
- **Format**: PNG or GIF with transparency support
- **Dimensions**: Various sizes depending on position (e.g., 1200×200px for top/bottom)

### 2. Animated Overlays

- **Description**: CSS/JavaScript animations that introduce more dynamic brand presence
- **Animations**: Fade, Slide, Bounce, etc.
- **Customization**: Speed, duration, and entrance/exit effects

### 3. Full Screen Takeovers

- **Description**: Brief full-screen brand displays (typically 3-5 seconds)
- **Usage**: Typically used at stream start/end or during major breaks
- **Format**: Video or advanced animations

### 4. Interactive Elements

- **Description**: Clickable elements that viewers can interact with
- **Usage**: Polls, giveaways, or special offers
- **Integration**: Uses Twitch/YouTube interactive extensions when available

## Campaign Rules and Ad Delivery

### Ad Scheduling

- **Campaign Start/End**: Ads only display during active campaign periods
- **Frequency Caps**: Limits on how often ads appear (e.g., max 2 displays per hour)
- **Stream Status**: Ads only appear when stream is live with minimum viewer count
- **Cooldown Periods**: Minimum time between ad displays

### Triggering Mechanisms

1. **Time-Based**: Automatic display at set intervals
2. **Event-Based**: Triggered by stream events (game win, subscriber, etc.)
3. **Manual**: Streamer-initiated via dashboard controls
4. **API-Triggered**: External system activation

## Implementation Details

### WebSocket API

The overlay connects to our WebSocket server to receive real-time ad display instructions:

```javascript
const socket = new WebSocket('wss://[domain]/api/overlay-socket/[streamer-id]');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'display-ad') {
    displayOverlay(data.adData);
  }
};
```

### Ad Display Controller

Each overlay contains a JavaScript controller that manages:

- Ad positioning and layout
- Animation timing
- Viewer analytics tracking
- Error handling and fallbacks

### Security Measures

- **Authentication**: Each overlay URL contains a unique identifier
- **Domain Restrictions**: URLs can be restricted to specific domains
- **Rate Limiting**: Protection against excessive requests
- **Content Verification**: Ads are verified before delivery

## Analytics and Reporting

### Metrics Tracked

- **Impressions**: Number of times ads were displayed
- **Viewer Count**: Number of viewers during ad display
- **Duration**: How long ads were visible
- **Engagement**: For interactive elements, click rates and interaction stats

### Reporting Dashboard

Streamers and brands can access detailed analytics through:

- Real-time dashboard showing current campaign performance
- Historical data with exportable reports
- ROI calculations based on impressions and engagement

## Customization Options

### Visual Customization

Streamers can customize certain aspects of how ads appear:

- Preferred screen positions
- Transition effects
- Border/background options
- Size adjustments (within campaign limits)

### Schedule Customization

- Blackout periods when no ads should show
- Priority settings for different campaign types
- Manual override capabilities

## Troubleshooting

### Common Issues

1. **Overlay Not Appearing**
   - Check browser source is active and URL is correct
   - Verify stream is properly detected as live
   - Check WebSocket connection status in streamer dashboard

2. **Ads Not Displaying**
   - Verify active campaigns for the streamer
   - Check minimum viewer requirements are met
   - Confirm network connectivity for the browser source

3. **Visual Glitches**
   - Refresh browser source
   - Check for conflicting browser sources or CSS
   - Verify correct resolution settings

### Support Resources

- Dashboard debug section with connection status
- Test ad display feature to verify setup
- Technical support contact for persistent issues

## Best Practices

1. Always test overlay before going live
2. Position browser source at top layer
3. Use recommended browser source settings
4. Consider ad placement when designing stream layout
5. Use blackout periods during critical stream moments

## API Reference

### Overlay Endpoint

```
GET /api/overlay/:streamerId
```

Serves the HTML/JS/CSS for the streamer's unique overlay.

### WebSocket Endpoint

```
WSS /api/overlay-socket/:streamerId
```

Provides real-time communication for ad displays.

### Testing Endpoint

```
GET /api/overlay/test/:streamerId
```

Allows manual testing of the overlay with sample ads.

## Implementation Roadmap

### Current Features

- Basic overlay system with banner ads
- WebSocket-based real-time delivery
- Simple analytics tracking

### Upcoming Features

- Enhanced interactive elements
- Multi-platform support beyond Twitch/YouTube
- Advanced animation library
- Viewer engagement optimization
- A/B testing capabilities for ad effectiveness

## Conclusion

The overlay system is designed to provide a balance between effective brand exposure and non-intrusive viewer experience. By following this implementation guide, streamers can seamlessly integrate sponsored content into their streams while maintaining control over how and when ads appear.
