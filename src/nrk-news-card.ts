import { LitElement, html, customElement, property, CSSResult, TemplateResult, css, PropertyValues } from 'lit-element';
import {
  HomeAssistant,
  hasConfigOrEntityChanged,
  hasAction,
  ActionHandlerEvent,
  LovelaceCardEditor,
  getLovelace,
} from 'custom-card-helpers';
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

@customElement('nrk-news-card')
export class NrkNewsCard extends LitElement {
  constructor() {
    super();
    moment.locale('nb');
    this.setTimeout();
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    return document.createElement('nrk-news-card-editor') as LovelaceCardEditor;
  }

  public static getStubConfig(): object {
    return {};
  }

  private setTimeout(): void {
    setTimeout(() => {
      this.nextEntry();
      console.log('*** this.entryNumber', this._entryNumber);
      this.setTimeout();
    }, 15000);
  }

  // TODO Add any properities that should cause your element to re-render here
  @property() public hass?: HomeAssistant;
  @property() private _config?: NrkNewsCardConfig;
  @property() private _entryNumber = 0;

  public setConfig(config: NrkNewsCardConfig): void {
    // TODO Check for required fields and that they are of the proper format
    if (!config) {
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

  protected state;

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }
    this.state = this.hass.states[this._config.entity];
    const entry = this.state.attributes.entries[this._entryNumber];

    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this._config.show_warning) {
      return html`
        <ha-card>
          <div class="warning">${localize('common.show_warning')}</div>
        </ha-card>
      `;
    }

    console.log('*** render');

    //console.log('***', entry);

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
    if (this._entryNumber >= this.state.attributes.entries.length - 1) {
      this._entryNumber = 0;
    } else {
      this._entryNumber++;
    }
  }

  private _handleAction(): void {
    this.nextEntry();
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
        font-size: 1.5rem;
        padding-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .summary {
        font-size: 1.2rem;
        font-weight: 300;
        height: 6.1em;
        overflow: hidden;
      }
      .image {
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        object-fit: cover;
        height: 130px;
        width: 100%;
      }
      .published {
        text-align: right;
        font-size: 0.8rem;
        margin-top: 4px;
      }
    `;
  }
}
