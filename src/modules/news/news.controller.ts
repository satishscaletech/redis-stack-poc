import { Controller, Get, Post, Query } from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post('news')
  async storeNews() {
    const data = await this.newsService.storeNews();
    return data;
  }

  @Post('categories')
  async storeCategories() {
    const data = await this.newsService.storeCategories();
    return data;
  }

  @Post('news-categories')
  async storeNewsCategories() {
    const data = await this.newsService.storeNewsCategories();
    return data;
  }

  @Post('group')
  async storeGroup() {
    const data = await this.newsService.storeGroup();
    return data;
  }

  @Get()
  async getNews(@Query() query: any) {
    const data = await this.newsService.getNews(query);
    return data;
  }
}
