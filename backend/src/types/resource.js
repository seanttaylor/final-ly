class Resource {
  pages = 1;
  pageSize;
  date;
  name;

  /**
   * @param {String} name
   * @param {Object} optionvideos,
   */
  constructor(
    name,
    options = {
      lastModified: null,
      pageSize: 10,
      paginated: false,
    }
  ) {
    this.date = new Date().toISOString();
    this.name = name;
    this.isPaginated = options.paginated;
    this.lastModified = options.lastModified;
    this.pageSize = options.pageSize;
  }

  /**
   * Returns resource metadata
   */
  get info() {
    return {
      date: this.date,
      isPaginated: this.isPaginated,
      lastModified: this.lastModified || null,
      pageSize: this.pageSize,
      pages: this.pages,
      name: this.name,
    };
  }

  /**
   * Provide the implementation of this method for custom resource data processing
   * @param {Any[]} data
   */
  set(data) {}

  /**
   * Advance through paginated resources
   * @returns {Object}
   */
  next() {}

  /**
   * Back-navigate through paginated resources
   * @returns {Object}
   */
  prev() {}

  /**
   * @returns {Object}
   */
  toJSON() {}
}

export class FeedResource extends Resource {
  #data;

  /**
   * @param {Object} options
   * @param {Boolean} options.paginated
   * @param {Number} options.pageSize
   */
  constructor(options) {
    super('ice_cream', options);
  }

  /**
   * Override set method to handle feed-specific processing
   * @param {Result<Object[]>} feedData - Array of feed objects (may include nulls)
   */
  set(feedData) {
    const { items, error } = feedData.getValue();

    if (!items.length || error) {
      this.#data = [{ items: [] }];
    }

    this.#data = items;

    if (this.#data.length > this.pageSize) {
      this.hasNext = true;
    }

    this.count = this.#data.length;
    this.pages = Math.ceil(this.count / this.pageSize);
    this.cursor = this.pageSize;
  }

  /**
   * @returns {Object[]}
   */
  next() {
    const newCursor = this.pageSize + this.cursor;
    const records = this.#data.slice(this.cursor, newCursor);

    this.cursor = newCursor;
    this.hasNext = Boolean(records.length);

    return records;
  }

  /**
   * @returns {Object}
   */
  prev() {

  }

  get info() {
    return {
      ...super.info,
      count: this.count,
      hasNext: this.hasNext,
      offset: this.cursor,
    };
  }

  toJSON() {
    if (this.isPaginated) {
      return this.#data.slice(0, this.cursor);
    }

    return this.#data;
  }
}