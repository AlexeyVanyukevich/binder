const { readFileSync } = require('fs');

const parse = (line) => {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        return;
    }

    const [key, ...rest] = trimmedLine.split('=');
    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');

    process.env[key.trim()] = value;
}

const loadEnv = (path = '.env') => {
    const content = readFileSync(path, 'utf-8');

    for (const line of content.split('\n')) {
        parse(line);
    }
}

module.exports = loadEnv;