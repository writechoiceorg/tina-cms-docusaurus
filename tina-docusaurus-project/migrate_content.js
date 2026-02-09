const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else {
      filelist.push(filepath);
    }
  });
  return filelist;
};

const processFile = (filePath) => {
  if (!filePath.endsWith('.md') && !filePath.endsWith('.mdx')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let hasFrontmatter = content.startsWith('---');
  let title = '';

  // Extract title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    title = titleMatch[1];
  }

  // Check if title exists in frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let frontmatter = {};
  if (frontmatterMatch) {
    const fmLines = frontmatterMatch[1].split('\n');
    fmLines.forEach(line => {
      const parts = line.split(':');
      if (parts.length > 1) {
        frontmatter[parts[0].trim()] = parts.slice(1).join(':').trim();
      }
    });
  }

  if (!frontmatter.title && title) {
    console.log(`Injecting title "${title}" into ${filePath}`);
    if (hasFrontmatter) {
       newContent = content.replace(/^---\n/, `---\ntitle: "${title}"\n`);
    } else {
       newContent = `---\ntitle: "${title}"\n---\n\n${content}`;
    }
    fs.writeFileSync(filePath, newContent);
  }

  // Rename .md to .mdx
  if (filePath.endsWith('.md')) {
    const newPath = filePath.replace(/\.md$/, '.mdx');
    console.log(`Renaming ${filePath} -> ${newPath}`);
    fs.renameSync(filePath, newPath);
  }
};

const docsDir = path.join(__dirname, 'docs');
const blogDir = path.join(__dirname, 'blog');

console.log('Scanning docs...');
if (fs.existsSync(docsDir)) {
    const docFiles = walkSync(docsDir);
    docFiles.forEach(processFile);
}

console.log('Scanning blog...');
if (fs.existsSync(blogDir)) {
    const blogFiles = walkSync(blogDir);
    blogFiles.forEach(processFile);
}

console.log('Migration complete.');
