'use strict';
var yeoman = require('yeoman-generator');
// var chalk = require('chalk');
var slug = require('slug');
// var yosay = require('yosay');
var toArray = require('keywords-array');
var fs = require('fs');
var async = require('async');

module.exports = yeoman.generators.Base.extend({
  initializing: function () {
    this.pkg = require('../package.json');
  },

  prompting: function () {
    var done = this.async();

    var prompts = [{
      type: 'input',
      name: 'appName',
      message: 'Project name: ',
      default: this.appname
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description: '
    },
    { type: 'input',
      name: 'mainFile',
      message: 'Main file: ',
      default: '_'+slug(this.appname)+'.scss'
    },
    {
      name: 'keywords',
      message: 'keywords',
      type: 'input'
    },
    {
      name: 'ghRepo',
      message: 'Create repo on github?',
      'default': true,
      type: 'confirm'
    },
    {
      when: function(answers) {
        return answers.ghRepo;
      },
      name: 'register',
      message: 'Register with bower?',
      'default': true,
      type: 'confirm'
    },];

    this.prompt(prompts, function (props) {
      this.appName = props.appName;
      this.appNameSlug = slug(props.appName);
      this.mainFile = props.mainFile;
      this.description = props.description;
      this.keywords = toArray(props.keywords);
      this.ghRepo = props.ghRepo;
      this.register = this.ghRepo ? props.register : false;
      this.ghUrl = 'https://github.com/nichoth/' + this.appNameSlug;

      done();
    }.bind(this));
  },

  writing: {
    app: function () {
      this.fs.copyTpl(
        this.templatePath('_bower.json'),
        this.destinationPath('bower.json'),
        this
      );
      this.fs.copyTpl(
        this.templatePath('example/_index.html'),
        this.destinationPath('example/index.html'),
        this
      );
      this.fs.copyTpl(
        this.templatePath('example/_style.scss'),
        this.destinationPath('example/style.scss'),
        this
      );
      this.fs.copyTpl(
        this.templatePath('_readme.md'),
        this.destinationPath('readme.md'),
        this
      );
    },

    projectfiles: function () {
      this.fs.copy(
        this.templatePath('editorconfig'),
        this.destinationPath('.editorconfig')
      );
      this.fs.copy(
        this.templatePath('_gitignore'),
        this.destinationPath('.gitignore')
      );
    }
  },

  install: function () {
  },

  end: function() {
    var done = this.async();
    var self = this;

    // write keywords here b/c easier than template
    function keywords(cb) {
      var bowJson;
      fs.readFile(self.destinationPath('bower.json'), function(err, file) {
        if (err) throw err;
        bowJson = JSON.parse(file);
        bowJson.keywords = self.keywords;
        fs.writeFile(
          self.destinationPath('bower.json'),
          JSON.stringify(bowJson, null, 2),
          cb
        );
      }.bind(self));
    }

    async.parallel([
      gitStuff.bind(self),
      keywords.bind(self)
    ], function() {
      bowReg.call(self, done);
    }.bind(self));

    function gitStuff(cb) {
      var
        git = self.spawnCommand.bind(self, 'git', ['init']),
        add = self.spawnCommand.bind(self, 'git', ['add', '.']),
        commit = self.spawnCommand.bind(self, 'git', ['commit', '-m', 'first commit']),
        // tag = self.spawnCommand.bind('git', ['tag', 'v0.0.0']),
        hub = self.spawnCommand.bind(self, 'hub', ['create', '-d', self.description]),
        push = self.spawnCommand.bind(self, 'git', [
          'push', '-u', 'origin', 'master', '--follow-tags'
        ])
      ;
      if (self.ghRepo) {
        git().on('close', function() {
          async.parallel([
            function(cb) {
              add().on('close', function() {
                commit().on('close', function() {
                  cb();
                });
              });
            },
            function(cb) {
              hub().on('close', cb);
            }
          ], function(err) {
            if (err) throw err;
            push().on('close', cb);
          }.bind(self));
        });
      } else {
        cb();
      }
    }

    function bowReg(cb) {
      if (self.register) {
        self.spawnCommand('bower', ['register', self.appNameSlug, self.ghUrl])
          .on('close', cb);
      } else {
        cb();
      }
    }

  }
});
