const ACTION_MATCH_WINDOW_MS = 5000;

class StopPropagationCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.card) {
      throw new Error(
        "Stop Propagation Card requires a 'card' object in config.",
      );
    }

    this._config = config;
    this._actions = config.actions || null;
    this._lastAction = null;
    this._lastActionTime = 0;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });

      if (!this._actions) {
        ["click", "touchstart", "touchend", "pointerup"].forEach((type) => {
          this.addEventListener(type, this._onBlockAll);
        });
      } else {
        this.addEventListener("action", this._onAction);
        ["click", "touchend", "pointerup"].forEach((type) => {
          this.addEventListener(type, this._onSelectiveNativeEvent);
        });
      }
    }

    this._renderCard();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._cardEl) {
      this._cardEl.hass = hass;
    }
  }

  _onBlockAll = (ev) => {
    ev.stopPropagation();
    if (ev.detail && ev.detail.sourceEvent) {
      ev.detail.sourceEvent.stopPropagation();
    }
  };

  _onAction = (ev) => {
    const action = ev.detail && ev.detail.action;
    if (!action) {
      return;
    }
    this._lastAction = action;
    this._lastActionTime = Date.now();

    if (this._shouldBlock(action)) {
      // Stop ancestors from seeing this semantic action too (e.g. a
      // parent card that binds its own tap_action/hold_action via the
      // same action-handler mechanism).
      ev.stopPropagation();
    }
  };

  _onSelectiveNativeEvent = (ev) => {
    const withinWindow =
      this._lastAction &&
      Date.now() - this._lastActionTime <= ACTION_MATCH_WINDOW_MS;

    if (withinWindow && this._shouldBlock(this._lastAction)) {
      ev.stopPropagation();
      if (ev.detail && ev.detail.sourceEvent) {
        ev.detail.sourceEvent.stopPropagation();
      }
    }

    this._lastAction = null;
  };

  _shouldBlock(action) {
    return this._actions[`${action}_action`] === true;
  }

  _renderCard() {
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }

    const flex = this._config.grow ? "1 1 0%" : "0 0 auto";
    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        flex: ${flex} !important;
      }
    `;
    this.shadowRoot.appendChild(style);

    const card = this._createCardElement(this._config.card);
    this._cardEl = card;
    this.shadowRoot.appendChild(card);

    if (this._hass) {
      this._cardEl.hass = this._hass;
    }
  }

  _createCardElement(cardConfig) {
    const helpers = window.loadCardHelpers && window.loadCardHelpers();
    const createCard = (cfg) => {
      if (helpers && typeof helpers.createCardElement === "function") {
        return helpers.createCardElement(cfg);
      }
      const tag = cfg.type.startsWith("custom:")
        ? cfg.type.substring("custom:".length)
        : `hui-${cfg.type}-card`;
      const el = document.createElement(tag);
      el.setConfig(cfg);
      return el;
    };

    let card;
    try {
      card = createCard(cardConfig);
    } catch (e) {
      card = document.createElement("ha-alert");
      card.alertType = "error";
      card.title = "Stop Propagation Card error";
      card.text =
        e && e.message
          ? e.message
          : "Error creating stop-propagation card element.";
    }

    return card;
  }

  getCardSize() {
    if (this._cardEl && typeof this._cardEl.getCardSize === "function") {
      return this._cardEl.getCardSize();
    }
    return 1;
  }
}

customElements.define("stop-propagation-card", StopPropagationCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "stop-propagation-card",
  name: "stop-propagation-card",
  description:
    "A card that stops event propagation, optionally selective per action type via the `actions` config option.",
});
