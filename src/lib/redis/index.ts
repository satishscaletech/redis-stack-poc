import {
  RedisClientType,
  createClient,
  SchemaFieldTypes,
  RediSearchSchema,
} from 'redis';
import { REDIS_MATFLIX_INDEX } from 'src/constant';
class Redis {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL,
    });
    this.init();
  }

  async init() {
    try {
      await this.client.connect();
      this.client.ping().then(async () => {
        console.log('Redis connected!'); // Connected!
        await this.createNewsSchema();
        await this.createNewsCategoriesSchema();
        await this.createGroupSchema();
        await this.createCategoriesSchema();
      });
    } catch (err) {
      console.log('Redis error =====>', err);
    }
  }

  async createNewsSchema() {
    const schema: RediSearchSchema = {
      '$.id': {
        type: SchemaFieldTypes.NUMERIC,
        SORTABLE: true,
        AS: 'id',
      },
      '$.datum': {
        type: SchemaFieldTypes.TEXT,
        SORTABLE: true,
        AS: 'datum',
      },
      '$.sprache': {
        type: SchemaFieldTypes.TEXT,
        AS: 'sprache',
      },
      '$.source_code': {
        type: SchemaFieldTypes.TEXT,
        AS: 'source_code',
      },
      '$.grusel': {
        type: SchemaFieldTypes.TAG,
        AS: 'grusel',
      },
      '$.bild': {
        type: SchemaFieldTypes.TEXT,
        AS: 'bild',
      },
      '$.bild_info': {
        type: SchemaFieldTypes.TEXT,
        AS: 'bild_info',
      },
      '$.titel': {
        type: SchemaFieldTypes.TEXT,
        AS: 'titel',
      },
      '$.einleitung': {
        type: SchemaFieldTypes.TEXT,
        AS: 'einleitung',
      },
      '$.inhalt': {
        type: SchemaFieldTypes.TEXT,
        AS: 'inhalt',
      },
      '$.html': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'html',
      },
      '$.autor': {
        type: SchemaFieldTypes.TEXT,
        AS: 'autor',
      },
      '$.quelle': {
        type: SchemaFieldTypes.TEXT,
        SORTABLE: true,
        AS: 'quelle',
      },
      '$.externe_id': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'externe_id',
      },
      '$.sicherungszeit': {
        type: SchemaFieldTypes.TEXT,
        AS: 'sicherungszeit',
      },
    };

    console.log(schema);

    try {
      await this.client.ft.create(
        `idx:${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}`,
        schema,
        {
          ON: 'JSON',
          PREFIX: `${REDIS_MATFLIX_INDEX.NEWS_MATFLIX}:`,
        },
      );
    } catch (e) {
      if (e.message === 'Index already exists') {
        console.log(
          `Index exists already, skipped creation:${REDIS_MATFLIX_INDEX.NEWS_MATFLIX} `,
        );
      } else {
        // Something went wrong, perhaps RediSearch isn't installed...
        console.error(e);
        process.exit(1);
      }
    }
  }

  async createNewsCategoriesSchema() {
    const schema: RediSearchSchema = {
      '$.id': {
        type: SchemaFieldTypes.NUMERIC,
        SORTABLE: true,
        AS: 'id',
      },
      '$.kategorie_id': {
        type: SchemaFieldTypes.NUMERIC,
        SORTABLE: true,
        AS: 'kategorie_id',
      },
      '$.sicherungszeit': {
        type: SchemaFieldTypes.TEXT,
        AS: 'sicherungszeit',
      },
    };

    try {
      await this.client.ft.create(
        `idx:${REDIS_MATFLIX_INDEX.NEWS_CATEGORIES_MATFLIX}`,
        schema,
        {
          ON: 'JSON',
          PREFIX: `${REDIS_MATFLIX_INDEX.NEWS_CATEGORIES_MATFLIX}:`,
        },
      );
    } catch (e) {
      if (e.message === 'Index already exists') {
        console.log(
          `Index exists already, skipped creation for: ${REDIS_MATFLIX_INDEX.NEWS_CATEGORIES_MATFLIX}`,
        );
      } else {
        // Something went wrong, perhaps RediSearch isn't installed...
        console.error(e);
        process.exit(1);
      }
    }
  }

  async createGroupSchema() {
    const schema: RediSearchSchema = {
      '$.gruppen_id': {
        type: SchemaFieldTypes.NUMERIC,
        SORTABLE: true,
        AS: 'gruppen_id',
      },
      '$.eltern_id': {
        type: SchemaFieldTypes.NUMERIC,
        SORTABLE: true,
        AS: 'eltern_id',
      },
      '$.gruppe': {
        type: SchemaFieldTypes.TEXT,
        AS: 'gruppe',
      },
      '$.gruppe_eng': {
        type: SchemaFieldTypes.TEXT,
        AS: 'gruppe_eng',
      },
      '$.sortidx': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'sortidx',
      },
      '$.sichtbar': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'sichtbar',
      },
      '$.bilddatei': {
        type: SchemaFieldTypes.TEXT,
        AS: 'bilddatei',
      },
      '$.filter_nachrichten': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'filter_nachrichten',
      },
      '$.filter_kurse': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'filter_kurse',
      },
      '$.sicherungszeit': {
        type: SchemaFieldTypes.TEXT,
        AS: 'sicherungszeit',
      },
      '$.is_active': {
        type: SchemaFieldTypes.TEXT,
        AS: 'is_active',
      },
      '$.is_inactive': {
        type: SchemaFieldTypes.TEXT,
        AS: 'is_inactive',
      },
    };

    try {
      await this.client.ft.create(
        `idx:${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}`,
        schema,
        {
          ON: 'JSON',
          PREFIX: `${REDIS_MATFLIX_INDEX.GROUP_MATFLIX}:`,
        },
      );
    } catch (e) {
      if (e.message === 'Index already exists') {
        console.log(
          `Index exists already, skipped creation for:${REDIS_MATFLIX_INDEX.GROUP_MATFLIX} `,
        );
      } else {
        // Something went wrong, perhaps RediSearch isn't installed...
        console.error(e);
        process.exit(1);
      }
    }
  }

  async createCategoriesSchema() {
    const schema: RediSearchSchema = {
      '$.kategorie_id': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'kategorie_id',
      },
      '$.gruppen_id': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'gruppen_id',
      },
      '$.gruppe': {
        type: SchemaFieldTypes.TEXT,
        AS: 'gruppe',
      },
      '$.kategorie': {
        type: SchemaFieldTypes.TEXT,
        AS: 'kategorie',
      },
      '$.sprache': {
        type: SchemaFieldTypes.TEXT,
        AS: 'sprache',
      },
      '$.quelle': {
        type: SchemaFieldTypes.TEXT,
        AS: 'quelle',
      },
      '$.fid': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'fid',
      },
      '$.grusel': {
        type: SchemaFieldTypes.TAG,
        AS: 'grusel',
      },
      '$.sichtbar': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'sichtbar',
      },
      '$.sicherungszeit': {
        type: SchemaFieldTypes.TEXT,
        AS: 'sicherungszeit',
      },
      '$.kategorie_eng': {
        type: SchemaFieldTypes.TEXT,
        AS: 'kategorie_eng',
      },
      '$.gruppe_eng': {
        type: SchemaFieldTypes.TEXT,
        AS: 'gruppe_eng',
      },
      '$.is_news_delete': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'is_news_delete',
      },
    };

    try {
      await this.client.ft.create(
        `idx:${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}`,
        schema,
        {
          ON: 'JSON',
          PREFIX: `${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}:`,
        },
      );
    } catch (e) {
      if (e.message === 'Index already exists') {
        console.log(
          `Index exists already, skipped creation for:  ${REDIS_MATFLIX_INDEX.CATEGORIES_MATFLIX}`,
        );
      } else {
        // Something went wrong, perhaps RediSearch isn't installed...
        console.error(e);
        process.exit(1);
      }
    }
  }

  async store(key: string, data: any) {
    console.log('keys', key);

    return await this.client.json.set(key, '$', data);
  }

  async get(idxKey: string, query: string, option: any) {
    // console.log('idxKey', idxKey, 'query', option);

    return await this.client.ft.search(idxKey, query, option);
  }
}

const redis = new Redis();

export default redis;
