'use strict';
var yeoman = require('yeoman-generator');
// var chalk = require('chalk');
var slug = require('slug');
// var yosay = require('yosay');
var toArray = require('keywords-array');
var fs = require('fs');

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
      'default': '',
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
    this.installDependencies({
      skipInstall: this.options['skip-install']
    });

    if (this.ghRepo) {
      var git = this.spawnCommand('git', ['init']);
      git.on('close', function() {
        this.spawnCommand('hub', ['create', '-d', this.description]);
      });
    }
    if (this.register) {
      this.spawnCommand('bower', ['register', this.appNameSlug, this.ghUrl]);
    }
  },
  end: function() {
    // write json here b/c easier than template
    var bow = JSON.parse(
      fs.readFileSync(this.destinationPath('bower.json'))
    );
    bow.keywords = this.keywords;
    this.fs.writeFileSync(JSON.stringify(bow));
  }
});
