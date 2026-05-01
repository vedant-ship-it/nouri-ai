const ifct = require('ifct2017');
const FuzzyMatcher = require('./utils/fuzzy-matcher');
const IngredientBreakdown = require('./utils/ingredient-breakdown');
const NIMBridge = require('./utils/nim-bridge');

class NutritionLookup {
  constructor() {
    this.foodDatabase = null;
    this.commonIndianFoods = {};
    this.fuzzyMatcher = new FuzzyMatcher();
    this.nimBridge = new NIMBridge();
    this.initialize();
  }

  async initialize() {
    try {
      // Load the IFCT data
      this.foodDatabase = await ifct.compositions.load();
      this.commonIndianFoods = this.buildFoodIndex();
      this.fuzzyMatcher.initialize(this.foodDatabase);
      console.log(`Loaded ${this.foodDatabase.size} foods from IFCT database`);
    } catch (error) {
      console.error('Error loading IFCT data:', error);
      this.foodDatabase = new Map();
    }
  }

  buildFoodIndex() {
    const index = {};

    this.foodDatabase.forEach((food, code) => {
      const name = food.name ? food.name.toLowerCase() : '';
      const description = food.lang ? food.lang.toLowerCase() : '';

      // Add exact name match
      if (name) {
        index[name] = food;
      }

      // Add common variations
      const variations = this.getFoodVariations(name, description);
      variations.forEach(variation => {
        if (!index[variation]) {
          index[variation] = food;
        }
      });
    });

    return index;
  }

  getFoodVariations(name, description) {
    const variations = [];

    if (!name) return variations;

    variations.push(name);

    // Common Indian food variations
    const variationMap = {
      'rice': ['chawal', 'rice', 'bhat', 'chawal'],
      'dal': ['lentil', 'dhal', 'pulses', 'dal'],
      'roti': ['chapati', 'roti', 'phulka', 'bread', 'roti'],
      'paneer': ['cottage cheese', 'paneer'],
      'chicken': ['murg', 'chicken', 'murgh'],
      'fish': ['machli', 'fish', 'meen'],
      'egg': ['anda', 'egg', 'eggs'],
      'milk': ['doodh', 'milk', 'dudh'],
      'curd': ['dahi', 'yogurt', 'curd', 'yoghurt'],
      'vegetable': ['sabzi', 'vegetable', 'veggie'],
      'potato': ['aloo', 'potato', 'alu', 'aloo'],
      'onion': ['pyaz', 'onion', 'kanda'],
      'tomato': ['tamatar', 'tomato'],
      'garlic': ['lahsun', 'garlic'],
      'ginger': ['adrak', 'ginger'],
      'ghee': ['clarified butter', 'ghee'],
      'oil': ['tel', 'oil', 'tail'],
      'sugar': ['chini', 'sugar', 'shakar'],
      'salt': ['namak', 'salt'],
      'wheat': ['gehun', 'wheat', 'atta'],
      'flour': ['atta', 'flour', 'maida'],
    };

    // Add variations based on the map
    Object.entries(variationMap).forEach(([key, values]) => {
      if (name.includes(key) || description.includes(key)) {
        values.forEach(variation => {
          if (!variations.includes(variation)) {
            variations.push(variation);
          }
        });
      }
    });

    return variations;
  }

  identifyFoods(text) {
    if (!this.foodDatabase || this.foodDatabase.size === 0) {
      return [];
    }

    const identifiedFoods = [];
    const words = text.toLowerCase().split(/\s+/);
    const usedFoods = new Set(); // Track used foods to avoid duplicates

    // Try to match each word or combination
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Skip common words that aren't foods
      if (this.isNonFoodWord(word)) {
        continue;
      }

      // Single word match using fuzzy matcher
      const fuzzyMatch = this.fuzzyMatcher.findBestMatch(word, 0.7);
      if (fuzzyMatch && !usedFoods.has(fuzzyMatch.food.code)) {
        identifiedFoods.push({
          food: fuzzyMatch.food,
          matchedText: word,
          confidence: fuzzyMatch.matchType === 'very_high' || fuzzyMatch.matchType === 'high' ? 'high' : 'medium',
          estimatedWeight: IngredientBreakdown.estimatePortionSize(word)
        });
        usedFoods.add(fuzzyMatch.food.code);
        continue;
      }

      // Two word combination
      if (i < words.length - 1) {
        const twoWords = `${words[i]} ${words[i + 1]}`;
        const twoWordMatch = this.fuzzyMatcher.findBestMatch(twoWords, 0.7);

        if (twoWordMatch && !usedFoods.has(twoWordMatch.food.code)) {
          identifiedFoods.push({
            food: twoWordMatch.food,
            matchedText: twoWords,
            confidence: twoWordMatch.matchType === 'very_high' || twoWordMatch.matchType === 'high' ? 'high' : 'medium',
            estimatedWeight: IngredientBreakdown.estimatePortionSize(twoWords)
          });
          usedFoods.add(twoWordMatch.food.code);
          i++; // Skip next word since we used it
          continue;
        }
      }

      // Partial match - search for foods containing this word
      const partialMatches = this.findPartialMatches(word, usedFoods);
      partialMatches.forEach(match => {
        identifiedFoods.push({
          food: match.food,
          matchedText: word,
          confidence: match.confidence,
          estimatedWeight: IngredientBreakdown.estimatePortionSize(word)
        });
        usedFoods.add(match.food.code);
      });
    }

