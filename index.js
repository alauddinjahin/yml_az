const fs = require('fs');
const path = require('path');
const YAML = require('yaml');


// try { 
//     require('yaml').parse(
//         require('fs').readFileSync(process.argv[1] || 'file.yml', 'utf8')
//     ); 
    
//     console.log('YAML is valid'); 
// } catch (e) { 
//     console.error('YAML error:', e.message); 
//     process.exit(1); 
// }

// "scripts": {
//   "test-yaml": "yaml-lint || exit 1",
//   "lint-yaml": "yaml-lint"
// },
// "devDependencies": {
//   "yaml-lint": "^1.2.4"
// }

// nodemon --ext yml,js --watch ymls/ index.js

try {
  const fileContents = fs.readFileSync('ymls/multi-docs.yml', 'utf8');
  const data = YAML.parseAllDocuments(fileContents); // if you use multi docs in a single file
  // const data = YAML.parse(fileContents);
  
  console.log('YAML is valid!');
  console.log(data);

  return;
} catch (e) {
  console.error('YAML Error:', e.message);
}


const ymlDir = 'ymls';
// Read all files in directory
const files = fs.readdirSync(ymlDir);

// Filter for .yml/.yaml files
const yamlFiles = files.filter(file => 
  file.endsWith('.yml') || file.endsWith('.yaml')
);

try {
  // Parse each YAML file
  const results = {};
  for (const file of yamlFiles){
    const filePath = path.join(ymlDir, file)
    const fileContents = fs.readFileSync(filePath, 'utf8');
    results[file] = YAML.parse(fileContents);
  }


  console.log('All YAML files loaded successfully!');
  console.log(results);

} catch (error) {
  console.error('YAML Error:', e.message);
}
