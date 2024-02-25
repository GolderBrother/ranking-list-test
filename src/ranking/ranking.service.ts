import { Injectable, Inject } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import * as dayjs from 'dayjs';

@Injectable()
export class RankingService {
  @Inject(RedisService)
  private redisService: RedisService;
  private readonly MONTH_KEY = 'learning-ranking-month';

  // 月份的榜单是 learning-ranking-mongth:2024-01、learning-ranking-mongth:2024-02 这样的格式。
  private getMonthKey() {
    const dateStr = dayjs().format('YYYY-MM');
    return `${this.MONTH_KEY}:${dateStr}`;
  }

  private getYearKey() {
    const dateStr = dayjs().format('YYYY');
    return `learning-ranking-year:${dateStr}`;
  }

  async join(name: string) {
    await this.redisService.zAdd(this.getMonthKey(), { [name]: 0 });
  }

  async addLearnTime(name: string, time: number) {
    await this.redisService.zIncr(this.getMonthKey(), name, time);
  }

  async getMonthRanking() {
    const data = await this.redisService.zRankingList(
      this.getMonthKey(),
      0,
      10,
    );
    console.log('getMonthRanking data', data);
    return data;
  }

  /**
   * 年份的榜单就是拿到用 learning-ranking-month:当前年份- 开头的所有 zset，做下合并
   * 每个月榜和年榜都是单独的 zset。
   * @returns
   */
  async getYearRanking() {
    const dateStr = dayjs().format('YYYY');
    const keys = await this.redisService.keys(`${this.MONTH_KEY}:${dateStr}-*`);

    return this.redisService.zUnion(this.getYearKey(), keys);
  }
}
