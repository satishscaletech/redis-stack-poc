import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { difference, intersection } from 'lodash';
import redis from '../../lib/redis';
import * as StreamArray from 'stream-json/streamers/StreamArray';
import { getPaginateOffset } from '../../helper';
import { JSON_FILE_PATH, REDIS_MATFLIX_INDEX, FREEMIUM } from '../../constant';
import { newsResponseDto } from './dto/news.res.dto';

@Injectable()
export class NewsService {
  public async storeNews() {
    const readStream = await fs
      .createReadStream(`${JSON_FILE_PATH.NEWS_MATFLIX}`, 'utf-8')
      .pipe(StreamArray.withParser());

    readStream.on('data', async function (chunk) {
      const news = chunk.value;

      if (news.grusel) {
        news.id = news.id;
        news.datum = news.datum ? new Date(news.datum).getTime() : null;
        news.sprache = news.sprache ?? null;
        news.source_code = news.source_code ?? null;
        news.grusel = news.grusel ? news.grusel.split(' ') : [null];
        news.bild = news.bild ?? null;
        news.bild_info = news.bild_info ?? null;
        news.titel = news.titel ?? null;
        news.einleitung = news.einleitung ?? null;
        news.inhalt = news.inhalt ?? null;
        news.html = news.html ?? null;
        news.autor = news.auto ?? null;
        news.quelle = news.quelle ?? null;
        news.externe_id = news.externe_id;
        news.sicherungszeit = news.sicherungszeit ?? null;
        const res = await redis.store(
          `${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}:${news.id}`,
          news,
        );
        console.info('Redis news response: ', res);
      }
    });

    readStream.on('end', function () {
      console.log('finished reading news');
    });
  }

  public async storeCategories() {
    const readStream = fs
      .createReadStream(JSON_FILE_PATH.CATEGORIES_MATFLIX, 'utf-8')
      .pipe(StreamArray.withParser());
    readStream.on('data', async (chunk) => {
      const categories = chunk.value;

      categories.kategorie_id = categories.kategorie_id ?? 0;
      categories.gruppen_id = categories.gruppen_id ?? 0;
      categories.gruppe = categories.gruppe ?? '';
      categories.kategorie = categories.kategorie ?? '';
      categories.sprache = categories.sprache ?? '';
      categories.quelle = categories.quelle ?? '';
      categories.fid = categories.fid ?? 0;
      categories.grusel = categories.grusel
        ? categories.grusel.split(' ')
        : [''];
      categories.sichtbar = categories.sichtbar ?? 0;
      categories.sicherungszeit = categories.sicherungszeit ?? '';
      categories.kategorie_eng = categories.kategorie_eng ?? '';
      categories.gruppe_eng = categories.gruppe_eng ?? '';
      categories.is_news_delete = categories.is_news_delete ?? 0;

      const res = await redis.store(
        `${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}:${chunk.key + 1}`,
        categories,
      );
      console.log('Redis categories response: ', res);
    });

    readStream.on('end', async () => {
      console.log('finished reading categories');
    });
  }

  public async storeNewsCategories() {
    const readStream = fs
      .createReadStream(JSON_FILE_PATH.NEWS_CATEGORIES_MATFLIX, 'utf-8')
      .pipe(StreamArray.withParser());

    readStream.on('data', async (chunk) => {
      const newsCategories = chunk.value;

      newsCategories.id = newsCategories.id ?? '';
      newsCategories.kategorie_id = newsCategories.kategorie_id ?? '';
      newsCategories.sicherungszeit = newsCategories.sicherungszeit ?? '';

      const res = await redis.store(
        `${REDIS_MATFLIX_INDEX.NEWS_CATEGORIES_MATFLIX}:${newsCategories.id}`,
        newsCategories,
      );
      console.log('Redis res', res);
    });

    readStream.on('end', async () => {
      console.info('finished reading news categories');
    });
  }

  public async storeGroup() {
    const readStream = fs
      .createReadStream(JSON_FILE_PATH.GROUP_MATFLIX, 'utf-8')
      .pipe(StreamArray.withParser());

    readStream.on('data', async (chunk) => {
      const group = chunk.value;

      group.gruppen_id = group.gruppen_id ?? '';
      group.eltern_id = group.eltern_id ?? '';
      group.gruppe = group.gruppe ?? '';
      group.gruppe_eng = group.gruppe_eng ?? '';
      group.sortidx = group.sortidx ?? '';
      group.sichtbar = group.sichtbar ?? '';
      group.bilddatei = group.bilddatei ?? '';
      group.filter_nachrichten = group.filter_nachrichten ?? '';
      group.filter_kurse = group.filter_kurse ?? '';
      group.sicherungszeit = group.sicherungszeit ?? '';
      group.is_active = group.is_active ?? '';
      group.is_inactive = group.is_inactive ?? '';

      const res = await redis.store(
        `${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}:${group.gruppen_id}`,
        group,
      );
      console.log('Redis group response: ', res);
    });

    readStream.on('end', async () => {
      console.info('finished reading group');
    });
  }

