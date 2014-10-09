var through = require('through2');
var sc = require('stream-combiner');
var _ = require('lodash');
var gutil = require('gulp-util');
var filter = require('gulp-filter');
var minimatch = require('minimatch');
var PluginError = gutil.PluginError;

// consts
const PLUGIN_NAME = 'gulp-include-chain';
const DIRECTIVE_REGEX = /^[\/\s#]*?=\s*?((?:require|include)(?:_tree|_directory)?)\s+(.*$)/mg;

// plugin level function (dealing with files)
function includeChain(glob) {
  if (typeof glob === 'undefined') {
    var glob = '**/*';
  }

  // Collect all files, before we filter stream
  var allFiles = {};
  var collectFilesStream = through.obj(function(file, enc, cb) {
    allFiles[file.relative] = file;
    cb();
  }, function(cb) {
    _.each(allFiles, function(file) {
      collectFilesStream.push(file);
    });
    cb();
  });

  // Get all includes for a file
  function getIncludes(file) {
    var content = String(file.contents);
    var matches = [];

    while (regexMatch = DIRECTIVE_REGEX.exec(content)) {
      matches.push(regexMatch);
    }

    // For every require fetch it's matching files
    var fileLists = _.map(matches, function(match) {
      return globMatch(match, file);
    });

    // Merge all matching file lists into one concat list
    var order = _.reduce(fileLists, function(memo, fileList) {
      return _.union(memo, fileList);
    }, []);

    // And self to include list
    order.push(file.relative);
    return order;
  }

  function getRelativeDir(file) {
    var relativeDir = _.initial(file.relative.split('/')).join('/')+'/';
    return relativeDir;
  }

  // Translate an include match to a glob
  function globMatch(match, file) {
    var directiveType = match[1];
    var globPattern = match[2]; // relative file

    // require all files under a directory
    if (directiveType.indexOf('_tree') !== -1) {
      globPattern = globPattern.concat('/**/*');
      directiveType = directiveType.replace('_tree', '');
    }

    // require only first level files in a directory
    if (directiveType.indexOf('_directory') !== -1) {
      globPattern = globPattern.concat('/*');
      directiveType = directiveType.replace('_directory', '');
    }

    // Only require and include directives are allowed
    if (directiveType !== 'require' && directiveType !== 'include') {
      return [];
    }

    // Add file extension to glob pattern if not already set
    var jsExt = '.js';
    if (globPattern.substr(globPattern.length-jsExt.length).indexOf(jsExt) !== 0) {
      globPattern += jsExt;
    } 

    // Append the current dir to include so we can match the glob against the file list
    var relativeDir = getRelativeDir(file);
    globPattern = relativeDir+globPattern;

    var possibleIncludes = [];
    _.each(_.keys(allFiles), function(fileName) {
      // Only process files in the current directory. ../ will not work.
      if (fileName.indexOf(relativeDir) !== 0) {
        return;
      }

      possibleIncludes.push(fileName);
    })
    
    return minimatch.match(possibleIncludes, globPattern);
  }


  // creating a stream through which each file will pass
  var concatFiles = [];
  var buildIncludesStream = through.obj(function(file, enc, cb) {
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    // Create concat build list
    file.concatList = getIncludes(file);
    concatFiles.push(file);

    this.push(file);
    cb();
  });

  /*
   * Construct the stream.
   * 
   * Steps:
   * 1. Build a list of all files in the stream for use later
   * 2. Filter files to only desired master concat files
   * 3. Build concat manifests data objects for each of the master files
   */
  var stream = sc(
    collectFilesStream,
    filter(glob),
    buildIncludesStream
  );

  /*
   * Generate a manifest file for each master concat file
   */ 
  stream.manifests = function() {
    var manifestStream = through.obj(function(file, enc, cb) {
      this.push(file);
      cb();
    }, function(cb) {
      _.each(concatFiles, function(masterFile) {
        var manifest = new gutil.File({
          cwd: masterFile.cwd,
          base: masterFile.base,
          path: gutil.replaceExtension(masterFile.path, '.json'),
          contents: new Buffer(JSON.stringify(masterFile.masterFile, null, '  '))
        });

        manifestStream.push(manifest);
      });

      cb();
    });

    return manifestStream;
  }

  /*
   * Emit include files back into the stream. 
   *
   * Usually used with gulp-foreach and gulp-concat master files.
   */ 
  stream.includes = function() {
    var includesStream = through.obj(function(masterFile, enc, cb) {
      _.each(masterFile.concatList, function(fileName) {
        includesStream.push(allFiles[fileName]);
      })
      cb();
    });

    return includesStream;
  }

  return stream;
};

// exporting the plugin main function
module.exports = includeChain;