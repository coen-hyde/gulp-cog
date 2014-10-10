var path = require('path');

var cog = require('../');
var expect = require('expect.js');
var _ = require('lodash');
var streamAssert = require('stream-assert');
var foreach = require('gulp-foreach');
var combiner = require('stream-combiner');
var File = require('gulp-util').File;
var gulp = require('gulp');

var fixtures = function (glob) { return path.join(__dirname, 'fixtures', glob); }

describe('gulp-include-chain', function() {
  describe('cog()', function() {
    it('should build a list of files to include', function(done) {
      return gulp.src(__dirname+'/fixtures/**/*.js', {base: __dirname+'/fixtures'})
        .pipe(streamAssert.length(5)) // All files should be in teh stream now
        .pipe(cog('*.js'))
        .pipe(streamAssert.length(1)) // Should only have the master.js file in the stream now
        .pipe(foreach(function(stream, masterFile){
          var concatList = _.pluck(masterFile.includes, 'relative');

          expect(concatList).to.eql([ 
            'treedir/file3.js',
            'treedir/file4.js',
            'treedir/subdir/file2.js',
            'dir/file1.js',
            'master.js'
          ]);
          return stream;
        }))
        .pipe(streamAssert.end(done));
    })
  });


  describe('cog.includes()', function() {
    it('should emit all files to include back into the stream in the correct order', function(done) {
      var fileAssert = function(filename) {
        return function(file) {
          expect(file.relative).to.eql(filename);
        };
      };

      return gulp.src(__dirname+'/fixtures/**/*.js', {base: __dirname+'/fixtures'})
        .pipe(cog('*.js'))
        .pipe(foreach(function(stream, masterFile){
          return stream
            .pipe(cog.includes())
            .pipe(streamAssert.length(5))
            .pipe(streamAssert.nth(0, fileAssert('treedir/file3.js')))
            .pipe(streamAssert.nth(1, fileAssert('treedir/file4.js')))
            .pipe(streamAssert.nth(2, fileAssert('treedir/subdir/file2.js')))
            .pipe(streamAssert.nth(3, fileAssert('dir/file1.js')))
            .pipe(streamAssert.nth(4, fileAssert('master.js')))
            .pipe(streamAssert.end(done));
        }));
    })
  });
});