(() => {
  const RING_URL = new URL("ring.mp3", document.currentScript?.src || "https://krich5.github.io/RingerDevice/index.js").href;
  const LS_DEVICE = "ringerDevice.deviceId";
  const LS_ENABLED = "ringerDevice.enabled";

  const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

  const ICON_ATTRS = 'viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';
  const BELL_ICON = `<svg ${ICON_ATTRS} stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;
  const SAVE_ICON = `<svg ${ICON_ATTRS} stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>`;
  const CHECK_ICON = `<svg ${ICON_ATTRS} stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>`;

  const STYLES = `
    :host {
      --sr-bg: #ffffff;
      --sr-fg: #121212;
      --sr-muted: #545454;
      --sr-border: #dedede;
      --sr-field: #f7f7f7;
      --sr-hover: rgba(0, 0, 0, 0.06);
      --sr-accent: #007aa3;
      --sr-accent-hover: #005e7d;
      --sr-on: #24ab31;
      --sr-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
      display: inline-flex;
      position: relative;
      align-items: center;
      font-family: 'CiscoSansTT Regular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: var(--sr-fg);
    }
    :host([dark]) {
      --sr-bg: #262626;
      --sr-fg: #f7f7f7;
      --sr-muted: #b2b2b2;
      --sr-border: #3f3f3f;
      --sr-field: #1a1a1a;
      --sr-hover: rgba(255, 255, 255, 0.08);
      --sr-accent: #00a0d1;
      --sr-accent-hover: #33b3da;
      --sr-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
    }
    [hidden] { display: none !important; }
    button { font: inherit; color: inherit; cursor: pointer; }

    .trigger {
      display: inline-flex; align-items: center; gap: 6px;
      height: 32px; padding: 0 12px; border-radius: 16px;
      border: 1px solid var(--sr-border); background: transparent; white-space: nowrap;
    }
    .trigger:hover, .trigger[aria-expanded="true"] { background: var(--sr-hover); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sr-muted); opacity: 0.6; }
    .dot.on { background: var(--sr-on); opacity: 1; }

    .panel {
      position: absolute; top: calc(100% + 8px); right: 0; z-index: 1000;
      width: 280px; box-sizing: border-box; padding: 16px;
      border-radius: 8px; border: 1px solid var(--sr-border);
      background: var(--sr-bg); box-shadow: var(--sr-shadow);
      display: flex; flex-direction: column; gap: 14px;
    }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .title { font-weight: 600; font-size: 15px; }
    .label { font-size: 12px; color: var(--sr-muted); margin-bottom: 6px; }

    .switch {
      position: relative; width: 36px; height: 20px; flex: none;
      border-radius: 10px; border: none; padding: 0;
      background: var(--sr-border); transition: background 0.15s;
    }
    .switch::after {
      content: ""; position: absolute; top: 2px; left: 2px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #fff; transition: transform 0.15s;
    }
    .switch[aria-checked="true"] { background: var(--sr-accent); }
    .switch[aria-checked="true"]::after { transform: translateX(16px); }

    .field { display: flex; gap: 6px; }
    select {
      flex: 1; min-width: 0; height: 32px; padding: 0 8px;
      font: inherit; color: var(--sr-fg); background: var(--sr-field);
      border: 1px solid var(--sr-border); border-radius: 6px;
    }
    .icon-btn {
      width: 32px; height: 32px; flex: none;
      display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid var(--sr-border); border-radius: 6px; background: transparent;
    }
    .icon-btn.saved { color: var(--sr-on); border-color: var(--sr-on); cursor: default; }
    .icon-btn.dirty { background: var(--sr-accent); border-color: var(--sr-accent); color: #fff; }
    .icon-btn.dirty:hover { background: var(--sr-accent-hover); }
    .status { font-size: 12px; margin-top: 6px; color: var(--sr-muted); min-height: 16px; }
    .status.ok { color: var(--sr-on); }
    .status.warn { color: var(--sr-accent); }
    .test { height: 32px; border: none; border-radius: 16px; background: var(--sr-accent); color: #fff; }
    .test:hover { background: var(--sr-accent-hover); }
    .error { font-size: 12px; color: #d93829; }
  `;

  const TEMPLATE = `
    <style>${STYLES}</style>
    <button class="trigger" aria-expanded="false">
      ${BELL_ICON}<span>Ringing Device</span><span class="dot"></span>
    </button>
    <audio loop preload="auto"></audio>
    <div class="panel" role="dialog" aria-label="Ringing Device settings" hidden>
      <div class="row">
        <span class="title">Ringing Device</span>
        <button class="switch" role="switch" aria-checked="false" aria-label="Enable ringing device"></button>
      </div>
      <div>
        <div class="label">Ring on this device</div>
        <div class="field">
          <select aria-label="Output device"></select>
          <button class="icon-btn saved"></button>
        </div>
        <div class="status"></div>
      </div>
      <div class="error" hidden></div>
      <button class="test">Test ring</button>
    </div>
  `;

  class RingerDevice extends HTMLElement {
    // Bound in the layout as "darkmode": "$STORE.app.darkMode"
    static get observedAttributes() { return ["darkmode"]; }

    constructor() {
      super();
      this.deviceId = lsGet(LS_DEVICE) || "default";
      this.pendingId = this.deviceId;
      this.isActive = lsGet(LS_ENABLED) === "true";
      this.open = false;
      this.testing = false;
      this.justSaved = false;
      this.savedTimer = 0;

      const root = this.attachShadow({ mode: "open" });
      root.innerHTML = TEMPLATE;
      const $ = (s) => root.querySelector(s);
      this.els = {
        trigger: $(".trigger"), dot: $(".dot"), ring: $("audio"), panel: $(".panel"),
        toggle: $(".switch"), select: $("select"), save: $(".icon-btn"),
        status: $(".status"), error: $(".error"), test: $(".test"),
      };
      this.els.ring.src = RING_URL;

      this.els.trigger.addEventListener("click", () => this.setOpen(!this.open));
      this.els.toggle.addEventListener("click", () => this.toggleActive());
      this.els.select.addEventListener("change", (e) => { this.pendingId = e.target.value; this.update(); });
      this.els.save.addEventListener("click", () => this.saveDevice());
      this.els.test.addEventListener("click", () => this.toggleTest());
      this.onDocClick = (e) => { if (this.open && !e.composedPath().includes(this)) this.setOpen(false); };
      this.onDeviceChange = () => this.listAudioDevices();
      this.devices = [];

      if (Object.prototype.hasOwnProperty.call(this, "darkmode")) {
        const v = this.darkmode;
        delete this.darkmode;
        this.darkmode = v;
      }
    }

    set darkmode(v) { this.toggleAttribute("dark", String(v) === "true"); }
    attributeChangedCallback(name, _old, val) { if (name === "darkmode") this.darkmode = val; }

    connectedCallback() {
      document.addEventListener("click", this.onDocClick, true);
      navigator.mediaDevices?.addEventListener?.("devicechange", this.onDeviceChange);
      this.initDevices();
      const c = window.AGENTX_SERVICE?.aqm?.contact;
      if (c) {
        c.eAgentOfferContact.listen(() => this.startRing());
        c.eAgentOfferConsult.listen(() => this.startRing());
        c.eAgentContactAssigned.listen(() => this.stopRing());
        c.eAgentContactEnded.listen(() => this.stopRing());
        c.eAgentOfferContactRona.listen(() => this.stopRing());
        c.eAgentConsulting.listen(() => this.stopRing());
      }
      this.update();
    }

    disconnectedCallback() {
      document.removeEventListener("click", this.onDocClick, true);
      navigator.mediaDevices?.removeEventListener?.("devicechange", this.onDeviceChange);
    }

    async initDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        this.errorText = "";
      } catch (e) {
        console.error("Ringer Device: mic permission denied", e);
        this.errorText = "Allow microphone access so audio devices can be listed.";
      }
      await this.listAudioDevices();
    }

    async listAudioDevices() {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        this.devices = all.filter((d) => d.kind === "audiooutput");
        if (!this.devices.some((d) => d.deviceId === this.deviceId)) this.deviceId = "default";
        if (!this.devices.some((d) => d.deviceId === this.pendingId)) this.pendingId = this.deviceId;
        this.renderOptions();
        this.applySink();
        this.update();
      } catch (e) {
        console.error("Ringer Device: error enumerating devices", e);
      }
    }

    renderOptions() {
      const sel = this.els.select;
      sel.replaceChildren(...this.devices.map((d) => {
        const opt = document.createElement("option");
        opt.value = d.deviceId;
        opt.textContent = d.label || (d.deviceId === "default" ? "System default" : "Unknown device");
        return opt;
      }));
      sel.value = this.pendingId;
    }

    async applySink() {
      const ring = this.els.ring;
      if (!ring.setSinkId) return;
      try { await ring.setSinkId(this.deviceId); } catch (e) { console.error("Ringer Device: setSinkId failed", e); }
    }

    setOpen(open) {
      this.open = open;
      if (open) {
        this.pendingId = this.deviceId;
        this.listAudioDevices();
      }
      this.update();
    }

    saveDevice() {
      if (this.pendingId === this.deviceId) return;
      this.deviceId = this.pendingId;
      lsSet(LS_DEVICE, this.deviceId);
      this.applySink();
      this.justSaved = true;
      clearTimeout(this.savedTimer);
      this.savedTimer = setTimeout(() => { this.justSaved = false; this.update(); }, 2000);
      this.update();
    }

    toggleActive() {
      this.isActive = !this.isActive;
      lsSet(LS_ENABLED, String(this.isActive));
      if (!this.isActive) this.stopRing();
      this.update();
    }

    startRing() {
      if (this.isActive) this.els.ring.play().catch((e) => console.error("Ringer Device: play failed", e));
    }

    stopRing() {
      this.els.ring.pause();
      this.els.ring.currentTime = 0;
      this.testing = false;
      this.update();
    }

    toggleTest() {
      if (this.testing) return this.stopRing();
      this.testing = true;
      this.els.ring.play().catch(() => { this.testing = false; this.update(); });
      this.update();
    }

    update() {
      const e = this.els;
      const dirty = this.pendingId !== this.deviceId;
      e.trigger.setAttribute("aria-expanded", String(this.open));
      e.trigger.title = this.isActive ? "Ringing Device is on" : "Ringing Device is off";
      e.dot.classList.toggle("on", this.isActive);
      e.panel.hidden = !this.open;
      e.toggle.setAttribute("aria-checked", String(this.isActive));
      e.save.className = "icon-btn " + (dirty ? "dirty" : "saved");
      e.save.title = dirty ? "Save device" : "Saved";
      e.save.setAttribute("aria-label", dirty ? "Save device" : "Device saved");
      e.save.innerHTML = dirty ? SAVE_ICON : CHECK_ICON;
      e.status.className = "status" + (dirty ? " warn" : this.justSaved ? " ok" : "");
      e.status.textContent = dirty ? "Not saved yet" : this.justSaved ? "Saved" : "";
      e.error.hidden = !this.errorText;
      e.error.textContent = this.errorText || "";
      e.test.textContent = this.testing ? "Stop test" : "Test ring";
    }
  }

  if (!customElements.get("ringer-device")) customElements.define("ringer-device", RingerDevice);
})();
