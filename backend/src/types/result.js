export class Result {
  /**
   * Wrapper for a value returned from a function
   * @param {Any} value
   */
  static ok(value) {
    return new Result(true, value, null);
  }

  /**
   * @param {String|Object} error
   */
  static error(error) {
    return new Result(false, null, error);
  }

  /**
   * @param {Boolean} ok
   * @param {Any} value
   * @param {String|Object} error
   */
  constructor(ok, value, error) {
    this.ok = ok;
    this.value = value;
    this.error = error;
  }

  /**
   * @returns {Boolean}
   */
  isOk() {
    return this.ok;
  }

  /**
   * @returns {Boolean}
   */
  isError() {
    return !this.ok;
  }

  /**
   * Applies a transformation function to the value of the result if it is ok,
   * catching any errors thrown by the transformation function and returning them as a Result.error.
   * @param {Function} transformFn - The function to transform the value.
   * @returns {Result}
   */
  map(transformFn) {
    if (this.isOk()) {
      try {
        if (this.value instanceof Result) {
          return this.value.map(transformFn);
        } else {
          // Applies the transformation function to the unwrapped value
          const transformed = transformFn(this.value);
          // Ensures not to double-wrap if `transformFn` also returns a Result
          return transformed instanceof Result ? transformed : Result.ok(transformed);
        }
      } catch (error) {
        return Result.error(error.message);
      }
    } else {
      return this;
    }
  }

  /**
   * @returns {Object}
   */
  getValue() {
    if (this.isError()) {
      console.info('Cannot get the value of an error Result');
      return this.error;
    }
    return this.value;
  }

  /**
   * @returns {Object}
   */
  getError() {
    if (this.isOk()) {
      console.info('Cannot get the error of a success Result');
    }
    return this.error;
  }
}