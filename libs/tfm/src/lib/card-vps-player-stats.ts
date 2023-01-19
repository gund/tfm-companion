import type {
  ConfigurablePlayerStats,
  NameablePlayerStats,
  PlayerStats,
  PlayerStatsData,
  UpdatablePlayerStats,
} from '@game-companion/core';
import { html } from '@game-companion/lit';

export interface CardVPsPlayerStatsData extends PlayerStatsData {
  cardName: string;
  scoreCount: number;
  vpsRatio: number;
}

export class CardVPsPlayerStats
  implements
    PlayerStats,
    UpdatablePlayerStats,
    ConfigurablePlayerStats,
    NameablePlayerStats
{
  getId(): string {
    return 'card-vps';
  }

  getName(): string {
    return 'Card Victory Points';
  }

  renderStats(stats: CardVPsPlayerStatsData) {
    return html`${stats.scoreCount ?? 0} - ${this.renderVps(stats)}`;
  }

  renderDisplayName(stats: CardVPsPlayerStatsData) {
    return html`Card ${stats.cardName}`;
  }

  renderVps(stats: CardVPsPlayerStatsData) {
    return html`${this.getFinalScore(stats)}VPs (${stats.vpsRatio}/1 VP)`;
  }

  getFinalScore(stats: CardVPsPlayerStatsData): number {
    return Math.floor(stats.scoreCount / stats.vpsRatio);
  }

  renderUpdateStats(stats: CardVPsPlayerStatsData) {
    import('@game-companion/tfm/card-vps-updater');

    return html`<tfm-card-vps-player-stats-updater
      .data=${stats}
      .playerStats=${this}
    ></tfm-card-vps-player-stats-updater>`;
  }

  renderConfiguration() {
    import('@game-companion/tfm/card-vps-configurator');

    return html`<tfm-card-vps-player-stats-configurator></tfm-card-vps-player-stats-configurator>`;
  }
}
