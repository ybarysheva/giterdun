/**
 * Grocery keyword set derived from the AmirMohseni/GroceryList dataset
 * (huggingface.co/datasets/AmirMohseni/GroceryList) — 225 items, 15 categories.
 * Used by the grocery classifier to auto-sort shopping list items.
 */
export const GROCERY_KEYWORDS = new Set([
  // Produce
  'apple', 'banana', 'orange', 'lettuce', 'carrot', 'broccoli', 'tomato',
  'spinach', 'grapes', 'pear', 'kiwi', 'mango', 'strawberry', 'blueberry',
  'zucchini', 'cucumber', 'avocado',

  // Meat & Seafood
  'chicken', 'beef', 'pork', 'salmon', 'tuna', 'shrimp', 'crab', 'steak',
  'lamb', 'bacon', 'sardines', 'trout', 'tilapia', 'cod', 'turkey breast',
  'duck', 'lobster', 'turkey',

  // Dairy & Eggs
  'milk', 'cheese', 'yogurt', 'butter', 'eggs', 'cream', 'sour cream',
  'ice cream', 'buttermilk', 'cottage cheese', 'whipped cream', 'ghee',
  'feta cheese', 'goat cheese', 'ricotta', 'cream cheese',

  // Bakery
  'bread', 'bagel', 'croissant', 'muffin', 'cake', 'cookie', 'donut',
  'brownie', 'brioche', 'pita', 'ciabatta', 'sourdough', 'biscuit',
  'waffle', 'crackers', 'pastry', 'tortilla', 'wrap', 'roll',

  // Pantry
  'flour', 'sugar', 'salt', 'pepper', 'oil', 'vinegar', 'pasta sauce',
  'peanut butter', 'honey', 'soy sauce', 'tomato paste', 'oats', 'rice',
  'cereal', 'spices', 'herbs', 'yeast', 'canned tuna', 'pasta', 'noodles',
  'lentils', 'quinoa', 'breadcrumbs', 'baking soda', 'baking powder',
  'vanilla extract', 'maple syrup', 'jam', 'jelly', 'peanut butter',
  'almond butter', 'tahini', 'olive oil', 'coconut oil',

  // Frozen Foods
  'frozen pizza', 'frozen vegetables', 'frozen fries', 'frozen chicken wings',
  'frozen fish', 'frozen berries', 'frozen waffles', 'frozen dinners',
  'frozen peas', 'frozen spinach', 'frozen shrimp',

  // Beverages
  'soda', 'juice', 'water', 'coffee', 'tea', 'wine', 'beer', 'energy drink',
  'milkshake', 'sports drink', 'smoothie', 'sparkling water', 'lemonade',
  'iced tea', 'hot chocolate', 'kombucha', 'coconut water', 'almond milk',
  'oat milk', 'soy milk',

  // Snacks
  'chips', 'popcorn', 'chocolate bar', 'candy', 'cookies', 'pretzels',
  'granola bars', 'nuts', 'trail mix', 'beef jerky', 'fruit snacks',
  'cheese puffs', 'rice cakes', 'dried fruit', 'protein bars', 'hummus',
  'guacamole', 'salsa', 'chocolate', 'gum',

  // Personal Care
  'toothpaste', 'shampoo', 'soap', 'deodorant', 'lotion', 'toothbrush',
  'conditioner', 'razor', 'makeup', 'hand sanitizer', 'face wash',
  'body wash', 'mouthwash', 'shaving cream', 'nail polish', 'facial tissue',
  'sunscreen', 'lip balm', 'floss',

  // Household
  'detergent', 'dish soap', 'paper towels', 'toilet paper', 'cleaning spray',
  'trash bags', 'batteries', 'light bulbs', 'aluminum foil', 'plastic wrap',
  'sponges', 'cleaning wipes', 'bleach', 'air freshener', 'ziploc bags',
  'laundry detergent', 'fabric softener', 'dryer sheets',

  // Pet Supplies
  'dog food', 'cat food', 'bird seed', 'cat litter', 'dog treats',
  'pet shampoo', 'fish food', 'rabbit pellets',

  // Deli
  'deli meat', 'cheese slices', 'sandwich meat', 'salami', 'ham',
  'bologna', 'roast beef', 'prosciutto', 'pepperoni', 'pastrami',
  'chorizo', 'mortadella', 'smoked salmon',

  // Condiments & Sauces
  'ketchup', 'mustard', 'mayonnaise', 'bbq sauce', 'hot sauce',
  'ranch dressing', 'salad dressing', 'pesto', 'tartar sauce',
  'hoisin sauce', 'sriracha', 'vinaigrette', 'olive tapenade',
  'worcestershire sauce', 'fish sauce', 'oyster sauce',

  // Canned Goods
  'canned beans', 'canned corn', 'canned tomatoes', 'canned soup',
  'canned peas', 'canned fruit', 'canned chicken', 'chickpeas',
  'black beans', 'kidney beans', 'lentils', 'coconut milk',
  'tomato sauce', 'chicken broth', 'vegetable broth', 'beef broth',
]);
