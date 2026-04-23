# Application Use Case
This is an application to generate user pairings based off of a CSV file, with the template being in examples/ folder. It should generate pairings and store them in Azure Table storage. It should allow the selection of date being run and should not return the same pairing twice.

It will be run monthly and should cater for additions and removal from the CSV file.

It should also have APIs that can reset the user pairings and check for pairing exhaustion which should be deployed within the API app service. It should also present the current pairing exhaustion in the form of a percentage

It should alos output the pairings in an easy to download or copy and paste format.

## App Services
- FrontEnd- app-cc-fe-wcus-001
- API - app-cc-api-wcus-001

## Table Storage
- Storage Account - saccwcus001

## Build 
- This is to be built on github actions with the pipeline modelled off of the build-deploy.yml file in the templates/ folder
- The app services are deployed with Node 24
- I will not be testing this on my laptop and it should deploy straight to Azure

## Design
- Sleek, modern and clean
- Dark mode option