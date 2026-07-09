// Map Quiz Data - Country information and mappings
// This file contains all the data needed for the map quiz mode

// Enhanced countries data with proper GeoJSON name mappings
const mapQuizCountries = [
    { 
        name: "Canada", 
        flag: "https://flagcdn.com/w320/ca.png", 
        code: "CA", 
        geoNames: ["Canada"], 
        region: "North America",
        difficulty: "easy"
    },
    { 
        name: "United States", 
        flag: "https://flagcdn.com/w320/us.png", 
        code: "US", 
        geoNames: ["United States of America", "United States", "USA"], 
        region: "North America",
        difficulty: "easy"
    },
    { 
        name: "United Kingdom", 
        flag: "https://flagcdn.com/w320/gb.png", 
        code: "GB", 
        geoNames: ["United Kingdom", "Great Britain"], 
        region: "Europe",
        difficulty: "easy"
    },
    { 
        name: "France", 
        flag: "https://flagcdn.com/w320/fr.png", 
        code: "FR", 
        geoNames: ["France"], 
        region: "Western Europe",
        difficulty: "easy"
    },
    { 
        name: "Germany", 
        flag: "https://flagcdn.com/w320/de.png", 
        code: "DE", 
        geoNames: ["Germany"], 
        region: "Central Europe",
        difficulty: "easy"
    },
    { 
        name: "Italy", 
        flag: "https://flagcdn.com/w320/it.png", 
        code: "IT", 
        geoNames: ["Italy"], 
        region: "Southern Europe",
        difficulty: "easy"
    },
    { 
        name: "Spain", 
        flag: "https://flagcdn.com/w320/es.png", 
        code: "ES", 
        geoNames: ["Spain"], 
        region: "Southern Europe",
        difficulty: "easy"
    },
    { 
        name: "Japan", 
        flag: "https://flagcdn.com/w320/jp.png", 
        code: "JP", 
        geoNames: ["Japan"], 
        region: "East Asia",
        difficulty: "easy"
    },
    { 
        name: "China", 
        flag: "https://flagcdn.com/w320/cn.png", 
        code: "CN", 
        geoNames: ["China", "People's Republic of China"], 
        region: "East Asia",
        difficulty: "easy"
    },
    { 
        name: "Australia", 
        flag: "https://flagcdn.com/w320/au.png", 
        code: "AU", 
        geoNames: ["Australia"], 
        region: "Oceania",
        difficulty: "easy"
    },
    { 
        name: "Brazil", 
        flag: "https://flagcdn.com/w320/br.png", 
        code: "BR", 
        geoNames: ["Brazil"], 
        region: "South America",
        difficulty: "easy"
    },
    { 
        name: "India", 
        flag: "https://flagcdn.com/w320/in.png", 
        code: "IN", 
        geoNames: ["India"], 
        region: "South Asia",
        difficulty: "easy"
    },
    { 
        name: "Mexico", 
        flag: "https://flagcdn.com/w320/mx.png", 
        code: "MX", 
        geoNames: ["Mexico"], 
        region: "North America",
        difficulty: "easy"
    },
    { 
        name: "Russia", 
        flag: "https://flagcdn.com/w320/ru.png", 
        code: "RU", 
        geoNames: ["Russia", "Russian Federation"], 
        region: "Eastern Europe/Asia",
        difficulty: "easy"
    },
    { 
        name: "South Korea", 
        flag: "https://flagcdn.com/w320/kr.png", 
        code: "KR", 
        geoNames: ["South Korea", "Republic of Korea"], 
        region: "East Asia",
        difficulty: "medium"
    },
    { 
        name: "Egypt", 
        flag: "https://flagcdn.com/w320/eg.png", 
        code: "EG", 
        geoNames: ["Egypt"], 
        region: "North Africa",
        difficulty: "medium"
    },
    { 
        name: "South Africa", 
        flag: "https://flagcdn.com/w320/za.png", 
        code: "ZA", 
        geoNames: ["South Africa"], 
        region: "Southern Africa",
        difficulty: "medium"
    },
    { 
        name: "Argentina", 
        flag: "https://flagcdn.com/w320/ar.png", 
        code: "AR", 
        geoNames: ["Argentina"], 
        region: "South America",
        difficulty: "medium"
    },
    { 
        name: "Norway", 
        flag: "https://flagcdn.com/w320/no.png", 
        code: "NO", 
        geoNames: ["Norway"], 
        region: "Northern Europe",
        difficulty: "medium"
    },
    { 
        name: "Sweden", 
        flag: "https://flagcdn.com/w320/se.png", 
        code: "SE", 
        geoNames: ["Sweden"], 
        region: "Northern Europe",
        difficulty: "medium"
    },
    { 
        name: "Netherlands", 
        flag: "https://flagcdn.com/w320/nl.png", 
        code: "NL", 
        geoNames: ["Netherlands"], 
        region: "Western Europe",
        difficulty: "medium"
    },
    { 
        name: "Belgium", 
        flag: "https://flagcdn.com/w320/be.png", 
        code: "BE", 
        geoNames: ["Belgium"], 
        region: "Western Europe",
        difficulty: "medium"
    },
    { 
        name: "Switzerland", 
        flag: "https://flagcdn.com/w320/ch.png", 
        code: "CH", 
        geoNames: ["Switzerland"], 
        region: "Central Europe",
        difficulty: "hard"
    },
    { 
        name: "Portugal", 
        flag: "https://flagcdn.com/w320/pt.png", 
        code: "PT", 
        geoNames: ["Portugal"], 
        region: "Southern Europe",
        difficulty: "medium"
    },
    { 
        name: "Greece", 
        flag: "https://flagcdn.com/w320/gr.png", 
        code: "GR", 
        geoNames: ["Greece"], 
        region: "Southern Europe",
        difficulty: "medium"
    },
    // Add more challenging countries
    { 
        name: "Finland", 
        flag: "https://flagcdn.com/w320/fi.png", 
        code: "FI", 
        geoNames: ["Finland"], 
        region: "Northern Europe",
        difficulty: "medium"
    },
    { 
        name: "Denmark", 
        flag: "https://flagcdn.com/w320/dk.png", 
        code: "DK", 
        geoNames: ["Denmark"], 
        region: "Northern Europe",
        difficulty: "hard"
    },
    { 
        name: "Austria", 
        flag: "https://flagcdn.com/w320/at.png", 
        code: "AT", 
        geoNames: ["Austria"], 
        region: "Central Europe",
        difficulty: "hard"
    },
    { 
        name: "Poland", 
        flag: "https://flagcdn.com/w320/pl.png", 
        code: "PL", 
        geoNames: ["Poland"], 
        region: "Central Europe",
        difficulty: "medium"
    },
    { 
        name: "Turkey", 
        flag: "https://flagcdn.com/w320/tr.png", 
        code: "TR", 
        geoNames: ["Turkey"], 
        region: "Western Asia",
        difficulty: "medium"
    }
];

