# gulp-cog

[![Build Status](https://travis-ci.org/coen-hyde/gulp-cog.svg?branch=master)](https://travis-ci.org/coen-hyde/gulp-cog) [![](http://img.shields.io/npm/v/gulp-cog.svg?style=flat)](https://www.npmjs.org/package/gulp-cog)

Builds a list of includes in a similar way to snockets or sprockets but searches for available files from upstream pipes. This allows you to include js files from sources other than the disk, such as coffeescript or compiled templates. This plugin also leaves the concatination/inclusion to [gulp-concat](https://github.com/wearefractal/gulp-concat) so [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) works.

## Installation

Install package with NPM and add it to your development dependencies:

`npm install --save-dev gulp-cog`

## Usage

Add includes to the top of your files. Two directives are supported. `require_tree` which includes all files found in the directory specified and `require` which will include only the file specified.

```javascript
//= require_tree treedir
//= require dir/file1
```

Then use gulp-cog in you gulpfile.

```javascript
var cog = require('gulp-cog');
var concat = require('gulp-concat');
var foreach = require('gulp-foreach');

gulp.task('js', function() {
  // Include all files you want cog to know about in the pipeline
  gulp.src('app/**/*.js') 
    // Select the files cog should look for includes in. 
    // This will also filter the stream to match the glob provided
    .pipe(cog('app/*.js'))
    // Loop over the filtered files
    .pipe(foreach(function(stream, masterFile) {
      return stream
        // Emit the files in order matching includes cog found in masterFile
        // back into the stream.
        .pipe(cog.includes())
        // Concat all the files together.
        .pipe(concat(masterFile.relative))
    }))
    .pipe(gulp.dest('dist'));
});
```

### Sourcemaps

Follow directions from [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps). Here's an example:

```javascript
var cog = require('gulp-cog');
var concat = require('gulp-concat');
var foreach = require('gulp-foreach');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('js', function() {
  gulp.src('app/**/*.js') 
    .pipe(sourcemaps.init())
    .pipe(cog('*.js')) 
    .pipe(foreach(function(stream, masterFile) {
      return stream
        .pipe(cog.includes())
        .pipe(concat(masterFile.relative))
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
});
```

## Limitations

Because this plugin uses gulp-concat to do the joining/including of the files. This plugin will not insert includes mid file. All includes will be concated before the file in which the include directive is found in. All includes must be places at the top of the file.

## LICENSE

Copyright (c) 2013 Coen Hyde (http://coenhyde.com)

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
