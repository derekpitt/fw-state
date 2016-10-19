const gulp = require("gulp");
const del = require("del");
const vinylPaths = require("vinyl-paths");
const runSequence = require("run-sequence");
const ts = require("gulp-typescript");
const to5 = require("gulp-babel");
const replace = require("gulp-replace");
const mocha = require("gulp-spawn-mocha");
const clean = require("gulp-clean");

const tsProject = ts.createProject("tsconfig.json", {
  typescript: require("typescript")
});

const outputPath = "dist/";
const dtsFile = outputPath + "fw-state.d.ts";

gulp.task("clean", function() {
  return gulp.src([outputPath])
    .pipe(vinylPaths(del));
});

gulp.task("build-dts", function() {
  return require("dts-generator").default({
    name: "fw-state",
    baseDir: "./src",
    files: ["index.ts"],
    out: dtsFile
  });
});

gulp.task("dts-fix", function() {
  return gulp.src(dtsFile)
    .pipe(replace("declare module 'fw-state/index'", "declare module 'fw-state'"))
    .pipe(gulp.dest(outputPath));
});

gulp.task('build-common', function() {
  return gulp.src(["src/**/*.ts", "typings/**/*.d.ts"])
    .pipe(ts(tsProject))
    .pipe(to5({
      modules: "common"
    }))
    .pipe(gulp.dest(outputPath));
});

gulp.task('build', function(callback) {
  return runSequence(
    'clean',
    'build-common',
    'build-dts',
    'dts-fix',
    callback);
});

gulp.task('test-clean', function() {
  return gulp.src(["src/**/*.js", "test/**/*.js"], { read: false })
    .pipe(clean());
});

gulp.task('run-test', function() {
  return gulp.src(["src/**/*.ts", "typings/**/*.d.ts", "test/**/*.ts"], { base: "." })
    .pipe(ts(tsProject))
    .pipe(to5({
      modules: "common"
    }))
    .pipe(gulp.dest("."))
    .pipe(mocha({
      require: ["babel-polyfill"]
    }));
});

gulp.task('test', function(callback) {
  return runSequence('run-test', 'test-clean', callback);
});

gulp.task('test-tdd', function() {
  return gulp.watch(["src/**/*.ts", "test/**/*.ts"], ['test']);
});
