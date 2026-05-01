/**
 * NIM Bridge - Nutrition Information Management Bridge
 * Handles unknown dishes by searching for typical composition
 */

class NIMBridge {
  constructor() {
    this.cache = new Map();
    this.fallbackDatabase = this.buildFallbackDatabase();
  }

  /**
   * Build fallback database with common Indian dishes
   * @returns {Map} - Fallback database
   */
  buildFallbackDatabase() {
    const database = new Map();

    // Common Indian dishes with typical composition
    const dishes = {
      'chatpati bhaji': {
        ingredients: [
          { name: 'Mixed vegetables', weight: 150, protein: 4, calories: 120 },
          { name: 'Onion', weight: 30, protein: 1, calories: 12 },
          { name: 'Tomato', weight: 30, protein: 1, calories: 18 },
          { name: 'Spices', weight: 10, protein: 2, calories: 30 },
          { name: 'Oil', weight: 15, protein: 0, calories: 135 }
        ],
        totalCalories: 315,
        totalProtein: 8,
        totalCarbs: 25,
        totalFat: 18,
        totalFiber: 6
      },
      'mixed vegetable curry': {
        ingredients: [
          { name: 'Mixed vegetables', weight: 200, protein: 5, calories: 160 },
          { name: 'Onion', weight: 40, protein: 1, calories: 16 },
          { name: 'Tomato', weight: 40, protein: 1, calories: 24 },
          { name: 'Ginger garlic paste', weight: 10, protein: 1, calories: 15 },
          { name: 'Spices', weight: 15, protein: 2, calories: 40 },
          { name: 'Oil', weight: 20, protein: 0, calories: 180 }
        ],
        totalCalories: 435,
        totalProtein: 10,
        totalCarbs: 30,
        totalFat: 28,
        totalFiber: 8
      },
      'paneer tikka': {
        ingredients: [
          { name: 'Paneer', weight: 150, protein: 18, calories: 345 },
          { name: 'Yogurt', weight: 50, protein: 3, calories: 30 },
          { name: 'Spices', weight: 10, protein: 2, calories: 25 },
          { name: 'Oil', weight: 10, protein: 0, calories: 90 }
        ],
        totalCalories: 490,
        totalProtein: 23,
        totalCarbs: 8,
        totalFat: 38,
        totalFiber: 1
      },
      'butter chicken': {
        ingredients: [
          { name: 'Chicken', weight: 150, protein: 31, calories: 240 },
          { name: 'Tomato', weight: 100, protein: 2, calories: 60 },
          { name: 'Onion', weight: 50, protein: 1, calories: 20 },
          { name: 'Butter', weight: 30, protein: 0, calories: 216 },
          { name: 'Cream', weight: 50, protein: 1, calories: 103 },
          { name: 'Spices', weight: 15, protein: 2, calories: 40 }
        ],
        totalCalories: 679,
        totalProtein: 37,
        totalCarbs: 15,
        totalFat: 52,
        totalFiber: 3
      },
      'chole bhature': {
        ingredients: [
          { name: 'Chickpeas', weight: 100, protein: 9, calories: 164 },
          { name: 'Maida flour', weight: 100, protein: 10, calories: 364 },
          { name: 'Onion', weight: 30, protein: 1, calories: 12 },
          { name: 'Tomato', weight: 30, protein: 1, calories: 18 },
          { name: 'Oil', weight: 25, protein: 0, calories: 225 },
          { name: 'Spices', weight: 10, protein: 2, calories: 30 }
        ],
        totalCalories: 813,
        totalProtein: 23,
        totalCarbs: 95,
        totalFat: 35,
        totalFiber: 12
      },
      'masala dosa': {
        ingredients: [
          { name: 'Rice batter', weight: 100, protein: 3, calories: 160 },
          { name: 'Potato filling', weight: 80, protein: 2, calories: 120 },
          { name: 'Oil', weight: 20, protein: 0, calories: 180 },
          { name: 'Chutney', weight: 30, protein: 1, calories: 45 }
        ],
        totalCalories: 505,
        totalProtein: 6,
        totalCarbs: 65,
        totalFat: 22,
        totalFiber: 4
      },
      'samosa': {
        ingredients: [
          { name: 'Maida flour', weight: 30, protein: 3, calories: 109 },
          { name: 'Potato', weight: 50, protein: 1, calories: 77 },
          { name: 'Peas', weight: 20, protein: 1, calories: 18 },
          { name: 'Oil', weight: 15, protein: 0, calories: 135 },
          { name: 'Spices', weight: 5, protein: 1, calories: 15 }
        ],
        totalCalories: 354,
        totalProtein: 6,
        totalCarbs: 30,
        totalFat: 22,
        totalFiber: 3
      },
      'vada pav': {
        ingredients: [
          { name: 'Potato vada', weight: 80, protein: 3, calories: 200 },
          { name: 'Pav bread', weight: 40, protein: 3, calories: 120 },
          { name: 'Chutney', weight: 10, protein: 0, calories: 15 },
          { name: 'Oil', weight: 10, protein: 0, calories: 90 }
        ],
        totalCalories: 425,
        totalProtein: 6,
        totalCarbs: 50,
        totalFat: 20,
        totalFiber: 4
      },
      'rajma chawal': {
        ingredients: [
          { name: 'Kidney beans', weight: 100, protein: 8, calories: 127 },
          { name: 'Rice', weight: 150, protein: 4, calories: 195 },
          { name: 'Onion', weight: 30, protein: 1, calories: 12 },
          { name: 'Tomato', weight: 30, protein: 1, calories: 18 },
          { name: 'Oil', weight: 15, protein: 0, calories: 135 },
          { name: 'Spices', weight: 10, protein: 2, calories: 30 }
        ],
        totalCalories: 517,
        totalProtein: 16,
        totalCarbs: 75,
        totalFat: 18,
        totalFiber: 10
      },
      'palak paneer': {
        ingredients: [
          { name: 'Spinach', weight: 150, protein: 5, calories: 39 },
          { name: 'Paneer', weight: 100, protein: 18, calories: 265 },
          { name: 'Onion', weight: 30, protein: 1, calories: 12 },
          { name: 'Tomato', weight: 30, protein: 1, calories: 18 },
          { name: 'Cream', weight: 30, protein: 1, calories: 62 },
          { name: 'Oil', weight: 15, protein: 0, calories: 135 }
        ],
        totalCalories: 531,
        totalProtein: 26,
        totalCarbs: 12,
        totalFat: 40,
        totalFiber: 6
      }
    };

    Object.entries(dishes).forEach(([name, data]) => {
      database.set(name.toLowerCase(), data);
    });

    return database;
  }

