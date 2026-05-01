/**
 * Fuzzy matching system for food identification
 * Uses advanced string matching algorithms to find closest matches
 */

class FuzzyMatcher {
  constructor() {
    this.foodDatabase = null;
    this.foodIndex = new Map();
    this.trigramIndex = new Map();
  }

  /**
   * Initialize the fuzzy matcher with food database
   * @param {Map} foodDatabase - IFCT food database
   */
  initialize(foodDatabase) {
    this.foodDatabase = foodDatabase;
    this.buildIndexes();
  }

  /**
   * Build indexes for efficient fuzzy matching
   */
  buildIndexes() {
    if (!this.foodDatabase) return;

    this.foodDatabase.forEach((food, code) => {
      const name = food.name ? food.name.toLowerCase() : '';
      const description = food.lang ? food.lang.toLowerCase() : '';

      // Build direct index
      this.foodIndex.set(name, food);

      // Build trigram index for partial matching
      this.addToTrigramIndex(name, food);
      this.addToTrigramIndex(description, food);
    });

    console.log(`Fuzzy matcher initialized with ${this.foodIndex.size} foods`);
  }

  /**
   * Add food to trigram index
   * @param {string} text - Text to index
   * @param {object} food - Food object
   */
  addToTrigramIndex(text, food) {
    if (!text) return;

    const trigrams = this.generateTrigrams(text);
    trigrams.forEach(trigram => {
      if (!this.trigramIndex.has(trigram)) {
        this.trigramIndex.set(trigram, new Set());
      }
      this.trigramIndex.get(trigram).add(food.code);
    });
  }

  /**
   * Generate trigrams from text
   * @param {string} text - Input text
   * @returns {array} - Array of trigrams
   */
  generateTrigrams(text) {
    const trigrams = [];
    const padded = `  ${text}  `; // Pad with spaces for edge trigrams

    for (let i = 0; i < padded.length - 2; i++) {
      trigrams.push(padded.substring(i, i + 3));
    }

    return trigrams;
  }

  /**
   * Find best match using fuzzy matching
   * @param {string} query - Search query
   * @param {number} threshold - Minimum similarity threshold (0-1)
   * @returns {object|null} - Best match or null
   */
  findBestMatch(query, threshold = 0.6) {
    if (!query || !this.foodDatabase) {
      return null;
    }

    const normalizedQuery = query.toLowerCase().trim();
    let bestMatch = null;
    let bestScore = 0;

    // First try exact match
    if (this.foodIndex.has(normalizedQuery)) {
      return {
        food: this.foodIndex.get(normalizedQuery),
        score: 1.0,
        matchType: 'exact'
      };
    }

    // Try fuzzy matching
    this.foodDatabase.forEach((food, code) => {
      const name = food.name ? food.name.toLowerCase() : '';
      const description = food.lang ? food.lang.toLowerCase() : '';

      // Calculate similarity scores
      const nameScore = this.calculateSimilarity(normalizedQuery, name);
      const descScore = this.calculateSimilarity(normalizedQuery, description);
      const combinedScore = Math.max(nameScore, descScore);

      if (combinedScore > bestScore && combinedScore >= threshold) {
        bestMatch = {
          food,
          score: combinedScore,
          matchType: combinedScore > 0.9 ? 'very_high' :
                    combinedScore > 0.8 ? 'high' :
                    combinedScore > 0.7 ? 'medium' : 'low'
        };
        bestScore = combinedScore;
      }
    });

    return bestMatch;
  }

