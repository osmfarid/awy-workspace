var gulp = require('gulp');
var path = require('path');
var sass = require('gulp-sass');
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var browserSync = require('browser-sync');
var autoPrefixer = require('gulp-autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var nunjucksRender = require('gulp-nunjucks-render');
var data = require("gulp-data");
var fs = require('fs');
var del = require('del');
var runSequence = require('run-sequence');
var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
var scssLint = require('gulp-scss-lint');
var Server = require('karma').Server;

gulp.task('test', function (done) {
	new Server({
		configFile : process.cwd() + '/karma.conf.js',
		singleRun: true
	}, done).start();
})



gulp.task('sass', function () {
	return   gulp.src('app/scss/**/*.scss')
			.pipe(customPlumber("Error Running Sass", "sass"))
			.pipe(sourcemaps.init())
			.pipe(sass({
				includePaths: ['app/static'],
				precision: 2
			}))
			.pipe(autoPrefixer({
				browsers : ['ie 8-9', `last 2 versions`]
			}))
			.pipe(sourcemaps.write())
			.pipe(gulp.dest('app/css'))
			.pipe(browserSync.reload({
				stream: true,
			}))
})

gulp.task('nunjucks', function () {
	nunjucksRender.nunjucks.configure(['app/templates/']);
	return gulp.src('app/pages/**/*.+(njk)')
	.pipe(customPlumber('Error Running Nunjucks', 'nj'))
	.pipe(data(function() {
		return JSON.parse(fs.readFileSync('./app/data.json'))
	}))
	.pipe(nunjucksRender({
		path: ['app/templates/']
	}))
	.pipe(gulp.dest('app'))
	.pipe(browserSync.reload({
		stream: true
	}))
});

gulp.task('clean:dev', function () {
	return del.sync([
		'app/css',
		'app/*.html'
	])	
})


gulp.task('browserSync', function () {
	browserSync({
		server: {
			baseDir: 'app',
			notify: false
		},
	})
})

gulp.task('lint:js', function () {
	return gulp.src('app/js/**/*.js')
		.pipe(customPlumber('JSHint Error', "js"))
		.pipe(jshint())
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail', {
			ignoreWarning: true,
			ignoreInfo: true
		}))
		.pipe(jscs({
			fix: true,
			configPath: '.jscsrc'
		}))
		.pipe(gulp.dest('app/js'))
})

gulp.task('lint:scss', function () {
	return gulp.src('app/scss/**/*.scss')
	.pipe(scssLint({
		config: '.scss-lint.yml'
	}))
})


function customPlumber(errTitle, iconName) {
	return plumber({
		errorHandler: notify.onError({
			title: errTitle || "Error running Gulp",
			message: "Error: <%= error.message %>",
			icon :  path.join(__dirname, `utils/${iconName}.png`)
		})
	})
}

gulp.task('watch', function () {
	gulp.watch('app/scss/**/*.scss', ['sass', 'lint:scss']);
	gulp.watch('app/js/**/*.js', ['lint:js']);
	gulp.watch('app/js/**/*.js', browserSync.reload);
	gulp.watch([
		'app/templates/**/*',
		'app/pages/**/*.+(njk)',
		'app/data.json'
	], ['nunjucks'])
})

gulp.task('default', function (callback) {
	runSequence(
		'clean:dev',
		['lint:js', 'lint:scss'],
		['sass', 'nunjucks'],
		['browserSync', 'watch'],
		callback
	)
})