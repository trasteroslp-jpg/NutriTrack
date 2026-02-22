export const mockMeals = [
  {
    id: '1',
    type: 'Breakfast',
    title: 'Huevos con Aguacate',
    calories: 350,
    protein: 15,
    carbs: 10,
    fat: 25,
    time: '08:00 AM'
  },
  {
    id: '2',
    type: 'Almuerzo',
    title: 'Pechuga de Pollo con Quinoa',
    calories: 550,
    protein: 40,
    carbs: 45,
    fat: 12,
    time: '02:00 PM'
  },
  {
    id: '3',
    type: 'Snack',
    title: 'Yogur Griego con Nueces',
    calories: 200,
    protein: 12,
    carbs: 15,
    fat: 10,
    time: '05:30 PM'
  }
];

export const weeklyProgress = [
  { day: 'Lun', calories: 1850 },
  { day: 'Mar', calories: 2100 },
  { day: 'Mie', calories: 1950 },
  { day: 'Jue', calories: 2200 },
  { day: 'Vie', calories: 2000 },
  { day: 'Sab', calories: 2400 },
  { day: 'Dom', calories: 1800 }
];

export const foodCatalogue = [
  // Proteínas (Carnes, Pescados, Legumbres, Otros)
  { id: '101', name: 'Pechuga de Pollo', calories: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Proteínas' },
  { id: '102', name: 'Muslo de Pollo (sin piel)', calories: 172, protein: 28, carbs: 0, fat: 5.7, category: 'Proteínas' },
  { id: '103', name: 'Solomillo de Ternera', calories: 162, protein: 24, carbs: 0, fat: 7, category: 'Proteínas' },
  { id: '104', name: 'Filete de Pavo', calories: 114, protein: 24, carbs: 0, fat: 2, category: 'Proteínas' },
  { id: '105', name: 'Lomo de Cerdo', calories: 143, protein: 21, carbs: 0, fat: 6, category: 'Proteínas' },
  { id: '106', name: 'Salmón Fresh', calories: 208, protein: 20, carbs: 0, fat: 13, category: 'Proteínas' },
  { id: '107', name: 'Atún al Natural', calories: 116, protein: 26, carbs: 0, fat: 1, category: 'Proteínas' },
  { id: '108', name: 'Lubina', calories: 97, protein: 18, carbs: 0, fat: 2.5, category: 'Proteínas' },
  { id: '109', name: 'Merluza', calories: 78, protein: 17, carbs: 0, fat: 1, category: 'Proteínas' },
  { id: '110', name: 'Bacalao', calories: 82, protein: 18, carbs: 0, fat: 0.7, category: 'Proteínas' },
  { id: '111', name: 'Gambas/Langostinos', calories: 99, protein: 24, carbs: 0, fat: 0.3, category: 'Proteínas' },
  { id: '112', name: 'Huevo (Unidad)', calories: 70, protein: 6, carbs: 0.5, fat: 5, category: 'Proteínas' },
  { id: '113', name: 'Clara de Huevo (100ml)', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, category: 'Proteínas' },
  { id: '114', name: 'Tofu Firme', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, category: 'Proteínas' },
  { id: '115', name: 'Seitan', calories: 120, protein: 25, carbs: 4.5, fat: 1.5, category: 'Proteínas' },
  { id: '116', name: 'Tempeh', calories: 193, protein: 19, carbs: 9, fat: 11, category: 'Proteínas' },
  { id: '117', name: 'Soja Texturizada', calories: 350, protein: 50, carbs: 30, fat: 1, category: 'Proteínas' },
  { id: '118', name: 'Lentejas Cocidas', calories: 116, protein: 9, carbs: 20, fat: 0.4, category: 'Proteínas' },
  { id: '119', name: 'Garbanzos Cocidos', calories: 164, protein: 8.9, carbs: 27, fat: 2.6, category: 'Proteínas' },
  { id: '120', name: 'Judías Blancas Cocidas', calories: 139, protein: 9.7, carbs: 25, fat: 0.5, category: 'Proteínas' },

  // Carbohidratos (Cereales, Tubérculos, Panes)
  { id: '201', name: 'Arroz Integral', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, category: 'Carbohidratos' },
  { id: '202', name: 'Arroz Blanco (Cocido)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, category: 'Carbohidratos' },
  { id: '203', name: 'Arroz Basmati', calories: 121, protein: 3.5, carbs: 25, fat: 0.4, category: 'Carbohidratos' },
  { id: '204', name: 'Quinoa Cocida', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, category: 'Carbohidratos' },
  { id: '205', name: 'Cuscús Cocido', calories: 112, protein: 3.8, carbs: 23, fat: 0.2, category: 'Carbohidratos' },
  { id: '206', name: 'Pasta Integral (Cocida)', calories: 124, protein: 5.3, carbs: 25, fat: 1.1, category: 'Carbohidratos' },
  { id: '207', name: 'Espaguetis (Cocidos)', calories: 158, protein: 5.8, carbs: 31, fat: 0.9, category: 'Carbohidratos' },
  { id: '208', name: 'Macarrones (Cocidos)', calories: 157, protein: 5, carbs: 30, fat: 0.9, category: 'Carbohidratos' },
  { id: '209', name: 'Patata Cocida', calories: 77, protein: 2, carbs: 17, fat: 0.1, category: 'Carbohidratos' },
  { id: '210', name: 'Batata Asada', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, category: 'Carbohidratos' },
  { id: '211', name: 'Copos de Avena', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, category: 'Carbohidratos' },
  { id: '212', name: 'Pan Integral', calories: 247, protein: 13, carbs: 41, fat: 3.4, category: 'Carbohidratos' },
  { id: '213', name: 'Pan Blanco (Barra)', calories: 265, protein: 9, carbs: 49, fat: 3.2, category: 'Carbohidratos' },
  { id: '214', name: 'Pan Centeno', calories: 259, protein: 9, carbs: 48, fat: 3.3, category: 'Carbohidratos' },
  { id: '215', name: 'Tortilla de Maíz', calories: 218, protein: 6, carbs: 45, fat: 3, category: 'Carbohidratos' },
  { id: '216', name: 'Tortilla de Trigo', calories: 327, protein: 9, carbs: 50, fat: 7, category: 'Carbohidratos' },
  { id: '217', name: 'Trigo Sarraceno Cocido', calories: 92, protein: 3.4, carbs: 20, fat: 0.6, category: 'Carbohidratos' },
  { id: '218', name: 'Bulgur Cocido', calories: 83, protein: 3, carbs: 18.6, fat: 0.2, category: 'Carbohidratos' },
  { id: '219', name: 'Ñame Cocido', calories: 118, protein: 1.5, carbs: 28, fat: 0.2, category: 'Carbohidratos' },
  { id: '220', name: 'Yuca Cocida', calories: 159, protein: 1.4, carbs: 38, fat: 0.3, category: 'Carbohidratos' },

  // Vegetales
  { id: '301', name: 'Berenjena', calories: 25, protein: 1, carbs: 6, fat: 0.2, category: 'Vegetales' },
  { id: '302', name: 'Brócoli Vapor', calories: 35, protein: 2.4, carbs: 7, fat: 0.4, category: 'Vegetales' },
  { id: '303', name: 'Calabacín', calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, category: 'Vegetales' },
  { id: '304', name: 'Calabaza Asada', calories: 26, protein: 1, carbs: 6.5, fat: 0.1, category: 'Vegetales' },
  { id: '305', name: 'Cebolla', calories: 40, protein: 1.1, carbs: 9, fat: 0.1, category: 'Vegetales' },
  { id: '306', name: 'Coliflor', calories: 25, protein: 1.9, carbs: 5, fat: 0.3, category: 'Vegetales' },
  { id: '307', name: 'Espárragos Trigueros', calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1, category: 'Vegetales' },
  { id: '308', name: 'Espinacas Fresh', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'Vegetales' },
  { id: '309', name: 'Judía Verde Cocida', calories: 31, protein: 1.8, carbs: 7, fat: 0.2, category: 'Vegetales' },
  { id: '310', name: 'Lechuga Iceberg', calories: 14, protein: 0.9, carbs: 3, fat: 0.1, category: 'Vegetales' },
  { id: '311', name: 'Pepino', calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, category: 'Vegetales' },
  { id: '312', name: 'Pimiento Rojo', calories: 31, protein: 1, carbs: 6, fat: 0.3, category: 'Vegetales' },
  { id: '313', name: 'Pimiento Verde', calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, category: 'Vegetales' },
  { id: '314', name: 'Setas/Champiñones', calories: 22, protein: 3.1, carbs: 3, fat: 0.3, category: 'Vegetales' },
  { id: '315', name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: 'Vegetales' },
  { id: '316', name: 'Tomate Cherry', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: 'Vegetales' },
  { id: '317', name: 'Zanahoria', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, category: 'Vegetales' },
  { id: '318', name: 'Alcachofa Cocida', calories: 47, protein: 3.3, carbs: 11, fat: 0.2, category: 'Vegetales' },
  { id: '319', name: 'Canónigos', calories: 21, protein: 2, carbs: 3.6, fat: 0.4, category: 'Vegetales' },
  { id: '320', name: 'Rúcula', calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7, category: 'Vegetales' },

  // Frutas
  { id: '401', name: 'Aguacate', calories: 160, protein: 2, carbs: 9, fat: 15, category: 'Frutas' },
  { id: '402', name: 'Arándanos', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, category: 'Frutas' },
  { id: '403', name: 'Cerezas', calories: 50, protein: 1, carbs: 12, fat: 0.3, category: 'Frutas' },
  { id: '404', name: 'Frambuesas', calories: 52, protein: 1.2, carbs: 12, fat: 0.6, category: 'Frutas' },
  { id: '405', name: 'Fresas', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, category: 'Frutas' },
  { id: '406', name: 'Kiwi', calories: 61, protein: 1.1, carbs: 15, fat: 0.5, category: 'Frutas' },
  { id: '407', name: 'Limón', calories: 29, protein: 1.1, carbs: 9, fat: 0.3, category: 'Frutas' },
  { id: '408', name: 'Mandarina', calories: 53, protein: 0.8, carbs: 13, fat: 0.3, category: 'Frutas' },
  { id: '409', name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, category: 'Frutas' },
  { id: '410', name: 'Manzana', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, category: 'Frutas' },
  { id: '411', name: 'Melocotón', calories: 39, protein: 0.9, carbs: 10, fat: 0.3, category: 'Frutas' },
  { id: '412', name: 'Melón', calories: 34, protein: 0.8, carbs: 8, fat: 0.2, category: 'Frutas' },
  { id: '413', name: 'Naranja', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, category: 'Frutas' },
  { id: '414', name: 'Pera', calories: 57, protein: 0.4, carbs: 15, fat: 0.1, category: 'Frutas' },
  { id: '415', name: 'Piña', calories: 50, protein: 0.5, carbs: 13, fat: 0.1, category: 'Frutas' },
  { id: '416', name: 'Plátano', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, category: 'Frutas' },
  { id: '417', name: 'Sandía', calories: 30, protein: 0.6, carbs: 8, fat: 0.2, category: 'Frutas' },
  { id: '418', name: 'Uva (Blanca/Negra)', calories: 67, protein: 0.6, carbs: 17, fat: 0.4, category: 'Frutas' },
  { id: '419', name: 'Coco Fresh', calories: 354, protein: 3.3, carbs: 15, fat: 33, category: 'Frutas' },
  { id: '420', name: 'Higos', calories: 74, protein: 0.8, carbs: 19, fat: 0.3, category: 'Frutas' },

  // Lácteos y Grasas Saludables
  { id: '501', name: 'Yogur Griego Natural', calories: 115, protein: 10, carbs: 4.5, fat: 10, category: 'Lácteos' },
  { id: '502', name: 'Yogur Desnatado', calories: 55, protein: 5, carbs: 7, fat: 0.1, category: 'Lácteos' },
  { id: '503', name: 'Kéfir Natural', calories: 64, protein: 3.5, carbs: 4.8, fat: 3.5, category: 'Lácteos' },
  { id: '504', name: 'Queso Fresco (Burgos)', calories: 174, protein: 12, carbs: 3.5, fat: 12, category: 'Lácteos' },
  { id: '505', name: 'Queso Cottage', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, category: 'Lácteos' },
  { id: '506', name: 'Queso Parmesano', calories: 431, protein: 38, carbs: 4.1, fat: 29, category: 'Lácteos' },
  { id: '507', name: 'Leche de Vaca Entera', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, category: 'Lácteos' },
  { id: '508', name: 'Leche de Avellanas', calories: 40, protein: 0.5, carbs: 4, fat: 2.5, category: 'Lácteos' },
  { id: '509', name: 'Aceite de Oliva (1 cda)', calories: 120, protein: 0, carbs: 0, fat: 14, category: 'Grasas' },
  { id: '510', name: 'Nueces (30g)', calories: 196, protein: 4.5, carbs: 4, fat: 19, category: 'Grasas' },
  { id: '511', name: 'Almendras (30g)', calories: 174, protein: 6, carbs: 6, fat: 14, category: 'Grasas' },
  { id: '512', name: 'Mantequilla de Cacahuete', calories: 588, protein: 25, carbs: 20, fat: 50, category: 'Grasas' },
  { id: '513', name: 'Semillas de Chía', calories: 486, protein: 17, carbs: 42, fat: 31, category: 'Grasas' },
  { id: '514', name: 'Pipas de Calabaza', calories: 559, protein: 30, carbs: 11, fat: 49, category: 'Grasas' },
  { id: '515', name: 'Hummus Clásico', calories: 166, protein: 8, carbs: 14, fat: 9.6, category: 'Grasas' },
];

export const userProfile = {
  name: 'David',
  age: 28,
  gender: 'male', // 'male' or 'female'
  weight: 75,
  height: 178,
  activityLevel: 1.2, // 1.2 (sedentary), 1.375 (light), 1.55 (moderate), 1.725 (active), 1.9 (v. active)
  goal: 'maintain', // 'lose', 'maintain', 'gain'
  goalCalories: 2200,
  macros: {
    protein: 30, // %
    carbs: 40, // %
    fat: 30 // %
  }
};

export const trainingExercises = [
  {
    id: 'e1',
    name: 'Hip Thrust',
    description: 'El rey de los ejercicios para glúteo mayor.',
    sets: '4',
    reps: '10-12',
    image: 'https://cdn-icons-png.flaticon.com/512/2548/2548537.png',
    videoUrl: 'https://www.youtube.com/watch?v=LM8LGXWC_I4'
  },
  {
    id: 'e2',
    name: 'Sentadilla Búlgara',
    description: 'Excelente para glúteo medio y cuádriceps.',
    sets: '3',
    reps: '8 por pierna',
    image: 'https://cdn-icons-png.flaticon.com/512/2548/2548530.png',
    videoUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE'
  },
  {
    id: 'e3',
    name: 'Peso Muerto Rumano',
    description: 'Enfocado en cadena posterior e isquiotibiales.',
    sets: '4',
    reps: '12',
    image: 'https://cdn-icons-png.flaticon.com/512/2548/2548534.png',
    videoUrl: 'https://www.youtube.com/watch?v=JCX81P9zszE'
  },
  {
    id: 'e4',
    name: 'Abducciones en Polea',
    description: 'Aislante para el glúteo medio (forma redondeada).',
    sets: '3',
    reps: '15 por pierna',
    image: 'https://cdn-icons-png.flaticon.com/512/2548/2548545.png',
    videoUrl: 'https://www.youtube.com/watch?v=pAnV23SAsj8'
  }
];

export const weeklyTrainingPlan = [
  { id: 'tlun', day: 'Lunes', focus: 'Pierna Completa / Glúteo' },
  { id: 'tmar', day: 'Martes', focus: 'Descanso Activo' },
  { id: 'tmie', day: 'Miércoles', focus: 'Glúteo / Isquios' },
  { id: 'tjue', day: 'Jueves', focus: 'Descanso' },
  { id: 'tvie', day: 'Viernes', focus: 'Glúteo / Cuádriceps' },
  { id: 'tsab', day: 'Sábado', focus: 'Cardio LISS' },
  { id: 'tdom', day: 'Domingo', focus: 'Descanso' }
];
