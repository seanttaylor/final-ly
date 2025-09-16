import jsonpatch from 'fast-json-patch';
import { XMLParser } from 'fast-xml-parser';
import { ApplicationService } from '../../../types/application.js';

/**
 * Abstract class for news feeds
 */
class FeedStrategy {
  name;
  parser = new XMLParser({
    attributeNamePrefix: '',
    ignoreAttributes: false,
  });

  constructor() {
    
  }

  /**
   * @returns {Object}
   */
  getFeed() {}
}

class DefaultFeedStrategy extends FeedStrategy {
  patch;
  name;
  #feedURL;

  /**
   * @param {String} options.name
   * @param {String} options.URL
   * @param {String} options.refreshType
   * @param {Object[]} [options.patch] - optional JSON Patch document that will be applied to the raw feed item structure if it differs from that of the standard XML RSS feed
   * @param {String|undefined} [feedURLPrefix] - optional URL provided by justcors.com for proxying CORS requests
   */
  constructor({ name, URL, patch, refreshType = 'pull' }, feedURLPrefix='') {
    super();
    this.name = name;
    this.patch = patch;
    this.#feedURL = `${feedURLPrefix}${URL}`;
    this.refreshType = refreshType;
  }

  /**
   * @returns {Object}
   */
  async getFeed() {
    try {
      const request = await fetch(this.#feedURL, {
        headers: {
          'Content-Type': 'text/xml',
        },
      });
      const response = await request.text();
      let rawFeed = this.parser.parse(response);

      if (this.patch) {
        rawFeed = jsonpatch.applyPatch(rawFeed, this.patch).newDocument;
      }

      return Object.assign({}, { rss: rawFeed.rss });
    } catch (ex) {
      console.error(
        `INTERNAL_ERROR (FeedStrategy): ${this.name} strategy could not get RSS Feed. See details -> ${ex.message}`
      );
    }
  }
}

/**
 * Contains all supported feeds and their strategies
 */
export class FeedProvider extends ApplicationService {
  #feeds = {};
  #logger;
  #sandbox;

  /**
   * 
   * @param {Object} sandbox
   * @param {Object} sandbox.my 
   */
  constructor(sandbox) {
    super();
    this.#logger = sandbox.core.logger.getLoggerInstance();
    this.#sandbox = sandbox;
    this.#feeds = sandbox.my.Config.feeds;

    Object.values(this.#feeds).forEach((feed) => {
      // Some feeds are broken down by category
      // Feed configurations will *NEVER* be greater than (2) levels deep
      if (!Object.keys(feed).includes('name')) {
        Object.values(feed).forEach((subFeed) => {
          this[subFeed.name] = new DefaultFeedStrategy(subFeed, sandbox.my.Config.vars.JUST_CORS);
        });
        return;
      }
      this[feed.name] = new DefaultFeedStrategy(feed, sandbox.my.Config.vars.JUST_CORS);
    });
  }
}

/**
 * Contains JSON Patch documents for all suppported feeds to
 * enable translation from the raw feed item structure to the 
 * Current.ly canoncial feed item structure
 */
export class PatchProvider extends ApplicationService {
  constructor() {
    super();
  }

  /**
   * A post-processing module used to hack around the idiosyncrasies of JSON Patch and XML which
   * caused the image URLs from feed items to be duplicated; is
   * an answer to issue https://github.com/seanttaylor/final-ly/issues/3
   */
  PostPatch = {
    vanityfair: (item) => {
      item.thumbnail.url = item['media:thumbnail']['url'];
      delete item['media:thumbnail'];
      return Object.assign({}, item);
    },
    nytimes_world: (item) => {
      if (item['media:content'] && item['media:content']['url']) {
        item.thumbnail.url = item['media:content']['url'];
        delete item['media:content'];
        return Object.assign({}, item);
      }
      return item;
    }
  }

  abc = [
    { op: 'add', path: '/html', value: null },
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/source', value: 'CBS' },
    { op: 'add', path: '/category', value: [] },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/title/__cdata', path: '/title' },
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/description' },
    { op: 'remove', path: '/keywords' },
  ]

