class StopPropagationCard extends HTMLElement {
  setConfig(config) {
    if (!config || !config.card) {
      throw new Error(
        "Stop Propagation Card requires a 'card' object in config."
      );
    }

    this._config = config;

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
      ["click", "touchstart", "touchend", "pointerup"].forEach((type) => {
        this.addEventListener(type, this._onClick);
      });
    }

    this._renderCard();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._cardEl) {
      this._cardEl.hass = hass;
    }
  }

  _onClick(ev) {
    ev.stopPropagation();
    if (ev.detail && ev.detail.sourceEvent) {
      ev.detail.sourceEvent.stopPropagation();
    }
  }

  _renderCard() {
    while (this.shadowRoot.firstChild) {
      this.shadowRoot.removeChild(this.shadowRoot.firstChild);
    }

    const style = document.createElement("style");
    style.textContent = `
      :host {
        display: block;
        flex: 0 0 auto !important;
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
  description: "A card that stops event propagation.",
});
