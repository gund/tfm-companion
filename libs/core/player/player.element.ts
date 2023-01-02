import type { Player, PlayerStatsData, Session } from '@game-companion/core';
import {
  isUpdatablePlayerStats,
  PlayerStatsRegistry,
  SessionsService,
  UpdatePlayerStatsDataEvent,
} from '@game-companion/core';
import '@game-companion/core/add-player-stats';
import { AddPlayerStatsEvent } from '@game-companion/core/add-player-stats';
import {
  customElement,
  html,
  LitElement,
  property,
  PropertyValueMap,
  repeat,
  state,
  when,
} from '@game-companion/lit';
import '@game-companion/mdc/top-app-bar';
import '@game-companion/mdc/icon-button';
import '@game-companion/mdc/button';

declare global {
  interface HTMLElementTagNameMap {
    [GcPlayerElement.selector]: GcPlayerElement;
  }
}

@customElement(GcPlayerElement.selector)
export class GcPlayerElement extends LitElement {
  static readonly selector = 'gc-player';

  @property() declare sId: string;
  @property() declare pId: string;

  @state() private declare session?: Session;
  @state() private declare player?: Player;
  @state() private declare isLoading: boolean;
  @state() private declare showAddStats: boolean;

  private sessionsService = new SessionsService();
  private playerStatsRegistry = new PlayerStatsRegistry();

  constructor() {
    super();

    this.isLoading = false;
    this.showAddStats = false;
  }

  protected override render() {
    return html`<mdc-top-app-bar appearance="fixed">
      <span slot="title"> Player ${this.player?.name} </span>
      <mdc-icon-button
        slot="menu"
        type="link"
        href="/session/${this.sId}"
        class="mdc-top-app-bar__navigation-icon"
        icon="arrow_back"
        aria-label="Back to session"
      ></mdc-icon-button>
      ${when(
        this.player,
        () => this.renderPlayer(this.player!),
        () => this.renderFallback()
      )}
    </mdc-top-app-bar>`;
  }

  private renderPlayer(player: Player) {
    return html`${when(
        player.stats.length,
        () => html`<table>
          ${repeat(
            player.stats,
            (ps) => ps.id,
            (ps) => html`<tr>
              <td>${this.getPlayerStatsName(ps.id)}</td>
              <td
                @gcUpdateData=${{
                  handleEvent: (e: UpdatePlayerStatsDataEvent) =>
                    this.updatePlayerStats(ps, e.data as object),
                }}
              >
                ${this.renderPlayerStats(ps)}
              </td>
              <td>
                <mdc-icon-button
                  type="button"
                  icon="delete"
                  aria-label="Remove"
                  @click=${{ handleEvent: () => this.removePlayerStats(ps) }}
                ></mdc-icon-button>
              </td>
            </tr>`
          )}
        </table>`
      )}
      <p>
        <mdc-button
          type="button"
          outlined
          @click=${{
            handleEvent: () => (this.showAddStats = !this.showAddStats),
          }}
        >
          Add new stats
        </mdc-button>
        ${when(
          this.showAddStats,
          () =>
            html`<p>
              <gc-add-player-stats
                @gcAddPlayerStats=${this.addPlayerStats}
              ></gc-add-player-stats>
            </p>`
        )}
      </p>`;
  }

  private renderPlayerStats(data: PlayerStatsData) {
    const playerStats = this.getPlayerStats(data.id);

    if (!playerStats) {
      return;
    }

    if (isUpdatablePlayerStats(playerStats)) {
      return playerStats.renderUpdateStats(data);
    } else {
      return playerStats.renderStats(data);
    }
  }

  private renderFallback() {
    return html`${when(
      this.isLoading,
      () => html`Loading Player...`,
      () => html`Invalid Player!`
    )}`;
  }

  protected override willUpdate(
    changedProps: PropertyValueMap<GcPlayerElement>
  ) {
    if (changedProps.has('sId')) {
      this.loadSession();
    }
    if (changedProps.has('pId')) {
      this.updatePlayer();
    }
  }

  private async loadSession() {
    this.session = undefined;

    if (!this.sId) {
      return;
    }

    try {
      this.isLoading = true;
      this.session = await this.sessionsService.getById(this.sId);
      this.updatePlayer();
    } finally {
      this.isLoading = false;
    }
  }

  private updatePlayer() {
    this.player = this.session?.players.find((p) => p.id === this.pId);
  }

  private getPlayerStats(id: string) {
    return this.playerStatsRegistry
      .getAvailable()
      .find((ps) => ps.getId() === id);
  }

  private getPlayerStatsName(id: string) {
    return this.getPlayerStats(id)?.getName() ?? `Unknown(${id})`;
  }

  private async updatePlayerStats(playerStats: PlayerStatsData, data?: object) {
    if (!this.player) {
      return;
    }

    this.player.stats = this.player.stats.map((ps) =>
      ps === playerStats ? { ...ps, ...data } : ps
    );
    this.requestUpdate();

    await this.sessionsService.updatePlayer(this.sId, this.player);
  }

  private async addPlayerStats(event: AddPlayerStatsEvent) {
    if (!this.player) {
      return;
    }

    this.player.stats = [...this.player.stats, event.data];
    this.showAddStats = false;
    this.requestUpdate();

    await this.sessionsService.updatePlayer(this.sId, this.player);
  }

  private async removePlayerStats(data: PlayerStatsData) {
    if (!this.player) {
      return;
    }

    this.player.stats = this.player.stats.filter((ps) => ps !== data);
    this.requestUpdate();

    await this.sessionsService.updatePlayer(this.sId, this.player);
  }
}
