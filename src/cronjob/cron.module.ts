import { Module } from '@nestjs/common';
import { CronService } from './cron.service';
import { NewsService } from 'src/modules/news/news.service';
import { ImportDataService } from 'src/modules/import-data/importData.service';

@Module({
    providers: [CronService, NewsService, ImportDataService],

})
export class CronModule { }