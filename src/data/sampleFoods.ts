/**
 * Generates sample meal canvas images for instant 1-tap testing
 */
export interface SampleFoodOption {
  id: string;
  name: string;
  cuisine: string;
  description: string;
  emoji: string;
  hint: string;
  colorScheme: [string, string];
  tags: string[];
}

export const SAMPLE_FOOD_OPTIONS: SampleFoodOption[] = [
  {
    id: 'biryani-plate',
    name: 'Chicken Biryani Platter',
    cuisine: 'Indian',
    description: 'Fragrant basmati rice, tender chicken curry, yellow dal tadka, and onion cucumber salad',
    emoji: '🍛',
    hint: 'Indian meal platter with Chicken Biryani, Dal Tadka, and fresh salad',
    colorScheme: ['#f59e0b', '#d97706'],
    tags: ['Rice', 'Chicken', 'Dal', 'Salad'],
  },
  {
    id: 'dosa-sambar',
    name: 'South Indian Masala Dosa',
    cuisine: 'South Indian',
    description: 'Crispy golden crepe filled with potato masala, hot vegetable sambar, and coconut chutney',
    emoji: '🥞',
    hint: 'South Indian breakfast: Masala Dosa, vegetable sambar bowl, and coconut chutney',
    colorScheme: ['#10b981', '#059669'],
    tags: ['Dosa', 'Potato Masala', 'Sambar', 'Chutney'],
  },
  {
    id: 'paneer-roti',
    name: 'Paneer Butter Masala & Rotis',
    cuisine: 'North Indian',
    description: 'Rich cottage cheese in tomato gravy served with 2 whole wheat rotis and cucumber raita',
    emoji: '🥘',
    hint: 'Paneer butter masala curry with 2 chapatis/rotis and cucumber raita',
    colorScheme: ['#ea580c', '#c2410c'],
    tags: ['Paneer Gravy', '2 Rotis', 'Raita'],
  },
  {
    id: 'avocado-eggs',
    name: 'Avocado Toast with Poached Eggs',
    cuisine: 'Continental',
    description: 'Sourdough toast, sliced avocado, 2 poached eggs, and roasted cherry tomatoes',
    emoji: '🥑',
    hint: 'Sourdough avocado toast with two poached eggs and roasted tomatoes',
    colorScheme: ['#84cc16', '#65a30d'],
    tags: ['Toast', 'Avocado', '2 Eggs', 'Tomatoes'],
  },
  {
    id: 'burger-fries',
    name: 'Gourmet Burger & French Fries',
    cuisine: 'American',
    description: 'Seared patty with cheddar, lettuce, brioche bun, and side of golden salted fries',
    emoji: '🍔',
    hint: 'Cheeseburger on brioche bun with a basket of crispy french fries',
    colorScheme: ['#ef4444', '#dc2626'],
    tags: ['Cheeseburger', 'French Fries'],
  },
];

/**
 * Creates a visually appealing rendered plate image as a JPEG dataUrl for Gemini analysis
 */
export function generateSampleFoodDataUrl(sample: SampleFoodOption): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - restaurant tabletop texture
  const bgGrad = ctx.createRadialGradient(360, 360, 50, 360, 360, 450);
  bgGrad.addColorStop(0, '#f8fafc');
  bgGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 720, 720);

  // Placemat or wooden plate
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 35;
  ctx.shadowOffsetY = 15;

  // Large White Ceramic Serving Plate
  ctx.beginPath();
  ctx.arc(360, 360, 270, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  // Inner plate rim
  ctx.beginPath();
  ctx.arc(360, 360, 240, 0, Math.PI * 2);
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw Meal Visuals based on ID
  if (sample.id === 'biryani-plate') {
    // 1. Biryani Rice mound (center-left)
    ctx.save();
    ctx.beginPath();
    ctx.arc(310, 360, 120, 0, Math.PI * 2);
    ctx.fillStyle = '#fde68a'; // saffron yellow
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Spices & fried onions flecks
    ctx.fillStyle = '#92400e';
    for (let i = 0; i < 28; i++) {
      const rx = 240 + Math.random() * 140;
      const ry = 300 + Math.random() * 120;
      ctx.fillRect(rx, ry, 6, 2);
    }
    // Mint / coriander garnish
    ctx.fillStyle = '#16a34a';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(280 + Math.random() * 60, 330 + Math.random() * 60, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 2. Chicken Curry Bowl (top-right)
    ctx.save();
    ctx.beginPath();
    ctx.arc(460, 270, 75, 0, Math.PI * 2);
    ctx.fillStyle = '#dc2626'; // rich reddish curry
    ctx.fill();
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 5;
    ctx.stroke();
    // Chicken piece
    ctx.beginPath();
    ctx.ellipse(455, 265, 35, 22, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#b91c1c';
    ctx.fill();
    ctx.restore();

    // 3. Dal Tadka Bowl (bottom-right)
    ctx.save();
    ctx.beginPath();
    ctx.arc(460, 435, 65, 0, Math.PI * 2);
    ctx.fillStyle = '#eab308'; // yellow dal
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Cumin tadka dots
    ctx.fillStyle = '#451a03';
    for (let i = 0; i < 12; i++) {
      ctx.fillRect(440 + Math.random() * 40, 420 + Math.random() * 30, 4, 2);
    }
    ctx.restore();

    // 4. Salad (cucumbers, tomatoes, onions)
    ctx.save();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(190, 360, 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(205, 340, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (sample.id === 'dosa-sambar') {
    // Large Golden Dosa Roll across plate
    ctx.save();
    ctx.translate(360, 360);
    ctx.rotate(-0.25);
    ctx.beginPath();
    ctx.roundRect(-210, -50, 420, 100, 30);
    ctx.fillStyle = '#d97706';
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Crispy crepe roast stripes
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    for (let x = -170; x < 180; x += 35) {
      ctx.beginPath();
      ctx.moveTo(x, -40);
      ctx.lineTo(x + 10, 40);
      ctx.stroke();
    }
    ctx.restore();

    // Sambar Bowl
    ctx.beginPath();
    ctx.arc(230, 220, 60, 0, Math.PI * 2);
    ctx.fillStyle = '#ea580c';
    ctx.fill();
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Coconut Chutney Bowl
    ctx.beginPath();
    ctx.arc(490, 490, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.stroke();
    // Mustard seed tempering
    ctx.fillStyle = '#1e293b';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(475 + Math.random() * 30, 475 + Math.random() * 30, 3, 3);
    }
  } else {
    // General food plate graphic
    ctx.save();
    ctx.font = '84px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sample.emoji, 360, 350);
    ctx.restore();
  }

  // Label banner on image for clear visual identification
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.roundRect(140, 605, 440, 70, 18);
  ctx.fill();

  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(sample.name, 360, 638);

  ctx.font = '16px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(sample.tags.join(' • '), 360, 662);
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.88);
}
