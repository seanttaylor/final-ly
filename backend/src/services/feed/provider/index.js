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
  name;
  #feedURL;

  /**
   * @param {String} options.name
   * @param {String} options.URL
   * @param {String} options.refreshType
   * @param {String|undefined} feedURLPrefix - optional URL provided by justcors.com for proxying CORS requests
   */
  constructor({ name, URL, refreshType = 'pull' }, feedURLPrefix='') {
    super();
    this.name = name;
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
      const rawFeed = this.parser.parse(response);

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

  arstechnica = [
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
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    {
      op: 'remove',
      path: '/guid',
    },
    { op: 'remove', path: '/media:thumbnail' },
    { op: 'add', path: '/source', value: 'BBC News' },
  ]

  economist = [
    { op: 'add', path: '/author', value: null },
    { op: 'add', path: '/html', value: null },
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    {
      op: 'remove',
      path: '/guid',
    },
    { op: 'add', path: '/source', value: 'The Economist' },
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

  npr = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'add', path: '/category', value: [] },
    {
      op: 'remove',
      path: '/guid',
    },
    {
      op: 'remove',
      path: '/image',
    },
    { op: 'move', from: '/pubDate', path: '/publicationDate' },
    { op: 'add', path: '/source', value: 'NPR' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    { op: 'move', from: '/content:encoded', path: '/html' },
  ]

  vanityfair = [
    { op: 'add', path: '/thumbnail', value: { url: null } },
    { op: 'copy', from: '/media:thumbnail/url', path: '/thumbnail/url' },
    { op: 'move', from: '/dc:creator', path: '/author' },
    { op: 'add', path: '/source', value: 'Vanity Fair' },
    {
      op: 'remove',
      path: '/guid',
    },
    { op: 'remove', path: '/media:thumbnail' },
    {
      op: 'remove',
      path: '/media:content',
    },
    {
      op: 'remove',
      path: '/media:keywords',
    },
    {
      op: 'remove',
      path: '/dc:publisher',
    },
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
