# **Project Requirements Document: Gametriggers MVP**

The following table outlines the **minimum viable product** (MVP) functional requirements for the Gametriggers platform.

| Requirement ID | Description | User Story | Expected Behavior/Outcome |
| --- | --- | --- | --- |
| FR001 | Streamer Sign-Up & Authentication | As a streamer, I want to sign up and log in using my Twitch or YouTube account so I can access the platform. | The system should support OAuth authentication via Twitch/YouTube using NextAuth. Upon login, streamers are taken to their dashboard. |
| FR002 | Brand Registration & Login | As a brand, I want to sign up and access a dashboard so I can launch campaigns. | The platform should allow email-based registration/login for brands and redirect to their campaign dashboard post-login. |
| FR003 | Create Basic Campaign | As a brand, I want to create a campaign with basic targeting and media upload so I can start sponsorships. | Brands can create a campaign by adding a title, budget, media (image/video), and optionally select categories or language preferences. |
| FR004 | Streamer Browsing & Opt-in | As a streamer, I want to view available campaigns and opt into the ones I like. | A simple list of active campaigns should be shown. Streamers can click "Join" to opt into a campaign. |
| FR005 | Overlay Delivery via Browser Link | As a system, I want to generate a browser source link for each joined campaign so overlays can be displayed. | When a streamer joins a campaign, the system creates a personalized link to load the ad asset(s) via OBS/Streamlabs browser source. |
| FR006 | Real-Time Overlay Rendering | As a viewer, I want to see sponsored overlays on the stream when a streamer is active in a campaign. | Overlay content should display dynamically when the browser source link is active in the streamer's OBS/Streamlabs scene. |
| FR007 | Campaign Performance Metrics | As a brand, I want to see how many impressions or clicks my campaign has gotten so I can measure success. | A basic analytics dashboard should show impressions (views) and engagement (clicks) for each campaign. |
| FR008 | Payout Estimation for Streamers | As a streamer, I want to see how much I’ve earned so far from the campaigns I joined. | Streamers should see estimated earnings (e.g. based on CPM or fixed fee per stream). No actual payout integration required in MVP. |
| FR009 | Simple Admin Interface (Optional) | As an admin, I want to manage users and campaigns for moderation and debugging. | Admins can view all campaigns, user details, and optionally moderate or deactivate content. |