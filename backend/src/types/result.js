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