import Ajv from 'ajv';

const ajv = new Ajv(); 
const FEED_SCHEMA = {
    "type": "array",
    "items": {
      "type": "object",
      "required": ["text", "label"],
      "properties": {
        "text": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string",
          "enum": [
            "us_news",
            "world_news",
            "politics",
            "business",
            "technology",
            "health",
            "science",
            "entertainment",
            "lifestyle"
          ]
        }
      },
      "additionalProperties": false
    }
}
  
export const SinkValidationProvider = {
    label_required: {
        feeds: {
            /**
             * Validates data sink items for training on news feed item categorization
             * @param {Object[]} sink - a list of data sink items that may or may not have been labeled
             * @returns {[boolean, Object]}
             * 
             */
            validate(sink) {
                const result = Boolean(ajv.validate(FEED_SCHEMA, sink));
                return [ result, ajv.errors ];
            }
        }
    }
};