  /**
   * Search for dish nutrition information
   * @param {string} dishName - Name of the dish
   * @returns {object|null} - Nutrition information or null
   */
  async searchDish(dishName) {
    const normalizedName = dishName.toLowerCase().trim();

    // Check cache first
    if (this.cache.has(normalizedName)) {
      return this.cache.get(normalizedName);
    }

    // Search in fallback database
    const fallbackResult = this.searchFallbackDatabase(normalizedName);
    if (fallbackResult) {
      this.cache.set(normalizedName, fallbackResult);
      return fallbackResult;
    }

    // Try to construct from ingredients
    const constructedResult = await this.constructFromIngredients(dishName);
    if (constructedResult) {
      this.cache.set(normalizedName, constructedResult);
      return constructedResult;
    }

    return null;
  }

  /**
   * Search in fallback database
   * @param {string} dishName - Name of the dish
   * @returns {object|null} - Nutrition information or null
   */
  searchFallbackDatabase(dishName) {
    // Try exact match first
    if (this.fallbackDatabase.has(dishName)) {
      return this.fallbackDatabase.get(dishName);
    }

    // Try partial match
    for (const [key, value] of this.fallbackDatabase.entries()) {
      if (dishName.includes(key) || key.includes(dishName)) {
        return value;
      }
    }

    return null;
  }

