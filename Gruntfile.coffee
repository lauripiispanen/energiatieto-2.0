module.exports = (grunt) ->
	
	grunt.initConfig
		compass:
			dist:
				options:
					sassDir: 'src/sass'
					cssDir: 'dist/styles'

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
						port: '3000'
		watch:
            compass:
                files: ['src/sass/**/*.{scss,sass}'],
                tasks: ['compass']

	grunt.registerTask 'default', ['concurrent:server']
	grunt.registerTask 'travis', ['compass']

	for key, value of require('./package.json').devDependencies
		if (key.indexOf('grunt-') == 0)
			grunt.loadNpmTasks key

	grunt.renameTask 'regarde', 'watch'