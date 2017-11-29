# HueKins
[![Build Status](https://travis-ci.org/webdevian/huekins.svg?branch=master)](https://travis-ci.org/webdevian/huekins)

Connect your JenkinsCI server to a Philips Hue light. HueKins polls JenkinsCI job(s) for the lastBuild status and set the colour of a Philips Hue bulb accordingly

## Installation

Clone this repo and run `node index.js` to start the service

## Configuration

All configuration can be set up in a .env file:

```yaml
# The Address of your Philips Hue Bridge
HUE_HOST=192.168.0.2

# The port to access your Philips Hue Bridge
HUE_PORT=80

# your Philips Hue Bridge username
# (See https://www.developers.meethue.com/documentation/getting-started)
HUE_USERNAME= 

# The timeout on requests to your Hue
HUE_TIMEOUT=15000

# The name of the Hue light to use
LIGHT_NAME= 

# The base url of your jenkins instance
JENKINS_URL= 

# Comma separated list of jenkins jobs to 
# include. For github repos use the format 
# of org_name/repo_name/branch_name
JENKINS_JOBS= 
```
