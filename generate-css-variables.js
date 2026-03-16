// Your JavaScript code here

// Example function to generate CSS variables
function generateCSSVariables(tokens) {
    let cssVariables = '';
    for (const [key, value] of Object.entries(tokens)) {
        cssVariables += `--${key}: ${value};\n`;
    }
    return cssVariables;
}

// Example usage
const tokens = {
    colorPrimary: '#007bff',
    colorSecondary: '#6c757d'
};

console.log(generateCSSVariables(tokens));