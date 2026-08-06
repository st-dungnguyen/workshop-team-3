import axios from 'axios';
import { environment } from '@config/environment';
import { ENDPOINT } from '@config/endpoint';
import type {
  EligibilityResult,
  GameActiveConfig,
  PlayResult,
} from '@app/shared/models/game';

const mockCouponEndDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
})();

export class GameService {
  private readonly http = axios.create({
    baseURL: environment.apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
  });

  async getConfig(token: string): Promise<GameActiveConfig> {
    if (environment.isLocal) {
      await new Promise<void>((r) => setTimeout(r, 300));
      return { campaignId: 'local-campaign', gameVariant: 'flip-card' };
    }

    const response = await this.http.get<GameActiveConfig>(
      ENDPOINT.game.config,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  }

  async checkEligibility(token: string): Promise<EligibilityResult> {
    if (environment.isLocal) {
      await new Promise<void>((r) => setTimeout(r, 300));
      return { eligible: true, nextPlayAt: null };
    }

    const response = await this.http.get<EligibilityResult>(
      ENDPOINT.game.eligibility,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  }

  async claimCoupon(couponId: string, token: string): Promise<void> {
    if (environment.isLocal) return;

    await this.http.post(
      ENDPOINT.game.claim,
      { couponId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
  }

  async play(campaignId: string, token: string): Promise<PlayResult> {
    if (environment.isLocal) {
      await new Promise<void>((r) => setTimeout(r, 800));
      if (Math.random() > 0.5) {
        return {
          outcome: 'win',
          coupon: {
            id: 'local-coupon-001',
            title: 'すかいらーくグループ全店共通クーポン',
            discount: '500円OFF',
            endDate: mockCouponEndDate,
          },
        };
      }
      return { outcome: 'lose' };
    }

    const response = await this.http.post<PlayResult>(
      ENDPOINT.game.play,
      { campaignId },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  }
}