  /**
   * Find multiple matches ranked by similarity
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @param {number} threshold - Minimum similarity threshold
   * @returns {array} - Array of ranked matches
   */
  findMatches(query, limit = 5, threshold = 0.5) {
    if (!query || !this.foodDatabase) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const matches = [];

    this.foodDatabase.forEach((food, code) => {
      const name = food.name ? food.name.toLowerCase() : '';
      const description = food.lang ? food.lang.toLowerCase() : '';

      const nameScore = this.calculateSimilarity(normalizedQuery, name);
      const descScore = this.calculateSimilarity(normalizedQuery, description);
      const combinedScore = Math.max(nameScore, descScore);

      if (combinedScore >= threshold) {
        matches.push({
          food,
          score: combinedScore,
          matchType: combinedScore > 0.9 ? 'very_high' :
                    combinedScore > 0.8 ? 'high' :
                    combinedScore > 0.7 ? 'medium' : 'low'
        });
      }
    });

    // Sort by score (descending) and limit results
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate similarity between two strings using multiple algorithms
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1.0;

    // Use multiple similarity measures and take the maximum
    const levenshteinScore = this.levenshteinSimilarity(str1, str2);
    const jaroScore = this.jaroWinklerSimilarity(str1, str2);
    const cosineScore = this.cosineSimilarity(str1, str2);

    return Math.max(levenshteinScore, jaroScore, cosineScore);
  }

  /**
   * Levenshtein distance based similarity
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   */
  levenshteinSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Edit distance
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Jaro-Winkler similarity
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   */
  jaroWinklerSimilarity(str1, str2) {
    const jaroScore = this.jaroSimilarity(str1, str2);

    // Winkler modification: boost score for common prefix
    let prefix = 0;
    const maxPrefix = 4;
    for (let i = 0; i < Math.min(str1.length, str2.length, maxPrefix); i++) {
      if (str1[i] === str2[i]) {
        prefix++;
      } else {
        break;
      }
    }

    return jaroScore + (prefix * 0.1 * (1 - jaroScore));
  }

  /**
   * Jaro similarity
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   */
  jaroSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;

    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0 || len2 === 0) return 0.0;

    const matchDistance = Math.floor(Math.max(len1, len2) / 2) - 1;
    if (matchDistance < 0) return 0.0;

    const str1Matches = new Array(len1).fill(false);
    const str2Matches = new Array(len2).fill(false);

    let matches = 0;
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, len2);

      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < len1; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }

    return (
      (matches / len1 +
       matches / len2 +
       (matches - transpositions / 2) / matches) / 3
    );
  }

  /**
   * Cosine similarity using character n-grams
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} - Similarity score (0-1)
   */
  cosineSimilarity(str1, str2) {
    const ngrams1 = this.getNGrams(str1, 2);
    const ngrams2 = this.getNGrams(str2, 2);

    const allNGrams = new Set([...ngrams1, ...ngrams2]);

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    allNGrams.forEach(ngram => {
      const count1 = ngrams1.filter(n => n === ngram).length;
      const count2 = ngrams2.filter(n => n === ngram).length;

      dotProduct += count1 * count2;
      magnitude1 += count1 * count1;
      magnitude2 += count2 * count2;
    });

    if (magnitude1 === 0 || magnitude2 === 0) return 0.0;

    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
  }

  /**
   * Get character n-grams from string
   * @param {string} str - Input string
   * @param {number} n - N-gram size
   * @returns {array} - Array of n-grams
   */
  getNGrams(str, n) {
    const ngrams = [];
    for (let i = 0; i < str.length - n + 1; i++) {
      ngrams.push(str.substring(i, i + n));
    }
    return ngrams;
  }

  /**
   * Find similar foods based on trigram matching
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {array} - Array of similar foods
   */
  findSimilarByTrigrams(query, limit = 10) {
    if (!query || !this.foodDatabase) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const queryTrigrams = this.generateTrigrams(normalizedQuery);
    const scores = new Map();

    // Score foods based on trigram overlap
    queryTrigrams.forEach(trigram => {
      const foodCodes = this.trigramIndex.get(trigram) || new Set();
      foodCodes.forEach(code => {
        scores.set(code, (scores.get(code) || 0) + 1);
      });
    });

    // Convert scores to array and sort
    const results = [];
    scores.forEach((score, code) => {
      const food = this.foodDatabase.get(code);
      if (food) {
        const normalizedScore = score / Math.max(queryTrigrams.length, 1);
        results.push({
          food,
          score: normalizedScore,
          matchType: normalizedScore > 0.8 ? 'very_high' :
                    normalizedScore > 0.6 ? 'high' :
                    normalizedScore > 0.4 ? 'medium' : 'low'
        });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

module.exports = FuzzyMatcher;