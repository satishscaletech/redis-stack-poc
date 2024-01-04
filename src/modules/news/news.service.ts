import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import redis from '../../lib/redis';
import * as StreamArray from 'stream-json/streamers/StreamArray';
import { getPaginateOffset } from 'src/helper';
import { REDIS_MATFLIX_INDEX } from 'src/constant';
import { newsResponseDto } from './dto/news.res.dto';
// const StreamArray = require('stream-json/streamers/StreamArray');

@Injectable()
export class NewsService {
  public async storeNews() {
    const readStream = await fs
      .createReadStream(
        '/home/scaletech-sm/Downloads/newsMatflix101.json',
        'utf-8',
      )
      .pipe(StreamArray.withParser());

    readStream.on('data', async function (chunk) {
      const news = chunk.value;

      if (news.grusel) {
        console.log('news.grusel', news.grusel);

        news.id = news.id;
        news.datum = news.datum ?? '';
        news.sprache = news.sprache ?? '';
        news.source_code = news.source_code ?? '';
        news.grusel = news.grusel ? news.grusel.split(' ') : [''];
        news.bild = news.bild ?? '';
        news.bild_info = news.bild_info ?? '';
        news.titel = news.titel ?? '';
        news.einleitung = news.einleitung ?? '';
        news.inhalt = news.inhalt ?? '';
        news.html = news.html ?? 0;
        news.autor = news.auto ?? '';
        news.quelle = news.quelle ?? '';
        news.externe_id = news.externe_id ?? 0;
        news.sicherungszeit = news.sicherungszeit ?? '';
        const res = await redis.store(
          `${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}:${news.id}`,
          news,
        );
        console.log('Redis res', res);
      }
    });

    readStream.on('end', function () {
      console.log('finished reading');
      // write to file here.
    });
  }

  public async storeCategories() {
    const readStream = fs
      .createReadStream(
        '/home/scaletech-sm/Downloads/categoriesMatflix101.json',
        'utf-8',
      )
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
      // categories.grusel = categories.grusel ?? '';
      categories.sichtbar = categories.sichtbar ?? 0;
      categories.sicherungszeit = categories.sicherungszeit ?? '';
      categories.kategorie_eng = categories.kategorie_eng ?? '';
      categories.gruppe_eng = categories.gruppe_eng ?? '';
      categories.is_news_delete = categories.is_news_delete ?? 0;

      const res = await redis.store(
        `${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}:${chunk.key + 1}`,
        categories,
      );
      console.log('Redis res', res);
    });

    readStream.on('end', async () => {
      console.log('finished reading');
    });
  }

  public async storeNewsCategories() {
    const readStream = fs
      .createReadStream(
        '/home/nishaltaylor/Downloads/nachrichten_x_kategorien_202312271444.json',
        'utf-8',
      )
      .pipe(StreamArray.withParser());

    readStream.on('data', async (chunk) => {
      const newsCategories = chunk.value;

      newsCategories.id = newsCategories.id ?? '';
      newsCategories.kategorie_id = newsCategories.kategorie_id ?? '';
      newsCategories.sicherungszeit = newsCategories.sicherungszeit ?? '';

      const res = await redis.store(
        `newsCategoriesMatflix11:${newsCategories.id}`,
        newsCategories,
      );
      // console.log('Redis res', res);
    });

    readStream.on('end', async () => {
      console.info('finished reading');
    });
  }

  public async storeGroup() {
    const readStream = fs
      .createReadStream(
        '/home/scaletech-sm/Downloads/matflix_group.json',
        'utf-8',
      )
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
      console.log('Redis res', res);
    });

    readStream.on('end', async () => {
      console.info('finished reading');
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

  public async newsByGrusel(dto: any) {
    const { limit, offset } = getPaginateOffset(dto.page, dto.recordPerPage);
    const option: any = {
      LIMIT: {
        from: offset ? offset : 0,
        size: limit ? limit : 9,
      },
    };
    //(@grusel: MSDESTP @grusel: MSKPUR)|(@grusel: ESMOL)|(@grusel: ESTHA)|(@grusel: ESTMA)
    const groups = await redis.get(
      `idx:${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}`,
      // '@grusel: {ESTHA}',
      // '(@grusel: {ESTHA} @grusel: {ESMCO}) | (@grusel: {ESMST} @grusel: {ESTNE})',
      dto.query,
      option,
    );

    // console.log('groups', groups);

    return groups;
  }

  public async getNewsByGrusel(dto: { grusel: []; kategorie_id: string[] }) {
    const category_query = dto.kategorie_id.map((id) => {
      return `(@kategorie_id: [${id} ${id}])`;
    });
    const categories = await this.getAllCategoriesByQuery({
      query: category_query.join(' | '),
    });
    // ('(@grusel: {ESTHA} @grusel: {ESMCO}) | (@grusel: {ESMST} @grusel: {ESTNE})');
    const grusel_query = categories.map(
      (category: { kategorie_id: number; grusel: [] }) => {
        const tagQuery = category.grusel.map((tags) => {
          return `@grusel: {${tags}}`;
        });

        return `(${tagQuery.join(' ')})`;
      },
    );

    const news_gruesel_query = grusel_query.join('|');

    const news = await this.newsByGrusel({ query: news_gruesel_query });

    for (const news1 of news.documents) {
      const news_cat: any = await this.getAllCategoriesByQuery({
        query: `@grusel: {${dto.grusel.join(' | ')}}`,
      });
      // const news_cat = await this.getNewsCategories2({
      //   query: `@grusel: {ESTHA} @grusel: {ESMCO}`,
      // });

      const match_cat = [];

      for (const categories of news_cat) {
        if (dto.kategorie_id.includes(String(categories.kategorie_id))) {
          const group_id_query = `@gruppen_id: [${categories.gruppen_id} ${categories.gruppen_id}]`;

          const group = await redis.get(
            `idx:${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}`,
            group_id_query,
            {},
          );

          const groupRes = group.documents.map((doc) => doc.value);

          categories.parentGroup = groupRes;

          match_cat.push(categories);
        }
      }
      news1.value['tags'] = match_cat;
    }
    const newsData1 = news.documents.map(
      (doc) => new newsResponseDto(doc.value),
    );
    return { data: newsData1 };
  }
}
