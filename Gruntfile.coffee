module.exports = (grunt) ->
	
	grunt.initConfig
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

	for key, value of require('./package.json').devDependencies
		if (key.indexOf('grunt-') == 0)
			grunt.loadNpmTasks key

	grunt.renameTask 'regarde', 'watch'