# azure-sp-tool

This tool automates the steps to create Azure service principal for both unix and windows. 
More information on service principal can be found [here](https://azure.microsoft.com/en-us/documentation/articles/resource-group-authenticate-service-principal/).

Prerequisites
------------
Install Azure CLI. For Linux/Unix/Mac OS X, follow these [instructions](https://azure.microsoft.com/en-us/documentation/articles/xplat-cli-install/) to install the Azure CLI. 
 

Installation
------------

* `npm install azure-sp-tool -g`


Create Service Principal
------------

* `azure login` - First login to your azure account

* `azure account list` - Make sure your desired subscription is set to default

* `azure-sp-tool create-sp` - Service principal is output to azure-credentials.json file
