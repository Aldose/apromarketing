#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const { minify } = require('terser');
const postcss = require('postcss');
const cssnano = require('cssnano');
const chalk = require('chalk');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .usage('Usage: $0 [options]')
  .option('input', {
    alias: 'i',
    describe: 'Input file or directory',
    type: 'string',
    demandOption: true
  })
  .option('output', {
    alias: 'o',
    describe: 'Output directory',
    type: 'string'
  })
  .option('js', {
    describe: 'Minify JavaScript files only',
    type: 'boolean',
    default: false
  })
  .option('css', {
    describe: 'Minify CSS files only',
    type: 'boolean',
    default: false
  })
  .option('recursive', {
    alias: 'r',
    describe: 'Process directories recursively',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

// If neither --js nor --css is specified, process both
if (!argv.js && !argv.css) {
  argv.js = true;
  argv.css = true;
}

// Main function
async function processFiles() {
  try {
    const stats = fs.statSync(argv.input);
    
    if (stats.isFile()) {
      await processFile(argv.input);
    } else if (stats.isDirectory()) {
      const patterns = [];
      
      if (argv.js) patterns.push(`${argv.input}${argv.recursive ? '/**' : ''}/*.js`);
      if (argv.css) patterns.push(`${argv.input}${argv.recursive ? '/**' : ''}/*.css`);
      
      const files = await glob(patterns);
      
      if (files.length === 0) {
        console.log(chalk.yellow('No files found matching the criteria.'));
        return;
      }
      
      console.log(chalk.blue(`Found ${files.length} files to process.`));
      
      for (const file of files) {
        await processFile(file);
      }
    } else {
      console.error(chalk.red('Input is neither a file nor a directory.'));
      process.exit(1);
    }
    
    console.log(chalk.green('All files processed successfully!'));
  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

// Process a single file
async function processFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const content = await fs.readFile(filePath, 'utf8');
  const outputDir = argv.output || path.dirname(filePath);
  const baseName = path.basename(filePath, ext);
  const outputPath = path.join(outputDir, `${baseName}.min${ext}`);
  
  await fs.ensureDir(outputDir);
  
  try {
    if (ext === '.js' && argv.js) {
      const result = await minify(content, {
        compress: true,
        mangle: true
      });
      
      await fs.writeFile(outputPath, result.code);
      logSuccess(filePath, outputPath, content.length, result.code.length);
    } else if (ext === '.css' && argv.css) {
      const result = await postcss([cssnano({
        preset: 'default',
      })]).process(content, { from: filePath, to: outputPath });
      
      await fs.writeFile(outputPath, result.css);
      logSuccess(filePath, outputPath, content.length, result.css.length);
    } else {
      console.log(chalk.yellow(`Skipping ${filePath} (not a target file type or not included in options)`));
    }
  } catch (err) {
    console.error(chalk.red(`Error processing ${filePath}: ${err.message}`));
  }
}

// Log success information
function logSuccess(inputPath, outputPath, originalSize, minifiedSize) {
  const savings = originalSize - minifiedSize;
  const percentage = ((savings / originalSize) * 100).toFixed(2);
  
  console.log(chalk.green(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)}`));
  console.log(chalk.gray(`  Original: ${formatBytes(originalSize)} | Minified: ${formatBytes(minifiedSize)} | Saved: ${formatBytes(savings)} (${percentage}%)`));
}

// Format bytes to human-readable format
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Run the main function
processFiles();
