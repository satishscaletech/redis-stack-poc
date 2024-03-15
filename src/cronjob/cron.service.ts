import { NewsService } from '../modules/news/news.service';
import { ImportDataService } from '../modules/import-data/importData.service';
import { Cron } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CronService {
  constructor(
    private readonly newsService: NewsService,
    private readonly importData: ImportDataService,
  ) {}

  //@Cron('* * * * *')
  async importAndStoreNews() {
    console.log('Cron-log');
    try {
      await this.importData.importKategorien();
      await this.importData.importGroups();
      await this.importData.importNews();
      await this.newsService.storeCategoriesDatausingScript();
      await this.newsService.storeGroupsUsingScript();
      await this.newsService.storeNewsDataUsingScript();
    } catch (error) {
      console.log(error);
    }
  }
}
