# gulp-woz

Builds a list of includes in a similar way to snockets or sprockets but searches for available files from upstream pipes. This allows you to include js files from sources other than the disk, such as coffeescript or compiled templates. This plugin also leaves the concatination/inclusion to [gulp-concat](https://github.com/wearefractal/gulp-concat) so [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps) works.

## Installation

Install package with NPM and add it to your development dependencies:

`npm install --save-dev gulp-include-chain`

## Usage

Add includes to the top of your files. Two directives are supported. `require_tree` which include all files found in the directory specified and `require` which will include only the file specified.

```javascript
//= require_tree treedir
//= require dir/file1
```

Then use gulp-woz in you gulp-file.

```javascript
var woz = require('gulp-woz');
var concat = require('gulp-concat');
var foreach = require('gulp-foreach');

gulp.task('js', function() {
  // Include all files you want woz to know about in the pipeline
  gulp.src('app/**/*.js') 
    // Select the files woz should look for includes in. This will also filter the stream to match the glob provided
    .pipe(woz('app/*.js'))
    // Loop over the filtered files
    .pipe(foreach(function(stream, masterFile) {
      return stream
        // Emit the files in order matching includes woz found in masterFile back into the stream.
        .pipe(woz.includes())
        // Concat all the files together.
        .pipe(concat(masterFile.relative))
    }))
    .pipe(gulp.dest('dist'));
});

### Sourcemaps

Follow directions from [gulp-sourcemaps](https://github.com/floridoo/gulp-sourcemaps). Here's an example:

```javascript
var woz = require('gulp-woz');
var concat = require('gulp-concat');
var foreach = require('gulp-foreach');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('js', function() {
  gulp.src('app/**/*.js') 
    .pipe(sourcemaps.init())
    .pipe(woz('*.js')) 
    .pipe(foreach(function(stream, masterFile) {
      return stream
        .pipe(woz.includes())
        .pipe(concat(masterFile.relative))
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('dist'))
});

## Limitations

Because this plugin uses gulp-concat to do the joining/including of the files. This plugin will not insert includes mid file. All includes will be concated before the file in which the include directive is found in. All includes must be places at the top of the file.


