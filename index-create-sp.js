#!/usr/bin/env node
var _ = require('underscore');
var async = require('async');
var fs = require('fs');

var profile = require('azure-cli/lib/util/profile');
var utils = require('azure-cli/lib/util/utils');
var adUtils = require('azure-cli/lib/commands/arm/ad/adUtils');
var log = require('azure-cli/lib/util/logging');
var rbacClients = require('azure-cli/lib/commands/arm/role/rbacClients');
var RoleAssignments = require('azure-cli/lib/commands/arm/role/roleAssignments');
var moment = require('moment');

var azureTool = require('commander');

var subscriptions = profile.current.subscriptions;
var defaultSub = _.find(subscriptions, function(s) { return s.isDefault === true; })

azureTool
  .version('0.1.0')
  .option('-s, --subscription [id]', 'Subscription ID (default: '+ defaultSub.id +')', defaultSub.id)
  .parse(process.argv);

var tenantId = defaultSub.tenantId;

var make_passwd = function(n, a) {
  var index = (Math.random() * (a.length - 1)).toFixed(0);
  return n > 0 ? a[index] + make_passwd(n - 1, a) : '';
};

// create ad application
// CLIENTID=`azure ad app create --name "$PCFBOSHNAME" --password "$CLIENTSECRET" --identifier-uris ""$IDURIS"" --home-page ""$HOMEPAGE""

var uuid = utils.uuidGen().substr(24, 12);
var appName = "PCFBOSHv" + uuid;
var idURIs = "http://PCFBOSHv" + uuid;
var homepage = "http://PCFBOSHv" + uuid;
var spName="http://PCFBOSHv" + uuid;
var password = make_passwd(13, 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890');

var now = new Date(Date.now());

var appParams = {
  availableToOtherTenants: false,
  displayName: appName,
  homepage: homepage,
  identifierUris: [idURIs],
  passwordCredentials: [{
    startDate: now,
    endDate: function () {
      var date = new Date(now);
      var m = moment(date);
      m.add(1, 'years');
      date = new Date(m.toISOString());
      return date;
    }(),
    keyId: utils.uuidGen(),
    value: password
  }]
};

var keyType = 'AsymmetricX509Cert';
var keyUsage = 'Verify';

var client = utils.createGraphManagementClient(defaultSub);

function assignContribRole (clientId, sp, first, callback) {

  if (first) process.stdout.write("Assigning contributor role.");

  var authzClient = rbacClients.getAuthzClient(defaultSub);

  var scope = RoleAssignments.buildScopeString({
    subscriptionId: defaultSub.id,
  });

  authzClient.roleDefinitions.list(
    scope,
    { roleName: 'Contributor' },
    function(err, roles) {

      var parameter = {
        properties: {
          principalId: sp.objectId,
          roleDefinitionId: roles.roleDefinitions[0].id,
          scope: scope
        }
      };

      var roleAssignmentNameGuid = utils.uuidGen();
      authzClient.roleAssignments.create(scope, roleAssignmentNameGuid, parameter, function (err, assignment) {

        process.stdout.write(".");

        if (err !== null) {
          setTimeout (function() {
            assignContribRole (clientId, sp, false, callback);
          }, 5000);
        } else {
          process.stdout.write(" done\n");
          callback(clientId, sp, assignment, false);
        }
      });
    }
  );
}

async.waterfall([
  function(callback) {
    process.stdout.write("Creating application...")
    client.applicationOperations.create(appParams, function(err, app, resp) {
      process.stdout.write(" done\n")
      callback(null, app.appId);
    });
  },
  function(clientId, callback) {
    process.stdout.write("Creating service principal...")
    client.servicePrincipalOperations.create({
      accountEnabled: true,
      appId: clientId
    }, function(err, sp, resp) {
      process.stdout.write(" done\n")
      callback(null, clientId, sp, true);
    });
  },
  assignContribRole
], function(err, clientId, sp, assignment) {

  var output = {
    subscriptionID: defaultSub.id,
    tenantID: defaultSub.tenantId,
    clientID: clientId,
    clientSecret: password
  };

  fs.writeFile("./azure-credentials.json", JSON.stringify(output, null, 4), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("Credentials written to azure-credentials.json");
  });
});