  aljazeera = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Financial Times' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/post-id'},
  ]

  arstechnica = [
    { op: 'add', path: '/category', value: [] },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/category', path: '/category' },
    { op: 'copy', from: '/title', path: '/title' },
    { op: 'copy', from: '/description', path: '/description' },
    { op: 'copy', from: '/link', path: '/link' },
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/source', value: 'Arstechnica' },
    { op: 'copy', from: '/media:content/url', path: '/thumbnail/url' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    {
      op: 'remove',
      path: '/slash:comments',
    },
    {
      op: 'remove',
      path: '/guid',
    },
    {
      op: 'remove',
      path: '/media:content',
    },
  ];
  
  axios = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/category', value: [] },
    { op: 'move', from: '/dc:creator', path: '/author' },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    {
      op: 'move',
      from: '/content:encoded',
      path: '/html',
    },
    {
      op: 'remove',
      path: '/guid',
    },
    { op: 'copy', from: '/media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'remove', path: '/media:content' },
    { op: 'remove', path: '/media:thumbnail' },
    { op: 'add', path: '/source', value: 'Axios' },
  ];

  bbc = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'copy', from: '/media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'add', path: '/author', value: null },
    { op: 'add', path: '/category', value: [] },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    {
      op: 'remove',
      path: '/guid',
    },
    { op: 'remove', path: '/media:thumbnail' },
    { op: 'add', path: '/source', value: 'BBC News' },
  ]

  cbs = [
    { op: 'add', path: '/html', value: null },
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/source', value: 'CBS' },
    { op: 'add', path: '/category', value: [] },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'move', from: '/image', path: '/thumbnail/url' },
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
  ]

  democracy_now = [
    { op: 'add', path: '/html', value: null },
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/source', value: 'Democracy Now' },
    { op: 'add', path: '/category', value: [] },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/content:encoded', path: '/html' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
  ]

  economist = [
    { op: 'add', path: '/author', value: null },
    { op: 'add', path: '/html', value: null },
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/source', value: 'The Economist' },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
  ]

  fastcompany = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'FastCompany' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/dc:creator', path: '/author'},
    { op: 'move', from: '/media:content/url', path: '/thumbnail/url'},
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/deck' },
    { op: 'remove', path: '/content' },
    { op: 'remove', path: '/enclosure' }
  ]

  financial_times = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Financial Times' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/title', path: '/title'},
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' }
  ]
  
  foreign_policy = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Foreign Policy' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/content:encoded', path: '/html' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/comments' },
    { op: 'remove', path: '/commentRss' },
    { op: 'remove', path: '/post-id' },
    { op: 'remove', path: '/enclosure' }
  ]

  fortune = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Fortune' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/dc:creator', path: '/author'},
    { op: 'move', from: '/content:encoded', path: '/html' },
    { op: 'move', from: '/media:content/media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/content'},
    { op: 'remove', path: '/updated'},
    { op: 'remove', path: '/modified'}
  ]

  guardian_economics = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'The Guardian' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/creator', path: '/author' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/content' }
  ]

  gizmodo = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Gizmodo' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/content:encoded/__cdata', path: '/html' },
    { op: 'move', from: '/dc:creator/__cdata', path: '/author' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/commentRss' },

  ]

  intercept = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'The Intercept' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    // { op: 'move', from: '/encoded/__cdata', path: '/html' },
    // { op: 'move', from: '/creator/__cdata', path: '/author'},
    // { op: 'move', from: '/title/__cdata', path: '/title'},
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/commentRss' },    
    { op: 'remove', path: '/comments' },
    { op: 'remove', path: '/content' },
    { op: 'remove', path: '/post-id' }
  ]

  latimes = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'The Los Angeles Times' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/creator', path: '/author' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: 'content' }
  ]

  mit_tech_review = [
    {op: 'add', path: '/thumbnail', value: { url: null}},
    { op: 'move', from: '/content:encoded', path: '/html' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    {
      op: 'remove',
      path: '/guid',
    },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    {
      op: 'add',
      path: '/source',
      value: 'MIT Technology Review',
    },
    { op: 'remove', path: '/post-id' },
  ];

  the_nation = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'The Nation' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/dc:creator/__cdata', path: '/author' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/comments'},
    { op: 'remove', path: '/commentRss'},
    { op: 'remove', path: '/guid'},
    { op: 'remove', path: '/link'}
  ]

  newsweek = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Newsweek' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/title/__cdata', path: '/title'},
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: 'guid'},
    { op: 'remove', path: '/link'}
  ]

  nytimes_world = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/source', value: 'The New York Times' },
    //{ op: 'copy', from: '/media:content/url', path: '/thumbnail/url'},
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    //{ op: 'remove', path: '/media:content'},
    { op: 'remove', path: '/atom:link'},
    { op: 'remove', path: '/guid'},
    { op: 'remove', path: '/media:credit'},
    { op: 'remove', path: '/media:description'}
  ]

  npr = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/category', value: [] },
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/image' },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'add', path: '/source', value: 'NPR' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    { op: 'move', from: '/content:encoded', path: '/html' },
  ]

  politico = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Politico' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link'},
    { op: 'remove', path: '/maz:modified' },
    { op: 'remove', path: '/media:content'},
    { op: 'remove', path: '/maz:template'},
  ]

  quartz = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Quartz' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'move', from: '/dc:creator', path: '/author' },
    { op: 'move', from: '/media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link'}
  ]

  salon = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Salon' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    { op: 'move', from: 'media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'copy', from: '/title', path: '/description' },
    { op: 'remove', from: '/media:content' },
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/content' },
  ]

  scientific_american = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Scientific American' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/link'},
    { op: 'remove', path: '/guid'},
  ]

  smithsonian_magazine = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Smithsonian Magazine' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid'  },
  ]

  science_daily = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Science Daily' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/link'},
  ]

  sydney_morning_herald = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Sydney Morning Herald' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/creator', path: '/author' },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    //{ op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/enclosure'},
  ]

  un_news = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'UN News' },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/author', value: null },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'copy', from: '/title', path: '/description'},
    { op: 'remove', path: '/guid' },
    { op: 'remove', path: '/enclosure' },
    { op: 'remove', path: '/link' },
  ]

  vanityfair = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/source', value: 'Vanity Fair' },
    //{ op: 'copy', from: '/media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    { op: 'remove', path: '/guid' },
    //{ op: 'remove', path: '/media:thumbnail' },
    { op: 'remove', path: '/media:content' },
    { op: 'remove', path: '/media:keywords' },
    { op: 'remove', path: '/dc:publisher' },
    { op: 'remove', path: '/dc:subject' },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
  ]

  wapo_world = [
    { op: 'move', from: '/dc:creator', path: '/author' },
    {
      op: 'remove',
      path: '/guid',
    },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'add', path: '/source', value: 'The Washington Post' },
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/category', value: [] },
    { op: 'add', path: '/html', value: null }
  ]

  wired_top = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value: null },
    { op: 'add', path: '/category', value: [] },
    { op: 'move', from: '/dc:creator', path: '/author' },
    {
      op: 'remove',
      path: '/guid',
    },
    {
      op: 'remove',
      path: '/media:content',
    },
    {
      op: 'remove',
      path: '/dc:publisher',
    },
    {
      op: 'remove',
      path: '/dc:subject',
    },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    {
      op: 'remove',
      path: '/media:keywords',
    },
    { op: 'copy', from: '/media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'remove', path: '/media:thumbnail' },
  ]

  vox = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/html', value:  null },
    { op: 'add', path: '/source', value: 'Vox' },
    { op: 'add', path: '/category', value: [] },
    { op: 'move', from: '/published', path: '/publicationDate' },
    { op: 'move', from: '/title/#text', path: '/title' },
    { op: 'move', from: '/author/name', path: '/author' },
    { op: 'move', from: "/content/#text", path: '/html'},
    { op: 'copy', from:  '/title', path: '/description'},
    { op: 'remove', path: '/summary' },
    { op: 'remove', path: '/link' },
    { op: 'remove', path: '/updated' },
    { op: 'remove', path: '/category' },
    { op: 'remove', path: '/id' },
    { op: 'remove', path: '/content' },
  ]

  yahoo = [
    {
      op: 'remove',
      path: '/guid',
    },
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'copy', from: '/media:content/url', path: '/thumbnail/url' },    
    { op: 'copy', from: '/title', path: '/description' },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'add', path: '/source', value: 'Yahoo News' },
    {
      op: 'remove',
      path: '/media:content',
    },
    {
      op: 'remove',
      path: '/media:credit',
    },
  ]
}