  public async getNews(req: any) {
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
  public async getCategories(req: any) {
    console.log('request data', req);

    const { limit, offset } = getPaginateOffset(req.page, req.recordPerPage);
    const option: any = {
      LIMIT: {
        from: offset ? offset : 0,
        size: limit ? limit : 9,
      },
    };

    const key = req.key;
    const data = await redis.get(key, req.query, {});
    console.log('data', data);

    return data;
  }

  public async getNewsCategories1(req: any) {
    const idx = 'idx:' + REDIS_MATFLIX_INDEX.NEWS_CATEGORIES_MATFLIX;
    const data = await redis.get(idx, req.query, { from: 1, size: 100000 });

    const cat_ids_query = data.documents.map((doc) => {
      return `(@kategorie_id: [${doc.value.kategorie_id} ${doc.value.kategorie_id}])`;
    });

    const query = cat_ids_query.join('|');
    const cat_res = await redis.get(
      'idx:' + REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX,
      query,
      {},
    );
    return cat_res.documents.map((doc) => {
      return doc.value;
    });
  }

  public async getNewsCategories2(req: any) {
    const cat_res = await redis.get(
      'idx:' + REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX,
      req.query,
      {},
    );
    return cat_res.documents.map((doc) => {
      return doc.value;
    });
  }

  public async getAllCategoriesByQuery(req: any) {
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

  public async getNewsByGroup(dto: any) {
    let newsData: any[] = [];
    let total = 0;
    // Retrieve all groups and sub-groups
    const groups = await this.getAllGroups(dto.groupId);
    //  console.log(groups);
    // Extract group IDs for query
    const groupIds = groups.map(
      (group) =>
        `(@gruppen_id: [${group.value.gruppen_id} ${group.value.gruppen_id}])`,
    );

    const category_key = `idx:${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}`;
    const group_query = groupIds.join('|');
    const categories = await redis.get(category_key, group_query, {});
    //console.log('group-QUERY', group_query);
    console.log('catege', categories.documents.length);

    if (categories) {
      // Extract category IDs for query
      const categoryFieldQueries = categories.documents.map(
        (doc) =>
          `(@kategorie_id:[${doc.value.kategorie_id} ${doc.value.kategorie_id}])`,
      );

      // Retrieve news categories based on category IDs
      const newsCategory_key = `idx:${REDIS_MATFLIX_INDEX.NEWS_CATEGORIES_MATFLIX}`;
      const newsCategory_query = categoryFieldQueries.join('|');
      const limit = 20;
      const newsCategories = await redis.get(
        newsCategory_key,
        newsCategory_query,
        { limit },
      );
      console.log(newsCategories.documents);

      if (newsCategories) {
        // Extract news IDs for query
        const newsIdFieldQueries = newsCategories.documents.map(
          (doc) => `(@id:[${doc.value.id} ${doc.value.id}])`,
        );

        // Retrieve news based on news IDs
        const news_key = `idx:${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}`;
        const news_query = newsIdFieldQueries.join('|');
        const news = await redis.get(news_key, news_query, {});
        total = news.total;

        for (let news1 of news.documents) {
          const news_cat = await this.getNewsCategories1({
            query: `@id: [${news1.value.id} ${news1.value.id}]`,
          });

          for (let categories of news_cat) {
            const group_id_query = news_cat.map((cat) => {
              return `@gruppen_id: [${cat.gruppen_id} ${cat.gruppen_id}]`;
            });

            const group = await redis.get(
              `idx:${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}`,
              group_id_query.join('|'),
              {},
            );

            const groupRes = group.documents.map((doc) => doc.value);
            categories.parentGroup = groupRes;
          }
          news1.value['tags'] = news_cat;
        }
        newsData = news.documents.map((doc) => new newsResponseDto(doc.value));
      }
    }
    return {
      total,
      recordPerPage: 10,
      currentPage: 1,
      totalPages: newsData.length,
      data: newsData,
      nextPage: 1,
      remainingCount: 0,
    };
  }

  public async getAllGroups(groupId) {
    const key = `idx:${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}`;
    const group_query = `@gruppen_id: [${groupId} ${groupId}]`;

    const groups = await redis.get(key, group_query, { from: 1, size: 10 });
    console.log(groups);

    let eltern_ids = [];

    groups.documents.forEach((groupDoc) => {
      if (groupDoc.value.eltern_id !== 0) {
        eltern_ids.push(groupDoc.value.eltern_id);
      }
    });

    let elternIdsFieldQuery = eltern_ids.map((doc) => {
      return `(@gruppen_id:[${doc} ${doc}])`;
    });

    const elternIdsAsGroupId = elternIdsFieldQuery.join('|');

    const childGroups = await redis.get(key, elternIdsAsGroupId, {});

    let allGroups = groups.documents;

    for (const childGroupDoc of childGroups.documents) {
      const childGroupId = childGroupDoc.value.gruppen_id;
      const recursiveGroups = await this.getAllGroups.call(this, childGroupId);
      allGroups = allGroups.concat(recursiveGroups);
    }

    return allGroups;
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

  public async getNewsByCatId(dto: {
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

    const grusel_query = categories.map(
      (category: { kategorie_id: number; grusel: [] }) => {
        if (category.grusel.length < 3) {
          const tagQuery = category.grusel.map((tags) => {
            return `@grusel: {${tags}}`;
          });
          return `(${tagQuery.join(' ')})`;
        } else {
          const results = this.pairCombination(category.grusel);
          const tag_query = results.map((result: any) => {
            const result_query = result.map((tag) => {
              return `@grusel: {${tag}}`;
            });

            return `(${result_query.join(' ')})`;
          });
          return `(${tag_query.join('|')})`;
        }
      },
    );

    const news_data = await this.getNewsByQuery({
      query: grusel_query.join('|'),
      ...dto,
    });
    // return news_data;
    for (const news of news_data.documents) {
      const cat_data = [];

      const newsObj: any = news.value;

      const news_grusel = newsObj.grusel.filter((tag) => tag);
      const news_cat: any = await this.getAllCategoriesByQuery({
        query: `(@grusel: {${news_grusel
          .flat()
          .join(' | ')}}) (@is_news_delete: [0 0])`,
      });

      for (const categories of news_cat) {
        const filtered_grusel = categories.grusel.filter((tag) => tag);
        let grusel_pair = [];
        let is_news_cat_grusel_match = false;
        if (filtered_grusel.length < 3) {
          grusel_pair = filtered_grusel;
          const grusel_intersection = intersection(news_grusel, grusel_pair);
          if (grusel_pair.length <= grusel_intersection.length) {
            is_news_cat_grusel_match = true;
          }
        } else if (filtered_grusel.length) {
          grusel_pair = this.pairCombination(filtered_grusel);
          is_news_cat_grusel_match = grusel_pair.some((grusel) => {
            const grusel_intersection = intersection(news_grusel, grusel);
            if (grusel_intersection.length === grusel.length) {
              return true;
            }
          });
        }

        if (is_news_cat_grusel_match) {
          const group_id_query = `@gruppen_id: [${categories.gruppen_id} ${categories.gruppen_id}]`;

          categories.parentGroup = await this.getParentGroup(group_id_query);

          cat_data.push(categories);
        }
      }

      //Add freemium category if applicable
      const freemium_cat = await this.getFreemiumCategory(news_grusel);

      if (freemium_cat) {
        const group_id_query = `@gruppen_id: [${freemium_cat.gruppen_id} ${freemium_cat.gruppen_id}]`;

        freemium_cat.parentGroup = await this.getParentGroup(group_id_query);

        cat_data.push(freemium_cat);
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

  public async getNewsCategoriesByGruse(news, categories) {
    const filtered_grusel = news.grusel.filter((tag) => tag);
    const grusel_arr = [];
    let grusel_diff = [];
    const grusel_intsec_cat_arr = [];
    categories.forEach((category) => {
      grusel_arr.push(category.grusel.filter((tag) => tag));
    });

    grusel_diff = difference(filtered_grusel, grusel_arr.flat());

    const grusel_diff_query = grusel_diff.map((tag) => `(@grusel: {${tag}})`);

    grusel_arr.forEach((grusel) => {
      const intersection_arr = intersection(filtered_grusel, grusel);

      if (intersection_arr.length) {
        grusel_intsec_cat_arr.push(intersection_arr);
      }
    });

    const grusel_intsec_query = grusel_intsec_cat_arr.map((grusel) => {
      if (grusel.length < 3) {
        const tagQuery = grusel.map((tags) => {
          return `@grusel: {${tags}}`;
        });
        return `(${tagQuery.join(' ')})`;
      } else {
        const results = this.pairCombination(grusel);
        const tag_query = results.map((result: any) => {
          const result_query = result.map((tag) => {
            return `@grusel: {${tag}}`;
          });

          return `(${result_query.join(' ')})`;
        });
        return `(${tag_query.join('|')})`;
      }
    });

    grusel_intsec_query.push(...grusel_diff_query);

    return grusel_intsec_query.join('|');
  }

  private async getFreemiumCategory(news_grusel: string[]) {
    let category = null;
    const grusel_intersection = intersection(news_grusel, FREEMIUM);
    if (grusel_intersection.length) {
      const news_cat: any = await this.getAllCategoriesByQuery({
        query: `(@kategorie_id: [115 115]) (@is_news_delete: [0 0])`,
      });

      //categories = news_cat[0];
      category = news_cat[0];
    }

    return category;
  }

  private pairCombination(data) {
    const result = [];

    // Generate pairs
    for (let i = 2; i <= data.length; i++) {
      const pairs = this.combination(data, i);
      result.push(...pairs);
    }

    return result;
  }

  public combination(data, length, prefix = []) {
    if (length === 0) {
      return [prefix];
    }

    return data.flatMap((v, i) =>
      this.combination(data.slice(i + 1), length - 1, [...prefix, v]),
    );
  }
}
