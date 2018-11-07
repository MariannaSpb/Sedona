"use strict";

var gulp = require("gulp");
var sass = require("gulp-sass");
var plumber = require("gulp-plumber");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var replace = require('gulp-replace-task');
var csso = require("gulp-csso"); // минификатор
var rename = require("gulp-rename"); // для переименования файла
var imagemin = require("gulp-imagemin"); // оптимизация картинок
var webp = require("gulp-webp"); //конвертация в webp
var svgstore = require("gulp-svgstore"); // создание свг спрайта
var posthtml = require("gulp-posthtml"); // шаблонизируем хтмл
var include = require("posthtml-include"); // добавить в разметку
var del = require("del"); // перед новой сборкой удалить build

gulp.task("css", function () {
  return gulp.src("source/sass/style.scss")
    .pipe(plumber())
    .pipe(sass())
    .pipe(postcss([
      autoprefixer()
    ]))
    .pipe(replace({
      patterns: [{
          match: /}(?=\n[^\n}])/g,
          replacement: '}\n'
        },
        {
          match: / }/g,
          replacement: '}\n'
        }
      ],
      usePrefix: false
    }))
    .pipe(gulp.dest("build/css"))
    .pipe(csso())
    .pipe(rename("style.min.css")) //  style.min.css перенеси в разметку
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});


gulp.task("images", function () { // уменьшить картинки
  return gulp.src("source/img/**/*.{png,jpg,svg}")
    .pipe(imagemin([
      imagemin.optipng({
        optimizationLevel: 3
      }),
      imagemin.jpegtran({
        progressive: true
      }),
      imagemin.svgo()
    ]))
    .pipe(gulp.dest("build/img"));
});

gulp.task("webp", function () { // webp
  return gulp.src("source/img/**/*.{png,jpg}")
    .pipe(webp({
      quality: 90
    }))
    .pipe(gulp.dest("build/img"));
});

gulp.task("sprite", function () { //  svg спрайт
  return gulp.src("source/img/icon-*.svg")
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"));
});

gulp.task("html", function () {
  return gulp.src("source/*.html")
    .pipe(posthtml([
      include()
    ]))
    .pipe(gulp.dest("build"));
});

gulp.task("copy", function () { // перенос в папку build
  return gulp.src([
      "source/fonts/**/*.{woff,woff2}",
      "source/js/**",
      "source/**/*.html"
    ], {
      base: "source"
    })
    .pipe(gulp.dest("build"));
});

gulp.task("clean", function () { // удалить build перед  новой сборкой
  return del("build");
});

gulp.task("build", gulp.series( // сборка
  "clean",
  "copy",
  "webp",
  "images",
  "css",
  "sprite",
  "html",

));

gulp.task("server", function () { // отслеживаем изменения в файлах и пересобираем проект
  server.init({
    server: "build/",
  });

  gulp.watch("source/sass/**/*.{scss,sass}", gulp.series("css"));
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
});

gulp.task("refresh", function (done) {
  server.reload();
  done();
});

gulp.task("start", gulp.series("build", "server"));
