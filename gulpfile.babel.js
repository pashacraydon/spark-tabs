var gulp = require('gulp');
var es6transpiler = require('gulp-es6-transpiler');

gulp.task('default', function () {
    return gulp.src([
            'main/eventPage.js',
            'main/popup.js',
            'main/Tablist.js'])
        .pipe(es6transpiler({
            "globals": {
                "chrome": false
            },
            "disallowVars": false,
            "disallowDuplicated": true,
            "disallowUnknownReferences": true
        }))
        .pipe(gulp.dest('dist'));
});