const fs = require('fs');
const path = require('path');

function printDirectoryTree(dirPath, indent = '') {
  const files = fs.readdirSync(dirPath);

  files.forEach((file, index) => {
    const fullPath = path.join(dirPath, file);
    const stats = fs.statSync(fullPath);
    const isLast = index === files.length - 1;
    const prefix = isLast ? '└── ' : '├── ';

    console.log(`${indent}${prefix}${file}`);

    if (stats.isDirectory()) {
      const newIndent = indent + (isLast ? '    ' : '│   ');
      printDirectoryTree(fullPath, newIndent);
    }
  });
}

// Start from the current directory
console.log('your-project/');
printDirectoryTree(process.cwd());