  /**
   * Construct nutrition from ingredients using AI
   * @param {string} dishName - Name of the dish
   * @returns {object|null} - Constructed nutrition or null
   */
  async constructFromIngredients(dishName) {
    // This would typically call an AI service to analyze the dish
    // For now, return a generic estimate based on dish type

    const dishType = this.classifyDishType(dishName);
    return this.getGenericEstimate(dishType);
  }

  /**
   * Classify dish type
   * @param {string} dishName - Name of the dish
   * @returns {string} - Dish type
   */
  classifyDishType(dishName) {
    const name = dishName.toLowerCase();

    if (name.includes('curry') || name.includes('sabzi') || name.includes('bhaji')) {
      return 'vegetable_curry';
    } else if (name.includes('dal') || name.includes('lentil') || name.includes('sambar')) {
      return 'dal';
    } else if (name.includes('rice') || name.includes('pulao') || name.includes('biryani')) {
      return 'rice_dish';
    } else if (name.includes('roti') || name.includes('naan') || name.includes('paratha')) {
      return 'bread';
    } else if (name.includes('paneer') || name.includes('cheese')) {
      return 'paneer_dish';
    } else if (name.includes('chicken') || name.includes('meat')) {
      return 'meat_dish';
    } else if (name.includes('fish')) {
      return 'fish_dish';
    } else if (name.includes('sweet') || name.includes('dessert') || name.includes('mithai')) {
      return 'sweet';
    } else if (name.includes('snack') || name.includes('chaat')) {
      return 'snack';
    } else {
      return 'general';
    }
  }

  /**
   * Get generic nutrition estimate for dish type
   * @param {string} dishType - Type of dish
   * @returns {object} - Generic nutrition estimate
   */
  getGenericEstimate(dishType) {
    const estimates = {
      'vegetable_curry': {
        totalCalories: 350,
        totalProtein: 8,
        totalCarbs: 30,
        totalFat: 22,
        totalFiber: 6,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'dal': {
        totalCalories: 250,
        totalProtein: 12,
        totalCarbs: 35,
        totalFat: 8,
        totalFiber: 8,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'rice_dish': {
        totalCalories: 400,
        totalProtein: 8,
        totalCarbs: 70,
        totalFat: 10,
        totalFiber: 4,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'bread': {
        totalCalories: 200,
        totalProtein: 6,
        totalCarbs: 35,
        totalFat: 5,
        totalFiber: 3,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'paneer_dish': {
        totalCalories: 450,
        totalProtein: 20,
        totalCarbs: 15,
        totalFat: 35,
        totalFiber: 2,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'meat_dish': {
        totalCalories: 500,
        totalProtein: 30,
        totalCarbs: 20,
        totalFat: 35,
        totalFiber: 3,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'fish_dish': {
        totalCalories: 350,
        totalProtein: 28,
        totalCarbs: 15,
        totalFat: 20,
        totalFiber: 2,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'sweet': {
        totalCalories: 400,
        totalProtein: 5,
        totalCarbs: 60,
        totalFat: 15,
        totalFiber: 1,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'snack': {
        totalCalories: 350,
        totalProtein: 6,
        totalCarbs: 40,
        totalFat: 18,
        totalFiber: 4,
        confidence: 'low',
        source: 'generic_estimate'
      },
      'general': {
        totalCalories: 350,
        totalProtein: 10,
        totalCarbs: 40,
        totalFat: 15,
        totalFiber: 4,
        confidence: 'very_low',
        source: 'generic_estimate'
      }
    };

    return estimates[dishType] || estimates['general'];
  }

  /**
   * Get nutrition information for multiple dishes
   * @param {array} dishNames - Array of dish names
   * @returns {array} - Array of nutrition information
   */
  async searchMultipleDishes(dishNames) {
    const results = [];

    for (const dishName of dishNames) {
      const nutrition = await this.searchDish(dishName);
      if (nutrition) {
        results.push({
          name: dishName,
          ...nutrition
        });
      }
    }

    return results;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

module.exports = NIMBridge;