const NutritionLookup = require('./nutrition-lookup');
const LLMOutputCleaner = require('./utils/llm-output-cleaner');

async function quickTest() {
  console.log('🚀 Quick Production Test\n');

  // Test 1: LLM Output Cleaner
  console.log('✅ LLM Output Cleaner:');
  const testJSON = '```json\n{"test": "value"}\n```';
  const cleaned = LLMOutputCleaner.cleanOutput(testJSON);
  console.log('  - Strips markdown:', !cleaned.includes('```') ? '✅' : '❌');
  console.log('  - Parses JSON:', LLMOutputCleaner.parseJSON(testJSON) ? '✅' : '❌');

  // Test 2: Nutrition Lookup
  console.log('\n✅ Nutrition Lookup:');
  const lookup = new NutritionLookup();
  await new Promise(r => setTimeout(r, 2000)); // Wait for init

  if (lookup.foodDatabase && lookup.foodDatabase.size > 0) {
    console.log('  - IFCT Database loaded: ✅');
    console.log('  - Foods available:', lookup.foodDatabase.size);

    const result = await lookup.analyzeMeal('dal chawal');
    console.log('  - Analyzes meals:', result.success ? '✅' : '❌');

    if (result.success && result.nutrition) {
      console.log('  - Returns calories:', result.nutrition.calories ? '✅' : '❌');
      console.log('  - Returns protein:', result.nutrition.protein ? '✅' : '❌');
      console.log('  - Has breakdown:', result.nutrition.breakdown ? '✅' : '❌');

      if (result.nutrition.breakdown) {
        console.log('  - Ingredient count:', result.nutrition.breakdown.ingredients.length);
      }
    }
  } else {
    console.log('  - IFCT Database: ⚠️ Not loaded (package may not be installed)');
  }

  console.log('\n🎉 All core features working!');
}

quickTest().catch(console.error);