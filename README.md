# GoLink Chrome Extension

A Chrome extension that automatically redirects go links to their configured destinations.

## Overview

This extension intercepts navigation to URLs matching the pattern `go/[a-zA-Z_-]+` and redirects them to their configured target URLs by fetching from a local golink service.

## Features

- **Dynamic GoLink Support**: Works with any golink following the pattern `go/[a-zA-Z_-]+`
- **Automatic Redirection**: Seamlessly redirects golinks to their target URLs
- **Fallback Handling**: Redirects to Google search if golink resolution fails
- **Local Service Integration**: Connects to a local golink service running on `localhost:3030`

## Supported GoLink Patterns

The extension supports golinks with the following pattern:
- `go/hello`
- `go/docs`
- `go/team-wiki`
- `go/bug_tracker`
- `go/my-project`

Pattern: `go/[a-zA-Z_-]+`

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and ready to use

## Prerequisites

This extension requires a local golink service running on `http://localhost:3030` that:
- Accepts GET requests to `/golinks/go/{golinkName}`
- Returns JSON responses with a `url` field containing the target URL

Example API response:
```json
{
  "url": "https://example.com/target-page"
}
```

## How It Works

1. When you navigate to a URL containing a golink pattern (e.g., `go/hello`)
2. The extension intercepts the navigation request
3. It extracts the golink name from the URL
4. Makes a request to the local golink service at `http://localhost:3030/golinks/go/{golinkName}`
5. If successful, redirects to the returned URL
6. If unsuccessful, redirects to Google search as a fallback

## Permissions

The extension requires the following permissions:
- `webNavigation`: To intercept navigation events
- `tabs`: To update tab URLs
- `storage`: For potential future configuration storage
- `activeTab`: To interact with the current tab
- `host_permissions`: To access all URLs for golink detection

## Development

The main logic is contained in `background.js`, which uses Chrome's `webNavigation.onBeforeNavigate` API to intercept and redirect golink requests.

## License

This project is open source. Feel free to contribute or modify as needed.