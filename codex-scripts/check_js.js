const fs = require('fs');
const html = fs.readFileSync('src/index.html', 'utf8');
const scriptMatches = html.match(/<script>([\s\S]*?)<\/script>/g);
if (scriptMatches) {
    const script = scriptMatches[scriptMatches.length - 1].replace(/<\/?script>/g, '');
    fs.writeFileSync('temp_check.js', script);
    try {
        new (require('vm').Script)(script);
        console.log('Syntax OK');
    } catch(e) {
        console.error('Syntax Error:', e);
    }
}