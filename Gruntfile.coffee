module.exports = (grunt) ->
    
    grunt.initConfig
        compass:
            dist:
                options:
                    sassDir: 'src/sass'
                    cssDir: 'dist/styles'
        bower:
            install:
                options:
                    targetDir: 'dist/components'
                    install: true
        concurrent:
            server:
                tasks: ['nodemon', 'watch']
                options:
                    logConcurrentOutput: true
        nodemon:
            server:
                options:
                    file: 'src/server.js'
                    env:
                        PORT: '3000'
        watch:
            compass:
                files: ['src/sass/**/*.{scss,sass}'],
                tasks: ['compass']
        clean:
            npm: "node_modules"

    grunt.registerTask 'default', ['bower:install','compass','concurrent:server']
    grunt.registerTask 'travis', ['bower:install','compass']

    for key, value of require('./package.json').devDependencies
        if (key.indexOf('grunt-') == 0)
            grunt.loadNpmTasks key

    grunt.renameTask 'regarde', 'watch'