#!/usr/bin/env node
var _ = require('underscore');

var profile = require('azure-cli/lib/util/profile');
var azureTool = require('commander');

var subscriptions = profile.current.subscriptions;
var defaultSub = _.find(subscriptions, function(s) { return s.isDefault === true; })

azureTool
  .version('1.0.9')
  .option('-s, --subscription [id]', 'Subscription ID (default: '+ defaultSub.id +')', defaultSub.id)
  .command('show-quota [region]', 'Show CPU quota for a given region')
  .command('create-sp', 'Create a service principal')
  .parse(process.argv);
