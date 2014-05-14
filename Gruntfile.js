module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        uglify: {
            modernizr: {
                files: {
                    "src/sgd/frontend/yeastgenome/static/js/vendor/modernizr.min.js": ["bower_components/modernizr/modernizr.js"]
                }
            },
            datatables: {
                files: {
                    "src/sgd/frontend/yeastgenome/static/js/vendor/datatables/datatables.min.js": ["bower_components/datatables/media/js/jquery.datatables.js"]
                }
            },
            nouislider: {
                files: {
                    "src/sgd/frontend/yeastgenome/static/js/vendor/nouislider.min.js": ["bower_components/nouislider/jquery.nouislider.js"]
                }
            }
        },
        bowercopy: {
            js: {
                options: {
                    destPrefix: "src/sgd/frontend/yeastgenome/static/js"
                },
                files: {
                    "vendor/cytoscape.min.js": "cytoscape/documentation/js/cytoscape.min.js",
                    "vendor/arbor.js": "cytoscape/documentation/js/arbor.js",
                    "vendor/foundation.min.js": "foundation/js/foundation.min.js",
                    "vendor/jquery.min.js": "jquery-legacy/dist/jquery.min.js",
                    "vendor/kinetic.min.js": "kineticjs/kinetic.min.js",
                    "vendor/respond.min.js": "respond/dest/respond.min.js",
                    "vendor/rem.min.js": "rem-unit-polyfill/js/rem.min.js"
                }
            },
            scss: {
                options: {
                    destPrefix: "src/sgd/frontend/yeastgenome/static/scss"
                },
                files: {
                    "normalize.scss": "foundation/scss/normalize.scss",
                    "vendor/_nouislider.scss": "nouislider/jquery.nouislider.css"
                }
            },
            font: {
                files: {
                    "src/sgd/frontend/yeastgenome/static/font": "font-awesome/font"
                }
            }
        }
    });
    
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks("grunt-bowercopy");
    
    grunt.registerTask('default', ['uglify', 'bowercopy']);
};