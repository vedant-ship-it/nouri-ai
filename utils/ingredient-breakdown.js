/**
 * Ingredient breakdown system for detailed nutrition analysis
 */

class IngredientBreakdown {
  /**
   * Calculate detailed breakdown for identified foods
   * @param {array} identifiedFoods - Array of identified foods with confidence
   * @returns {object} - Detailed breakdown
   */
  static calculateBreakdown(identifiedFoods) {
    const breakdown = {
      ingredients: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalWeight: 0
    };

    identifiedFoods.forEach(({ food, confidence, estimatedWeight }) => {
      // Use estimated weight if provided, otherwise assume 100g
      const weight = estimatedWeight || 100;
      const weightMultiplier = weight / 100; // Convert to multiplier

      // Calculate nutrition based on weight
      const energyKJ = food.enerc || 0;
      const energyKcal = energyKJ * 0.239; // Convert kJ to kcal

      const calories = Math.round(energyKcal * weightMultiplier);
      const protein = Math.round((food.protcnt || 0) * weightMultiplier);
      const carbs = Math.round((food.cho || 0) * weightMultiplier);
      const fat = Math.round((food.fatce || 0) * weightMultiplier);
      const fiber = Math.round((food.fibtg || 0) * weightMultiplier);

      // Add to totals
      breakdown.totalCalories += calories;
      breakdown.totalProtein += protein;
      breakdown.totalCarbs += carbs;
      breakdown.totalFat += fat;
      breakdown.totalFiber += fiber;
      breakdown.totalWeight += weight;

      // Add ingredient details
      breakdown.ingredients.push({
        name: food.name,
        code: food.code,
        weight: weight,
        confidence: confidence,
        nutrition: {
          calories: calories,
          protein: protein,
          carbs: carbs,
          fat: fat,
          fiber: fiber
        },
        per100g: {
          calories: Math.round(energyKcal),
          protein: Math.round(food.protcnt || 0),
          carbs: Math.round(food.cho || 0),
          fat: Math.round(food.fatce || 0),
          fiber: Math.round(food.fibtg || 0)
        }
      });
    });

    return breakdown;
  }

  /**
   * Format breakdown for display
   * @param {object} breakdown - Breakdown object
   * @returns {object} - Formatted breakdown
   */
  static formatForDisplay(breakdown) {
    return {
      summary: {
        totalCalories: breakdown.totalCalories,
        totalProtein: breakdown.totalProtein,
        totalCarbs: breakdown.totalCarbs,
        totalFat: breakdown.totalFat,
        totalFiber: breakdown.totalFiber,
        totalWeight: breakdown.totalWeight,
        ingredientCount: breakdown.ingredients.length
      },
      ingredients: breakdown.ingredients.map(ing => ({
        name: ing.name,
        weight: ing.weight,
        confidence: ing.confidence,
        protein: ing.nutrition.protein,
        calories: ing.nutrition.calories,
        per100g: {
          protein: ing.per100g.protein,
          calories: ing.per100g.calories
        }
      }))
    };
  }

  /**
   * Generate table format for ingredient breakdown
   * @param {object} breakdown - Breakdown object
   * @returns {string} - Markdown table
   */
  static generateTable(breakdown) {
    let table = '| Ingredient | Grams | Protein (g) | Calories (kcal) |\n';
    table += '|------------|-------|------------|------------------|\n';

    breakdown.ingredients.forEach(ing => {
      table += `| ${ing.name} | ${ing.weight}g | ${ing.nutrition.protein}g | ${ing.nutrition.calories}kcal |\n`;
    });

    // Add totals row
    table += '| **TOTAL** | **' + breakdown.totalWeight + 'g** | **' + breakdown.totalProtein + 'g** | **' + breakdown.totalCalories + 'kcal** |\n';

    return table;
  }