    return identifiedFoods;
  }

  isNonFoodWord(word) {
    const nonFoodWords = ['and', 'with', 'for', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'of', 'or', 'but', 'so', 'very', 'some', 'any', 'much', 'many', 'more', 'less', 'like', 'just', 'only', 'also', 'then', 'than', 'when', 'where', 'how', 'what', 'which', 'this', 'that', 'these', 'those'];
    return nonFoodWords.includes(word);
  }

  findPartialMatches(word, usedFoods) {
    const matches = [];

    this.foodDatabase.forEach((food, code) => {
      if (usedFoods.has(code)) return;

      const name = food.name ? food.name.toLowerCase() : '';
      const description = food.lang ? food.lang.toLowerCase() : '';

      // Check if word appears in food name or description
      if (name.includes(word) || description.includes(word)) {
        // Calculate confidence based on how well the word matches
        let confidence = 'medium';

        // High confidence if word is a major part of the name
        if (name === word || name.startsWith(word + ' ') || name.endsWith(' ' + word)) {
          confidence = 'high';
        }

        matches.push({
          food,
          confidence
        });
      }
    });

    // Sort by confidence and return best matches
    return matches.sort((a, b) => {
      if (a.confidence === b.confidence) return 0;
      return a.confidence === 'high' ? -1 : 1;
    }).slice(0, 3); // Limit to 3 matches per word
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

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

  calculateNutrition(identifiedFoods) {
    // Use IngredientBreakdown for detailed calculation
    const breakdown = IngredientBreakdown.calculateBreakdown(identifiedFoods);

    return {
      calories: breakdown.totalCalories,
      protein: breakdown.totalProtein,
      carbs: breakdown.totalCarbs,
      fat: breakdown.totalFat,
      fiber: breakdown.totalFiber,
      foodsIdentified: identifiedFoods.length,
      confidence: this.calculateOverallConfidence(identifiedFoods),
      breakdown: breakdown // Include detailed breakdown
    };
  }

  calculateOverallConfidence(identifiedFoods) {
    if (identifiedFoods.length === 0) return 'low';

    const highConfidenceCount = identifiedFoods.filter(f => f.confidence === 'high').length;
    const ratio = highConfidenceCount / identifiedFoods.length;

    if (ratio >= 0.7) return 'high';
    if (ratio >= 0.4) return 'medium';
    return 'low';
  }

  async analyzeMeal(text) {
    // Wait for initialization if needed
    if (!this.foodDatabase) {
      await this.initialize();
    }

    const identifiedFoods = this.identifyFoods(text);

    if (identifiedFoods.length === 0) {
      // Try to find dish using NIM Bridge
      const dishNutrition = await this.nimBridge.searchDish(text);

      if (dishNutrition) {
        return {
          success: true,
          identifiedFoods: [{
            name: text,
            matchedText: text,
            confidence: dishNutrition.confidence || 'low',
            source: dishNutrition.source || 'nim_bridge'
          }],
          nutrition: {
            ...dishNutrition,
            foodsIdentified: 1,
            confidence: dishNutrition.confidence || 'low'
          },
          message: `Dish found using NIM Bridge with ${dishNutrition.confidence || 'low'} confidence.`,
          dataSource: 'NIM Bridge (Fallback Database)'
        };
      }

      return {
        success: false,
        message: 'Could not identify any foods. Please try more specific food names.',
        nutrition: null
      };
    }

    const nutrition = this.calculateNutrition(identifiedFoods);

    return {
      success: true,
      identifiedFoods: identifiedFoods.map(f => ({
        name: f.food.name,
        matchedText: f.matchedText,
        confidence: f.confidence,
        estimatedWeight: f.estimatedWeight
      })),
      nutrition,
      message: `Identified ${identifiedFoods.length} food(s) with ${nutrition.confidence} confidence.`
    };
  }
}

module.exports = NutritionLookup;