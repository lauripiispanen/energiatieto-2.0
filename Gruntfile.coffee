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
		watch: {}

	grunt.registerTask 'default', ['concurrent:server']
	grunt.registerTask 'travis', []

	for key, value of require('./package.json').devDependencies
		if (key.indexOf('grunt-') == 0)
			grunt.loadNpmTasks key

	grunt.renameTask 'regarde', 'watch'