// Countries that are particularly small and need enhanced hitboxes
const smallCountries = [
    "Vatican City", 
    "Monaco", 
    "San Marino", 
    "Liechtenstein", 
    "Malta", 
    "Luxembourg", 
    "Andorra", 
    "Cyprus", 
    "Singapore", 
    "Bahrain",
    "Barbados", 
    "Grenada", 
    "Saint Lucia", 
    "Dominica", 
    "Antigua and Barbuda",
    "Saint Kitts and Nevis",
    "Marshall Islands",
    "Palau",
    "Tuvalu",
    "Nauru",
    "Vatican City"
];

// Additional GeoJSON name mappings for better matching
const geoNameMappings = {
    // Common variations
    "United States of America": "United States",
    "Russian Federation": "Russia",
    "Republic of Korea": "South Korea",
    "Democratic People's Republic of Korea": "North Korea", 
    "United Kingdom": "United Kingdom",
    "Great Britain": "United Kingdom",
    
    // European variations
    "Czech Republic": "Czechia",
    "Slovak Republic": "Slovakia",
    "Republic of Ireland": "Ireland",
    
    // African variations
    "Democratic Republic of the Congo": "Congo",
    "Republic of the Congo": "Congo",
    
    // Asian variations
    "Myanmar": "Burma",
    "Burma": "Myanmar",
    
    // Other common variations
    "Ivory Coast": "Côte d'Ivoire",
    "Cape Verde": "Cabo Verde"
};

// Difficulty-based country selection
const difficultyLevels = {
    easy: mapQuizCountries.filter(c => c.difficulty === "easy"),
    medium: mapQuizCountries.filter(c => c.difficulty === "medium"),
    hard: mapQuizCountries.filter(c => c.difficulty === "hard"),
    mixed: mapQuizCountries
};

// Quiz configuration options
const quizConfig = {
    defaultQuestions: 25,
    unlimitedMode: false,
    difficulty: "mixed", // easy, medium, hard, or mixed
    showHints: true,
    allowSkip: true,
    enhanceSmallCountries: true,
    minHitboxSize: 25 // pixels
};

// Helper function to get country data by name
function getCountryData(countryName) {
    return mapQuizCountries.find(country => 
        country.name.toLowerCase() === countryName.toLowerCase() ||
        country.geoNames.some(geoName => 
            geoName.toLowerCase() === countryName.toLowerCase()
        )
    );
}

// Helper function to normalize country names for comparison
function normalizeCountryName(name) {
    // Apply mappings first
    if (geoNameMappings[name]) {
        name = geoNameMappings[name];
    }
    
    // Standard normalization
    return name.toLowerCase().trim()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, ' '); // Normalize whitespace
}

// Helper function to check if country needs enhanced hitbox
function needsEnhancedHitbox(countryName) {
    return smallCountries.some(small => 
        normalizeCountryName(small) === normalizeCountryName(countryName)
    );
}

// Generate quiz questions based on difficulty
function generateQuizQuestions(difficulty = "mixed", questionCount = 25) {
    let availableCountries = difficultyLevels[difficulty] || difficultyLevels.mixed;
    
    // Shuffle and select questions
    const shuffled = [...availableCountries].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(questionCount, shuffled.length));
}