/**
 * Utility functions for cleaning and processing LLM output
 */

class LLMOutputCleaner {
  /**
   * Clean LLM output by removing markdown code blocks and other artifacts
   * @param {string} output - Raw LLM output
   * @returns {string} - Cleaned output
   */
  static cleanOutput(output) {
    if (!output || typeof output !== 'string') {
      return '';
    }

    let cleaned = output;

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```JSON\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');

    // Remove common LLM artifacts
    cleaned = cleaned.replace(/^Here's the JSON response:\s*/i, '');
    cleaned = cleaned.replace(/^JSON response:\s*/i, '');
    cleaned = cleaned.replace(/^Response:\s*/i, '');
    cleaned = cleaned.replace(/^Output:\s*/i, '');

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Parse JSON from LLM output with error handling
   * @param {string} output - Raw LLM output
   * @returns {object|null} - Parsed JSON object or null if parsing fails
   */
  static parseJSON(output) {
    try {
      const cleaned = this.cleanOutput(output);
      return JSON.parse(cleaned);
    } catch (error) {
      console.error('Failed to parse LLM output as JSON:', error.message);
      console.error('Cleaned output:', this.cleanOutput(output));
      return null;
    }
  }

  /**
   * Safe JSON parse with fallback
   * @param {string} output - Raw LLM output
   * @param {object} fallback - Fallback value if parsing fails
   * @returns {object} - Parsed JSON or fallback
   */
  static parseJSONWithFallback(output, fallback = {}) {
    const parsed = this.parseJSON(output);
    return parsed !== null ? parsed : fallback;
  }

  /**
   * Extract JSON from mixed content (text + JSON)
   * @param {string} output - Mixed content
   * @returns {object|null} - Extracted JSON or null
   */
  static extractJSON(output) {
    if (!output || typeof output !== 'string') {
      return null;
    }

    // Try to find JSON object in the output
    const jsonPattern = /\{[\s\S]*\}/;
    const match = output.match(jsonPattern);

    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (error) {
        // If direct parsing fails, try cleaning first
        return this.parseJSON(match[0]);
      }
    }

    return null;
  }

  /**
   * Validate JSON structure against expected schema
   * @param {object} json - Parsed JSON object
   * @param {array} requiredFields - Array of required field names
   * @returns {object} - Validation result with isValid and missingFields
   */
  static validateSchema(json, requiredFields = []) {
    if (!json || typeof json !== 'object') {
      return {
        isValid: false,
        missingFields: requiredFields,
        error: 'Input is not a valid object'
      };
    }

    const missingFields = requiredFields.filter(field => !(field in json));

    return {
      isValid: missingFields.length === 0,
      missingFields,
      error: missingFields.length > 0 ? `Missing required fields: ${missingFields.join(', ')}` : null
    };
  }

  /**
   * Sanitize text output (remove special characters, normalize whitespace)
   * @param {string} text - Text to sanitize
   * @returns {string} - Sanitized text
   */
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let sanitized = text;

    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Remove potentially dangerous characters (but keep basic punctuation)
    sanitized = sanitized.replace(/[<>]/g, '');

    return sanitized;
  }

  /**
   * Extract and clean multiple JSON objects from output
   * @param {string} output - Output containing multiple JSON objects
   * @returns {array} - Array of parsed JSON objects
   */
  static extractMultipleJSON(output) {
    if (!output || typeof output !== 'string') {
      return [];
    }

    const objects = [];
    const jsonPattern = /\{[\s\S]*?\}/g;
    let match;

    while ((match = jsonPattern.exec(output)) !== null) {
      try {
        const cleaned = this.cleanOutput(match[0]);
        const parsed = JSON.parse(cleaned);
        objects.push(parsed);
      } catch (error) {
        console.warn('Failed to parse JSON object:', error.message);
      }
    }

    return objects;
  }
}

module.exports = LLMOutputCleaner;