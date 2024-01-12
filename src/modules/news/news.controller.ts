import { Controller, Get, Post, Query, UseInterceptors } from '@nestjs/common';
import { NewsService } from './news.service';
import { SuccessResponse, TransformInterceptor } from 'src/helper/transform';
import { PaginationInterface } from 'src/helper';
import { newsResponseDto } from './dto/news.res.dto';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
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

  @Get('categories')
  async getCategories(@Query() query: any) {
    const data = await this.newsService.getCategories(query);
    return data;
  }

  @Get('news-categories')
  async getNewsCategories(@Query() query: any) {
    const data = await this.newsService.getNewsCategories(query);
    return data;
  }

  @Get('group')
  async getGroup(@Query() query: any) {
    const data = await this.newsService.getGroup(query);
    return data;
  }

  @Get('news-group')
  @UseInterceptors(TransformInterceptor)
  async getNewsByGroup(
    @Query() query: any,
  ): Promise<SuccessResponse<PaginationInterface<newsResponseDto[]>>> {
    const data = await this.newsService.getNewsByGroup(query);
    return data;
  }

  @Get('news-by-grusel')
  @UseInterceptors(TransformInterceptor)
  async getNewsByGrusel(
    @Query() query: any,
  ): Promise<SuccessResponse<PaginationInterface<newsResponseDto[]>>> {
    const data = await this.newsService.getNewsByCatId(query);
    return { data };
  }

  @Get('searchByWord')
  async getNewsBySearch(@Query() query: any) {
    const data = await this.newsService.getNewsBySearch(query);
    console.log(data.length);
    return data;
  }
}
