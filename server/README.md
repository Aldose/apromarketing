# A Pro server
make sure you have the .env file in the server folder


# Minifier: JS and CSS Minifier

A command-line utility for minifying JavaScript and CSS files.

## Installation

First, install the required dependencies:

```bash
cd minifier
npm install
```

## Usage

The minifier can be used in several ways:

### Basic Usage

```bash
# Minify a single file
node minifier.js --input path/to/file.js

# Minify a single CSS file
node minifier.js --input path/to/file.css

# Minify all JS and CSS files in a directory
node minifier.js --input path/to/directory

# Specify an output directory
node minifier.js --input path/to/file.js --output dist/
```

### Advanced Options

```bash
# Only minify JavaScript files
node minifier.js --input src/ --js

# Only minify CSS files
node minifier.js --input src/ --css

# Process directories recursively
node minifier.js --input src/ --recursive
```

## Options

- `--input`, `-i`: Input file or directory (required)
- `--output`, `-o`: Output directory (optional, defaults to same directory as input)
- `--js`: Process only JavaScript files
- `--css`: Process only CSS files
- `--recursive`, `-r`: Process directories recursively
- `--help`, `-h`: Show help information

## Examples

1. Minify a single JS file:
   ```bash
   node minifier.js -i src/main.js
   ```

2. Minify all CSS files in a directory and its subdirectories:
   ```bash
   node minifier.js -i src/ --css --recursive
   ```

3. Minify all JS and CSS files and output to a specific directory:
   ```bash
   node minifier.js -i src/ -o dist/ -r
   ```
