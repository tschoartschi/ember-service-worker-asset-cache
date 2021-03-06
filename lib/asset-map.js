'use strict';

const Plugin = require('broccoli-plugin');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

module.exports = class AssetMap extends Plugin {
  constructor(inputNodes, options) {
    super(inputNodes, {
      name: options && options.name,
      annotation: options && options.annotation
    });

    this.options = options;
  }

  build() {
    let options = this.options;
    let includes = options.include || ['assets/**/**/*'];
    let excludes = options.exclude || [];
    let manual = options.manual || [];
    let version = options.version || '1';
    let requestMode = options.requestMode || 'cors';
    let precacheFiles = options.precacheFiles || null;

    let includedFiles = this._findFiles(includes);
    let excludedFiles = this._findFiles(excludes);
    let precacheFiles = this._findFiles(precacheFiles);

    let module = '';
    let files = includedFiles.reduce((files, file) => {
      return (excludedFiles.indexOf(file) !== -1) ? files : files.concat(file);
    }, []);

    manual.forEach((manualFile) => {
      if (files.indexOf(manualFile === -1)) {
        files.push(manualFile);
      }
    });

    module += 'export const FILES = '+ this._generateFilesList(files) +';\n';
    module += 'export const PRE_CACHE_FILES = '+ this._generateFilesList(precacheFiles) +';\n';

    if (options.prepend) {
      module += `export const PREPEND = '${options.prepend}';\n`;
    } else {
      module += 'export const PREPEND = undefined;\n';
    }

    module += `export const VERSION = '${version}';\n`;
    module += `export const REQUEST_MODE = '${requestMode}';\n`;
    module += `export const LENIENT_ERRORS = ${options.lenientErrors || false};\n`;
    module += `export const PRE_CACHE = ${precache};\n`;

    fs.writeFileSync(path.join(this.outputPath, 'config.js'), module);
  }

  _findFiles(fileGlobs) {
    let files = [];

    this.inputPaths.forEach((path) => {
      fileGlobs.forEach((fileGlob) => {
        glob.sync(fileGlob, { cwd: path, nodir: true }).forEach((file) => {
          if (files.indexOf(file) === -1) {
            files.push(file);
          }
        });
      });
    });

    return files;
  }

  _generateFilesList(files) {
      return (files.length > 0) ? `['${files.join("', '")}']` : '[]';
  }
};
