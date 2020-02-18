import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  handleAction,
  LovelaceCardEditor,
  LovelaceCard,
  getLovelace,
} from 'custom-card-helpers';
import dayjs from 'dayjs';
import moment from 'moment-with-locales-es6';

import './editor';

import { NrkNewsCardConfig } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';

import { localize } from './localize/localize';

/* eslint no-console: 0 */
console.info(
  `%c  NRK-NEWS-CARD %c ${CARD_VERSION} `,
  'color: white; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

// TODO Name your custom element
@customElement('nrk-news-card')
export class NrkNewsCard extends LitElement {
  constructor() {
    super();
  }
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('nrk-news-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): object {
    return {};
  }

  // TODO Add any properities that should cause your element to re-render here
  @property() public hass?: HomeAssistant;
  @property() private _config?: NrkNewsCardConfig;

  public setConfig(config: NrkNewsCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config || config.show_error) {
      throw new Error(localize('common.invalid_configuration'));
    }

    if (config.test_gui) {
      getLovelace().setEditMode(true);
    }

    this._config = {
      name: 'NRK news',
      ...config,
    };
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected entryNumber = 0;
  protected state;

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }
    this.state = this.hass.states[this._config.entity];
    const entry = this.state.attributes.entries[this.entryNumber];

    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this._config.show_warning) {
      return html`
        <ha-card>
          <div class="warning">${localize('common.show_warning')}</div>
        </ha-card>
      `;
    }

    setTimeout(() => {
      this.nextEntry();
      console.log('*** this.entryNumber', this.entryNumber);
      this.requestUpdate();
    }, 15000);

    console.log('***', entry);
    moment.locale('nb');

    return html`
      <ha-card
        @action=${this._handleAction}
        .actionHandler=${actionHandler({
          hasHold: hasAction(this._config.hold_action),
          hasDoubleTap: hasAction(this._config.double_tap_action),
          repeat: this._config.hold_action ? this._config.hold_action.repeat : undefined,
        })}
        tabindex="0"
        aria-label=${`NRK news: ${this._config.entity}`}
        style=""
      >
        <ha-card>
          ${this.getImage(entry.links)}
          <div style="padding:10px;">
            <div class="title">${entry.title}</div>
            <div class="summary">${entry.summary}</div>
            <div class="published">
              ${moment(entry.published).fromNow()}
            </div>
          </div>
        </ha-card>
      </ha-card>
    `;
  }

  private getImage(links): TemplateResult {
    const image = links.find(link => link.type === 'image/jpeg');
    if (image) {
      return html`
        <img class="image" src="${image.href}" />
      `;
    }
    return html`
      <img class="image" src="https://gfx.nrk.no/MypkihdsBkCYb-cXvwW8BgLqqp7OO7Fkyj8B_mXoY4Ew" />
    `;
  }

  private nextEntry(): void {
    if (this.entryNumber >= this.state.attributes.entries.length - 1) {
      this.entryNumber = 0;
    } else {
      this.entryNumber++;
    }
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    console.log('*** _handleAction');

    this.nextEntry();
    this.requestUpdate();

    if (this.hass && this._config && ev.detail.action) {
      //handleAction(this, this.hass, this._config, ev.detail.action);
    }
  }

  static get styles(): CSSResult {
    return css`
      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }
      .title {
        font-size: 3.1vw;
        padding-bottom: 4px;
        // overflow: hidden;
        // text-overflow: ellipsis;
        white-space: nowrap;
      }
      .summary {
        font-size: 1.2rem;
        font-weight: 300;
        height: 8rem;
      }
      .image {
        max-width: 100%;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
      }
      .published {
        text-align: right;
        font-size: 0.8rem;
      }
    `;
  }
}
