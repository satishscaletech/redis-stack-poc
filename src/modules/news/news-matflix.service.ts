import { Injectable } from '@nestjs/common';
import redis from '../../lib/redis';
import { getPaginateOffset } from '../../helper';
import { REDIS_MATFLIX_INDEX } from '../../constant';
import { newsResponseDto } from './dto/news.res.dto';

@Injectable()
export class NewsService {
  public async getAllCategoriesByQuery(req: any) {
    console.log('req.query', req.query);

    const cat_res = await redis.get(
      'idx:' + REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX,
      req.query,
      {},
    );
    return cat_res.documents.map((doc) => {
      return doc.value;
    });
  }

  public async getNewsCategories(req: any) {
    const { limit, offset } = getPaginateOffset(req.page, req.recordPerPage);
    const option: any = {
      LIMIT: {
        from: offset ? offset : 0,
        size: limit ? limit : 9,
      },
    };
    const key = req.key;
    const data = await redis.get(key, req.query, option);
    return data;
  }

  public async getGroup(req: any) {
    const { limit, offset } = getPaginateOffset(req.page, req.recordPerPage);
    const option: any = {
      LIMIT: {
        from: offset ? offset : 0,
        size: limit ? limit : 9,
      },
    };
    const key = req.key;
    const data = await redis.get(key, req.query, option);
    return data;
  }

  public async getNewsByQuery(dto: any) {
    const { limit, offset } = getPaginateOffset(dto.page, dto.recordPerPage);
    const option: any = {
      LIMIT: {
        from: offset,
        size: limit,
      },
      SORTBY: {
        BY: 'datum',
        DIRECTION: 'DESC',
      },
    };

    const groups = await redis.get(
      `idx:${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}`,
      dto.query,
      option,
    );

    return groups;
  }

  public async getNewsByGrusel(dto: {
    kategorie_id: string[];
    page: number;
    recordPerPage: number;
  }) {
    const category_query = dto.kategorie_id.map((id) => {
      return `(@kategorie_id: [${id} ${id}])`;
    });
    const categories = await this.getAllCategoriesByQuery({
      query: category_query.join(' | '),
    });
    // ('(@grusel: {ESTHA} @grusel: {ESMCO}) | (@grusel: {ESMST} @grusel: {ESTNE})');
    const grusel_query = categories.map(
      (category: { kategorie_id: number; grusel: [] }) => {
        const tag_query = category.grusel.map((tags) => {
          return `@grusel: {${tags}}`;
        });

        return `(${tag_query.join(' ')})`;
      },
    );
    console.log("grusel_query.join(' | ')", grusel_query.join('|'));

    const news_data = await this.getNewsByQuery({
      query: grusel_query.join('|'),
      ...dto,
    });

    for (const news of news_data.documents) {
      const cat_data = [];

      const newsObj: any = news.value;
      const news_cat: any = await this.getAllCategoriesByQuery({
        query: `@grusel: {${newsObj.grusel.flat().join(' | ')}}`,
      });
      if (newsObj.id === 3693186) {
        console.log('news_cat', news_cat, 'newsObj.grusel', newsObj.grusel);
      }

      for (const categories of news_cat) {
        const isSubSet = categories.grusel.every((tag) =>
          newsObj.grusel.includes(tag),
        );
        if (isSubSet) {
          const group_id_query = `@gruppen_id: [${categories.gruppen_id} ${categories.gruppen_id}]`;

          categories.parentGroup = await this.getParentGroup(group_id_query);

          cat_data.push(categories);
        }
      }
      news.value['tags'] = cat_data;
    }
    const news_res = news_data.documents.map(
      (doc) => new newsResponseDto(doc.value),
    );
    return { data: news_res };
  }

  public async getParentGroup(group_id_query: string) {
    let eltern_id = null;
    let groupRes = [];

    while (eltern_id != 0) {
      const group = await redis.get(
        `idx:${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}`,
        group_id_query,
        { LIMIT: { from: 0, size: 1 } },
      );
      groupRes = group.documents.map((doc) => doc.value);
      eltern_id = groupRes?.[0]?.eltern_id ?? 0;
      group_id_query = `@gruppen_id: [${groupRes?.[0]?.eltern_id} ${groupRes?.[0]?.eltern_id}]`;
    }

    return groupRes;
  }
}