  /**
   * Generate detailed nutrition report
   * @param {object} breakdown - Breakdown object
   * @returns {string} - Formatted report
   */
  static generateReport(breakdown) {
    let report = '📊 **Detailed Nutrition Breakdown**\n\n';

    report += '**Summary:**\n';
    report += `- Total Calories: ${breakdown.totalCalories} kcal\n`;
    report += `- Total Protein: ${breakdown.totalProtein}g\n`;
    report += `- Total Carbs: ${breakdown.totalCarbs}g\n`;
    report += `- Total Fat: ${breakdown.totalFat}g\n`;
    report += `- Total Fiber: ${breakdown.totalFiber}g\n`;
    report += `- Total Weight: ${breakdown.totalWeight}g\n`;
    report += `- Ingredients: ${breakdown.ingredients.length}\n\n`;

    report += '**Ingredient Breakdown:**\n';
    breakdown.ingredients.forEach((ing, index) => {
      report += `${index + 1}. **${ing.name}** (${ing.weight}g)\n`;
      report += `   - Protein: ${ing.nutrition.protein}g\n`;
      report += `   - Calories: ${ing.nutrition.calories}kcal\n`;
      report += `   - Confidence: ${ing.confidence}\n`;
      report += `   - Per 100g: ${ing.per100g.protein}g protein, ${ing.per100g.calories}kcal\n\n`;
    });

    return report;
  }

  /**
   * Estimate portion sizes based on typical Indian meal patterns
   * @param {string} foodName - Name of the food
   * @returns {number} - Estimated weight in grams
   */
  static estimatePortionSize(foodName) {
    const name = foodName.toLowerCase();

    // Typical portion sizes for Indian foods (in grams)
    const portionSizes = {
      // Rice dishes
      'rice': 150,
      'chawal': 150,
      'biryani': 200,
      'pulao': 180,

      // Bread/roti
      'roti': 40,
      'chapati': 40,
      'naan': 60,
      'paratha': 80,

      // Dal/lentils
      'dal': 100,
      'lentil': 100,
      'sambar': 120,

      // Vegetables
      'vegetable': 100,
      'sabzi': 100,
      'curry': 120,

      // Protein sources
      'paneer': 100,
      'chicken': 120,
      'fish': 100,
      'egg': 50,

      // Snacks
      'vada': 50,
      'pav': 40,
      'bhaji': 80,

      // Dairy
      'milk': 200,
      'curd': 150,
      'dahi': 150,

      // Sweets
      'sweet': 50,
      'mithai': 50,
      'dessert': 75
    };

    // Find matching portion size
    for (const [key, size] of Object.entries(portionSizes)) {
      if (name.includes(key)) {
        return size;
      }
    }

    // Default portion size
    return 100;
  }

  /**
   * Calculate macro ratios
   * @param {object} breakdown - Breakdown object
   * @returns {object} - Macro ratios
   */
  static calculateMacroRatios(breakdown) {
    const totalCalories = breakdown.totalCalories || 1;

    // Calculate calories from each macro (approximate)
    const proteinCalories = breakdown.totalProtein * 4;
    const carbCalories = breakdown.totalCarbs * 4;
    const fatCalories = breakdown.totalFat * 9;

    return {
      protein: Math.round((proteinCalories / totalCalories) * 100),
      carbs: Math.round((carbCalories / totalCalories) * 100),
      fat: Math.round((fatCalories / totalCalories) * 100)
    };
  }

  /**
   * Generate nutrition insights
   * @param {object} breakdown - Breakdown object
   * @returns {array} - Array of insights
   */
  static generateInsights(breakdown) {
    const insights = [];
    const ratios = this.calculateMacroRatios(breakdown);

    // Protein analysis
    if (ratios.protein < 15) {
      insights.push('💪 Low protein content - consider adding protein-rich foods');
    } else if (ratios.protein > 30) {
      insights.push('💪 High protein content - good for muscle building');
    }

    // Carb analysis
    if (ratios.carbs > 60) {
      insights.push('🍚 High carb content - good for energy but watch portions');
    } else if (ratios.carbs < 30) {
      insights.push('🍚 Low carb content - ensure you\'re getting enough energy');
    }

    // Fat analysis
    if (ratios.fat > 35) {
      insights.push('🥑 High fat content - choose healthy fats');
    } else if (ratios.fat < 15) {
      insights.push('🥑 Low fat content - include some healthy fats');
    }

    // Fiber analysis
    if (breakdown.totalFiber < 10) {
      insights.push('🥗 Low fiber content - add more vegetables and whole grains');
    } else if (breakdown.totalFiber > 25) {
      insights.push('🥗 High fiber content - excellent for digestion');
    }

    // Calorie analysis
    if (breakdown.totalCalories > 800) {
      insights.push('🔥 High calorie meal - good for weight gain or active lifestyle');
    } else if (breakdown.totalCalories < 300) {
      insights.push('🔥 Low calorie meal - suitable for weight loss');
    }

    return insights;
  }
}

module.exports = IngredientBreakdown;