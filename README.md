# Ringer Device — WxCC Desktop Second Ringer

A Webex Contact Center (WxCC) Agent Desktop header widget that plays a ringtone on an **audio device of the agent's choosing** whenever a contact or consult is offered. Agents who wear a headset can have incoming calls also ring out loud on their laptop or desk speakers, so they don't miss a call while the headset is off.

<!-- Optional: add a screenshot, e.g. ![Ringing Device panel](screenshot.png) -->

## What it does

- Adds a **Ringing Device** button to the desktop header. A dot on the button shows whether it's on (green) or off (grey).
- Clicking the button opens a small settings panel:
  - **On/off switch.** Turns the extra ringer on or off.
  - **Ring on this device.** A dropdown of every audio output the browser can see (speakers, headsets, monitors, etc.), with a **Save** button. The button turns blue while there's an unsaved change and shows a green check once it's saved.
  - **Test ring.** Plays the ringtone on the selected device so the agent can confirm they can hear it. Click again to stop.
- **Settings are remembered** per browser. The on/off state and the chosen device are stored in `localStorage`, so they survive reloads and sign-outs.
- **Follows the desktop's light/dark theme.**
- **Keeps the device list current.** It refreshes when devices are plugged in or unplugged. If the saved device disappears, it falls back to the system default.

### When it rings

The ringtone loops until the offer is answered or goes away:

| Desktop event | Ringer |
|---------------|--------|
| Contact offered (`eAgentOfferContact`) | Starts ringing |
| Consult offered (`eAgentOfferConsult`) | Starts ringing |
| Contact accepted (`eAgentContactAssigned`) | Stops |
| Consult accepted (`eAgentConsulting`) | Stops |
| Contact ended / abandoned (`eAgentContactEnded`) | Stops |
| Ring-no-answer timeout (`eAgentOfferContactRona`) | Stops |

## How it works

- **Plain Web Component.** It uses `HTMLElement` and Shadow DOM, with no framework and no build step. `index.js` is the source.
- **Choosing the output device.** The ringtone plays through an `<audio>` element, and [`HTMLMediaElement.setSinkId()`](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/setSinkId) sends it to the chosen device.
- **Device names.** Browsers only show audio device names once the page has microphone permission. On load, the widget asks for the mic briefly with `getUserMedia({ audio: true })`, then releases it straight away. The Agent Desktop normally has mic permission already for WebRTC calling.
- **Call events.** These come from the desktop's `window.AGENTX_SERVICE.aqm.contact` event emitters.
- **Ringtone file.** `ring.mp3` is loaded from the same folder as `index.js`, so the two files must be hosted together.

## Requirements

- Webex Contact Center Agent Desktop in Chrome or Edge. Both support `setSinkId`.
  - Firefox 116+ also works.
  - In Safari the ring always plays on the system default output.
- An Agent Desktop layout you can edit and upload in Control Hub.
- Microphone permission for the desktop, so device names show up.

## Installation

### 1. Host the files

Both files are served from this repo by GitHub Pages:

```
https://krich5.github.io/RingerDevice/index.js
https://krich5.github.io/RingerDevice/ring.mp3
```

To host your own copy, fork this repo and turn on GitHub Pages, or upload `index.js` and `ring.mp3` **into the same folder** on any static HTTPS host.

### 2. Add it to your Desktop Layout

Add `ringer-device` to the `advancedHeader` of each persona that should have it: `agent`, `supervisor` and/or `supervisorAgent`.

```json
"advancedHeader": [
  {
    "comp": "ringer-device",
    "script": "https://krich5.github.io/RingerDevice/index.js",
    "attributes": {
      "darkmode": "$STORE.app.darkMode"
    }
  },
  "digital-outbound",
  "outdial-call",
  "notification"
]
```

> A complete sample layout with the widget in all three personas is included in this repo: [`ringer-device_Layout.json`](ringer-device_Layout.json)

### 3. Upload the layout

In **Control Hub → Contact Center → Desktop Layouts**, upload the layout and assign it to the team(s) that should have it. Agents must sign out and back in to pick up the new layout.

### 4. Agent setup (one time)

1. Click **Ringing Device** in the header.
2. Turn the switch **on**.
3. Pick the speaker to ring on and click **Save**.
4. Click **Test ring** to confirm it's audible.

## Properties

| Attribute | Store binding | Description |
|-----------|---------------|-------------|
| `darkmode` | `$STORE.app.darkMode` | Switches the widget between light and dark styling to match the desktop |

## Customizing

| What | How |
|------|-----|
| Ringtone | Replace `ring.mp3` with your own audio file of the same name. It loops, so a short clip works best. |
| Label | Edit the `Ringing Device` text in the `TEMPLATE` in `index.js` |
| Colors | Edit the `--sr-*` CSS variables in `STYLES`. There's one set for light mode and one under `:host([dark])` |

## Known limitations

- **Off by default.** Each agent has to switch it on and pick a device once per browser and computer.
- **Settings are per browser, not per agent.** They live in `localStorage`, so they don't follow an agent to another computer or browser.
- **Relies on an internal desktop API.** Call events come from `window.AGENTX_SERVICE`, which isn't part of the documented Desktop SDK. A future desktop release could change it. If that happens, the widget fails silently and simply won't ring.
- **No ring until the agent has used the page.** Browsers block audio until the agent has clicked or typed on the page. If an offer arrives right after a page load with no interaction, the first ring may not play.

## License

See [LICENSE](LICENSE).
