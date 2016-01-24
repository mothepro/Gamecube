module.exports = function(grunt) {
    grunt.initConfig({
        browserify: {
            example: {
                files: [{
                    src: 'example/assets/script.js',
                    dest: 'example/bundle.js'
                }],
                options: {
                    transform: ['brfs']
                }
            }
        },
        uglify: {
            example: {
                src: 'example/bundle.js',
                dest: 'example/bundle.min.js'
            }
        },
        watch: {
            example: {
                files: ['*.js', 'lib/**.js', 'example/assets/**.js'],
                tasks: ['build']
            }
        },
        clean: ['example/bundle.js'] //, 'example/bundle.min.js']
    });

    // Load the npm tasks
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-clean');

    // Tasks task(s).
    grunt.registerTask('build', ['clean', 'browserify']);
    grunt.registerTask('default', ['watch']);
};