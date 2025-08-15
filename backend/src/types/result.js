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

export class AsyncResult {
  #pipeline = [];

  constructor(value, ok = true, error = null) {
    this.value = value;
    this.ok = ok;
    this.error = error;
  }

  static ok(value) {
    return new AsyncResult(value);
  }

  static error(error) {
    return new AsyncResult(null, false, error);
  }

  isOk() {
    return this.ok;
  }

  isError() {
    return !this.ok;
  }

  getValue() {
    if (this.isError()) {
      console.info('Cannot get the value of an error AsyncResult');
      return this.error;
    }
    return this.value;
  }

  /**
   * Collects an async transformation into the pipeline.
   * Unwraps nested AsyncResults and handles errors gracefully.
   * @param {Function} asyncTransformFn
   * @returns {AsyncResult}
   */
  map(asyncTransformFn) {
    this.#pipeline.push(async (currentValue) => {
      if (this.isError()) {
        return AsyncResult.error(this.error);
      }

      try {
        // If the value is itself an AsyncResult, unwrap it before passing to transform
        const unwrappedValue =
          (currentValue instanceof AsyncResult || currentValue instanceof Result )
            ? currentValue.getValue()
            : currentValue;

        const transformed = await asyncTransformFn(unwrappedValue);

        // Avoid double-wrapping if the transform returns an AsyncResult
        return transformed instanceof AsyncResult
          ? transformed
          : AsyncResult.ok(transformed);

      } catch (ex) {
        return AsyncResult.error(ex.message);
      }
    });
    return this;
  }

  /**
   * Executes the collected async functions in sequence.
   * @returns {Promise<AsyncResult>}
   */
  async run() {
    let currentResult = this.value;

    for (const fn of this.#pipeline) {

      try { 
        currentResult = await fn(currentResult); 
        
        // If a stage fails, break early
        if (currentResult.isError()) {
          return currentResult;
        }

      } catch(ex) {
        return AsyncResult.error(ex.message);
      }
    }
    return currentResult;
  }
}

