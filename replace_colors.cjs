const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.css') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = content.replace(/#EE5455/gi, '#3B82F6');
            updated = updated.replace(/rgba\(238,84,85,1\)/gi, 'rgba(59,130,246,1)');
            if (content !== updated) {
                fs.writeFileSync(fullPath, updated);
                console.log('Updated', fullPath);
            }
        }
    });
}
replaceInFiles('c:/Users/dky/project/SSTHUB/src');
