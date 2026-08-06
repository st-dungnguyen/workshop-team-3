import axios from 'axios';
import { environment } from '@config/environment';
import { ENDPOINT } from '@config/endpoint';
import type { EligibilityResult, PlayResult } from '@app/shared/models/game';

const MOCK_COUPON_END_DATE = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
})();

export class GameService {
  private readonly http = axios.create({
    baseURL: environment.apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
  });

  async checkEligibility(token: string): Promise<EligibilityResult> {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      await new Promise<void>((r) => setTimeout(r, 500));
      return { eligible: true, nextPlayAt: null };
    }

    const response = await this.http.get<EligibilityResult>(
      ENDPOINT.game.eligibility,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  }

  async play(campaignId: string, token: string): Promise<PlayResult> {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      await new Promise<void>((r) => setTimeout(r, 1000));
      const isWin = Math.random() > 0.5;
      if (isWin) {
        return {
          outcome: 'win',
          coupon: {
            id: '1000000001',
            title: 'すかいらーくグループ全店共通クーポン',
            discount: '500円OFF',
            endDate: MOCK_COUPON_END_DATE,
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
