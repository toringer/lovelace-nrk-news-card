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

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }
    const state = this.hass.states[this._config.entity];

    const entry = state.attributes.entries[0];

    // TODO Check for stateObj or other necessary things and render a warning if missing
    if (this._config.show_warning) {
      return html`
        <ha-card>
          <div class="warning">${localize('common.show_warning')}</div>
        </ha-card>
      `;
    }

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
        style="padding:10px;"
      >
        <ha-card>
          <table>
            <tr>
              <td colspan="2">
                <div class="title">${entry.title}</div>
              </td>
            </tr>
            <tr>
              <td style="vertical-align: top;">
                <div class="summary">${entry.summary}</div>
              </td>
              <td style="vertical-align: top;">
                <div>${this.getImage(entry.links)}</div>
              </td>
            </tr>
          </table>
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
    return html``;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    if (this.hass && this._config && ev.detail.action) {
      handleAction(this, this.hass, this._config, ev.detail.action);
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
        font-size: 2rem;
      }
      .summary {
      }
      .image {
        max-width: 200px;
        max-height: 145px;
        border-radius: 4px;
        margin-left: 10px;
      }
    `;
  }
}
