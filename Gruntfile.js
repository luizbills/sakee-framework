module.exports = function(grunt) {

  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    'pkg': grunt.file.readJSON('package.json'),

    'banner': '/*! <%= pkg.name %> v<%= pkg.version %> <<%= pkg.url =>>\n'
            + ' *  Copyright 2014 Luiz "Bills" <luizpbills@gmail.com>\n'
            + ' *  Licensed under MIT License\n'
            + ' */\n',

    'concat': {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        src: [
          'src/intro.js',
          'src/sakee/libs/event-emitter.js',
          'src/sakee/libs/string-map.js',
          'src/sakee/entity.js',
          'src/sakee/component.js',
          'src/sakee/system.js',
          'src/sakee/index.js',
          'src/outro.js'
        ],
        dest: 'dist/<%= pkg.name %>.js',
      },
    },

    'uglify': {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
        }
      }
    }
  });

  grunt.registerTask('default', ['concat', 'uglify']);

};
