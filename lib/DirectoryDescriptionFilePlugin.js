/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
function DirectoryDescriptionFilePlugin(filename, fields) {
	this.filename = filename;
	this.fields = fields;
}
module.exports = DirectoryDescriptionFilePlugin;

DirectoryDescriptionFilePlugin.prototype.apply = function(resolver) {
	var filename = this.filename;
	var fields = this.fields;
	resolver.plugin("directory", function(request, callback) {
		var fs = this.fileSystem;
		var directory = this.join(request.path, request.request);
		fs.readFile(this.join(directory, filename), function(err, content) {
			if(err) return callback();
			content = content.toString("utf-8");
			try {
				content = JSON.parse(content);
			} catch(e) {
				return callback(e);
			}
			var mainModules = [];
			for(var i = 0; i < fields.length; i++) {
				if(Array.isArray(fields[i])) {
					var current = content;
					for(var j = 0; j < fields[i].length; j++) {
						if(current === null || typeof current !== "object") {
							current = null;
							break;
						}
						var field = fields[i][j];
						current = current[field];
					}
					if(typeof current === "string") {
						mainModules.push(current);
						continue;
					}
				} else {
					var field = fields[i];
					if(typeof content[field] === "string") {
						mainModules.push(content[field]);
						continue;
					}
				}
			}
			(function next() {
				if(mainModules.length == 0) return callback();
				return this.doResolve(["file", "directory"], {
					path: directory,
					query: request.query,
					request: mainModules.shift()
				}, function(err, result) {
					if(!err && result) return callback(null, result);
					return next.call(this);
				}.bind(this));
			}.call(this))
		}.bind(this));
	});
};