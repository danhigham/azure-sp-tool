#!/usr/bin/env node
var _ = require('underscore');
var profile = require('azure-cli/lib/util/profile');
var utils = require('azure-cli/lib/util/utils');

var subscriptions = profile.current.subscriptions;
var defaultSub = _.find(subscriptions, function(s) { return s.isDefault === true; })

var azureTool = require('commander');

azureTool
  .version('0.1.0')
  .option('-s, --subscription [id]', 'Subscription ID (default: '+ defaultSub.id +')', defaultSub.id)
  .parse(process.argv);

var subscription = subscriptions[azureTool.subscription];
var client = utils.createComputeManagementClient(subscription);

var region = azureTool.args[0].toLowerCase();

client.usageOperations.list(region, function(err, usage) {
  var cores = _.find(usage, function(u) { return u.name.value === 'cores'; });
  process.stdout.write("\tLimit (cores): ")
  process.stdout.write(cores.limit + "\n")
});
